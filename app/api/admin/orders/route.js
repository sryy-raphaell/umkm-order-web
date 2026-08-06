import { prisma } from "../../../../lib/prisma";
import { verifyAdminAuth } from "../../../../lib/adminAuth";

// GET /api/admin/orders — semua order untuk halaman admin
export async function GET() {
  const isAuth = await verifyAdminAuth();
  if (!isAuth) {
    return Response.json({ error: "Akses ditolak: Silakan login admin" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, phone: true, lid: true },
        },
      },
    });
    return Response.json(orders);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}