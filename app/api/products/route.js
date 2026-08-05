import { prisma } from "../../../lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const umkmId = searchParams.get("umkmId");

  const items = await prisma.item.findMany({
    where: umkmId ? { umkmId: parseInt(umkmId) } : undefined,
    include: { umkm: true },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(items);
}

export async function POST(request) {
  const body = await request.json();

  if (!body.umkmId) {
    return Response.json({ error: "umkmId wajib diisi" }, { status: 400 });
  }

  const item = await prisma.item.create({
    data: {
      name: body.name,
      type: body.type || "produk",
      price: body.price ? parseInt(body.price) : null,
      description: body.description,
      longDescription: body.longDescription || null,
      images: body.images || [],
      umkmId: parseInt(body.umkmId),
    },
  });
  return Response.json(item);
}
