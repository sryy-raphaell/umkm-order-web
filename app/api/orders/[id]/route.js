import { prisma } from "../../../../lib/prisma";

// Kirim notif WA via bot
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

// Alur status valid berdasarkan tipe order
function getValidTransitions(orderItems, currentStatus) {
  // Cek apakah ada item tipe layanan
  const hasService = Array.isArray(orderItems)
    ? orderItems.some((i) => i.type === "service")
    : false;

  if (hasService) {
    // Layanan: pending → negosiasi → pembayaran → pembuatan → pengiriman → selesai
    const flow = ["pending", "negosiasi", "pembayaran", "pembuatan", "pengiriman", "selesai", "dibatalkan"];
    const idx = flow.indexOf(currentStatus);
    if (idx === -1) return ["dibatalkan"];
    // Bisa maju ke next, atau dibatalkan dari mana saja (kecuali sudah selesai)
    const next = flow[idx + 1];
    const transitions = next ? [next] : [];
    if (currentStatus !== "selesai" && currentStatus !== "dibatalkan") {
      transitions.push("dibatalkan");
    }
    return transitions;
  } else {
    // Produk: pending → pembayaran → pengiriman → selesai
    const flow = ["pending", "pembayaran", "pengiriman", "selesai", "dibatalkan"];
    const idx = flow.indexOf(currentStatus);
    if (idx === -1) return ["dibatalkan"];
    const next = flow[idx + 1];
    const transitions = next ? [next] : [];
    if (currentStatus !== "selesai" && currentStatus !== "dibatalkan") {
      transitions.push("dibatalkan");
    }
    return transitions;
  }
}

// Pesan notif WA per status
function buildStatusMessage(order, newStatus, userName) {
  const statusEmoji = {
    negosiasi:  "🤝",
    pembayaran: "💳",
    pembuatan:  "🔧",
    pengiriman: "🚚",
    selesai:    "✅",
    dibatalkan: "❌",
  };

  const statusDesc = {
    negosiasi:  "Order kamu masuk ke tahap *negosiasi harga*. Admin akan segera menghubungimu atau kamu bisa mengajukan penawaran via bot.",
    pembayaran: `Order kamu siap untuk pembayaran.\n\n💰 Jumlah yang harus dibayar:\n*Rp ${Math.ceil((order.negotiatedPrice ?? order.total) / 2).toLocaleString("id-ID")}* (50% DP)\n\nSilakan transfer dan konfirmasi ke admin.`,
    pembuatan:  "Pembayaran DP diterima! 🎉 Order kamu sekarang sedang dalam proses *pembuatan*.",
    pengiriman: "Order kamu sudah *dikirim*! 🚚 Admin akan memberikan info pengiriman lebih lanjut.",
    selesai:    "Order kamu telah *selesai*! ✅ Terima kasih sudah berbelanja di SyRa Store 🙏",
    dibatalkan: "Order kamu telah *dibatalkan*. Hubungi admin jika ada pertanyaan.",
  };

  const emoji = statusEmoji[newStatus] || "📋";
  const desc = statusDesc[newStatus] || `Status order diupdate ke: ${newStatus}`;

  return `${emoji} *Update Order #${order.id}*\n\nHalo ${userName}!\n\n${desc}\n\nKetik *!status* untuk cek detail order.`;
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { status, note } = body;

    // Ambil order + user
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!existing) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Validasi transisi status
    const validNext = getValidTransitions(existing.items, existing.status);
    if (!validNext.includes(status)) {
      return Response.json(
        {
          error: `Transisi tidak valid: ${existing.status} → ${status}`,
          validTransitions: validNext,
        },
        { status: 400 }
      );
    }

    // Update order
    const updateData = { status };
    if (note !== undefined) updateData.note = note;

    // Untuk pembayaran layanan: set negotiatedPrice ke total jika belum ada offer
    if (status === "pembayaran" && !existing.negotiatedPrice) {
      updateData.negotiatedPrice = existing.total;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { user: true },
    });

    // Kirim notif WA ke user
    const notifMsg = buildStatusMessage(order, status, order.user.name);
    await notifyUser(order.user.phone, notifMsg);

    return Response.json(order);
  } catch (err) {
    console.error("PATCH order error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!existing) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    await prisma.order.delete({ where: { id: orderId } });

    // Notif WA
    await notifyUser(
      existing.user.phone,
      `❌ *Order #${orderId} dihapus*\n\nOrder atas nama ${existing.user.name} telah dihapus dari sistem oleh admin.`
    );

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// GET single order (untuk polling status dari user)
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { name: true, phone: true } } },
    });
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(order);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}