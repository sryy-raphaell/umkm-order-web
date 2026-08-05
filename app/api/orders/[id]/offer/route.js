import { prisma } from "../../../../../lib/prisma";

async function notifyUser(phone, message) {
  try {
    const res = await fetch("http://localhost:3002/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    });
    const result = await res.json();
    return result.success === true;
  } catch {
    return false;
  }
}

// POST /api/orders/[id]/offer
// Body: { from: "user"|"admin", amount: number, message: string }
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const { from, amount, message } = await request.json();

    if (!from || !amount) {
      return Response.json({ error: "from and amount required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Hanya bisa tawar saat status pending atau negosiasi
    if (!["pending", "negosiasi"].includes(order.status)) {
      return Response.json(
        { error: "Penawaran hanya bisa dilakukan saat status pending atau negosiasi" },
        { status: 400 }
      );
    }

    // Tambah offer baru ke array
    const currentOffers = Array.isArray(order.priceOffers) ? order.priceOffers : [];
    const newOffer = {
      id: Date.now(),
      from,
      amount,
      message: message || "",
      createdAt: new Date().toISOString(),
      status: "pending", // pending | accepted | rejected
    };

    const updatedOffers = [...currentOffers, newOffer];

    // Update order: tambah offer + set status negosiasi jika masih pending
    const updateData = { priceOffers: updatedOffers };
    if (order.status === "pending") {
      updateData.status = "negosiasi";
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { user: true },
    });

    // Kirim notif ke pihak lain
    if (from === "user") {
      // Notif ke admin — bisa via WA nomor admin atau log saja
      console.log(
        `💬 Penawaran dari user ${order.user.name}: Rp ${amount.toLocaleString("id-ID")} — "${message}"`
      );
      // Konfirmasi ke user
      await notifyUser(
        order.user.phone,
        `✅ *Penawaran terkirim!*\n\nOrder #${orderId}\nPenawaran kamu: *Rp ${amount.toLocaleString("id-ID")}*\n${message ? `Pesan: "${message}"\n` : ""}
Admin akan meninjau dan merespons segera. Ketik *!status* untuk cek update.`
      );
    } else {
      // Admin counter-offer → notif ke user
      await notifyUser(
        order.user.phone,
        `🤝 *Penawaran dari Admin — Order #${orderId}*\n\nHalo ${order.user.name}!\n\nAdmin mengajukan harga: *Rp ${amount.toLocaleString("id-ID")}*\n${message ? `Pesan admin: "${message}"\n` : ""}
Balas dengan perintah bot untuk menerima atau mengajukan counter:
• *!terima ${orderId}* — terima penawaran ini
• *!tawar ${orderId} [harga] [pesan]* — ajukan counter-offer`
      );
    }

    return Response.json(updated);
  } catch (err) {
    console.error("POST offer error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/orders/[id]/offer
// Body: { offerId: number, action: "accept"|"reject" }
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const { offerId, action } = await request.json();

    if (!offerId || !action) {
      return Response.json({ error: "offerId and action required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const currentOffers = Array.isArray(order.priceOffers) ? order.priceOffers : [];
    const offerIndex = currentOffers.findIndex((o) => o.id === offerId);

    if (offerIndex === -1) {
      return Response.json({ error: "Offer not found" }, { status: 404 });
    }

    const targetOffer = currentOffers[offerIndex];

    // Update status offer
    const updatedOffers = currentOffers.map((o) =>
      o.id === offerId ? { ...o, status: action === "accept" ? "accepted" : "rejected" } : o
    );

    const updateData = { priceOffers: updatedOffers };

    // Jika diterima: set negotiatedPrice
    if (action === "accept") {
      updateData.negotiatedPrice = targetOffer.amount;
      updateData.status = "negosiasi"; // tetap negosiasi, admin yang advance ke pembayaran
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { user: true },
    });

    // Notif ke user
    if (action === "accept") {
      await notifyUser(
        order.user.phone,
        `✅ *Penawaran Diterima! — Order #${orderId}*\n\nHalo ${order.user.name}!\n\nHarga telah disepakati: *Rp ${targetOffer.amount.toLocaleString("id-ID")}*\n\nAdmin akan segera memproses ke tahap pembayaran. Ketik *!status* untuk cek update.`
      );
    } else {
      await notifyUser(
        order.user.phone,
        `❌ *Penawaran Ditolak — Order #${orderId}*\n\nHalo ${order.user.name}!\n\nPenawaran sebesar Rp ${targetOffer.amount.toLocaleString("id-ID")} ditolak.\n\nKamu bisa ajukan penawaran baru dengan:\n*!tawar ${orderId} [harga] [pesan]*`
      );
    }

    return Response.json(updated);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}