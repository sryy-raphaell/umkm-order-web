import { prisma } from "../../../lib/prisma";

function generateToken() {
  return "SRY-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateGroupId() {
  return "GRP-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Kirim pesan ke nomor manapun via wa-bot HTTP API (port 3002).
// Dipakai untuk notify pembeli MAUPUN notify UMKM (nomor toko).
async function notifyWa(phone, message) {
  try {
    const res = await fetch("http://localhost:3002/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    });
    const result = await res.json();
    return result.success === true;
  } catch (err) {
    console.log("WA notify failed (bot offline?):", err.message);
    return false;
  }
}

export async function POST(request) {
  const { name, phone, items, total } = await request.json();

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Keranjang kosong" }, { status: 400 });
  }

  const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
  const token = generateToken();

  const user = await prisma.user.upsert({
    where: { phone: cleanPhone },
    update: { name, linkToken: token },
    create: { phone: cleanPhone, name, linkToken: token },
  });

  // ── Kelompokkan item cart berdasarkan umkmId ──────────────────────────────
  // item cart yang dikirim dari frontend membawa umkmId & umkmNoHpWa
  // (lihat perubahan app/page.js / app/umkm/[slug]/page.js).
  const groups = new Map(); // umkmId -> { items: [], total, umkm }
  for (const it of items) {
    const key = it.umkmId ?? "unassigned";
    if (!groups.has(key)) {
      groups.set(key, { items: [], total: 0, umkmId: it.umkmId ?? null, umkmNoHpWa: it.umkmNoHpWa ?? null, umkmNamaUsaha: it.umkmNamaUsaha ?? null });
    }
    const g = groups.get(key);
    g.items.push(it);
    g.total += it.price * it.qty;
  }

  const checkoutGroupId = groups.size > 1 ? generateGroupId() : null;
  const createdOrders = [];

  for (const g of groups.values()) {
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        items: g.items,
        total: g.total,
        status: "pending",
        umkmId: g.umkmId,
        checkoutGroupId,
      },
    });
    createdOrders.push({ ...order, umkmNamaUsaha: g.umkmNamaUsaha });

    // Notify UMKM (toko) kalau ada order baru masuk untuk mereka
    if (g.umkmNoHpWa) {
      const itemList = g.items.map((i) => `- ${i.name} x${i.qty}`).join("\n");
      const storeMessage = `🔔 *Pesanan baru via PNC Katalog!*\n\nDari: ${name} (${cleanPhone})\n\n${itemList}\n\n💰 Total: Rp ${g.total.toLocaleString("id-ID")}\n\nSilakan hubungi pembeli langsung untuk konfirmasi.`;
      await notifyWa(g.umkmNoHpWa, storeMessage);
    }
  }

  // Notify pembeli — ringkasan semua order yang baru dibuat
  const summary = createdOrders
    .map((o) => `📦 *${o.umkmNamaUsaha || "Order"} #${o.id}* — Rp ${o.total.toLocaleString("id-ID")}`)
    .join("\n");
  const waMessage = `Halo ${name}! 👋\n\nTerima kasih sudah memesan lewat *Pasisia Night Culinary* 🎉\n\n${summary}\n\n🔑 *Token akun kamu:*\n${token}\n\nBalas pesan ini dengan perintah:\n*!link ${token}*\n\nuntuk menghubungkan WhatsApp kamu agar bisa cek status order kapan saja.`;
  const waSent = await notifyWa(cleanPhone, waMessage);

  return Response.json({
    success: true,
    checkoutGroupId,
    orders: createdOrders.map((o) => ({ id: o.id, umkmNamaUsaha: o.umkmNamaUsaha, total: o.total })),
    token,
    waSent,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lid = searchParams.get("lid");
  const phone = searchParams.get("phone");

  let user = null;

  if (lid) {
    user = await prisma.user.findUnique({
      where: { lid },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { umkm: true },
        },
      },
    });
  }

  if (!user && phone) {
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
    user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { umkm: true },
        },
      },
    });
  }

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(user);
}
