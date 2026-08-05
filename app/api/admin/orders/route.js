import { prisma } from "../../../../lib/prisma";

// GET /api/admin/orders — semua order untuk halaman admin
export async function GET() {
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