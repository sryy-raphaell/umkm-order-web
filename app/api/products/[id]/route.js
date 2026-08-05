import { prisma } from "../../../../lib/prisma";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const item = await prisma.item.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      type: body.type || "produk",
      price: body.price ? parseInt(body.price) : null,
      description: body.description,
      longDescription: body.longDescription || null,
      images: body.images || [],
      umkmId: body.umkmId ? parseInt(body.umkmId) : undefined,
    },
  });
  return Response.json(item);
}

export async function GET(request, { params }) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id: parseInt(id) },
    include: { umkm: true },
  });
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(item);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await prisma.item.delete({ where: { id: parseInt(id) } });
  return Response.json({ success: true });
}
