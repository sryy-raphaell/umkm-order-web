import { prisma } from "../../../../lib/prisma";

function normalizeWa(no) {
  const digits = (no || "").replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return "62" + digits;
}

export async function GET(request, { params }) {
  const { slug } = await params;
  const umkm = await prisma.umkm.findUnique({
    where: { slug },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      komunitas: true,
    },
  });
  if (!umkm) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(umkm);
}

// PUT dan DELETE dipanggil dari admin panel memakai id, bukan slug,
// supaya slug boleh diganti tanpa masalah lookup.
export async function PUT(request, { params }) {
  const { slug } = await params; // di sini "slug" sebenarnya menerima id juga
  const body = await request.json();
  const umkm = await prisma.umkm.update({
    where: isNaN(Number(slug)) ? { slug } : { id: Number(slug) },
    data: {
      namaOwner: body.namaOwner,
      namaUsaha: body.namaUsaha,
      alamatUsaha: body.alamatUsaha,
      noHpWa: body.noHpWa ? normalizeWa(body.noHpWa) : undefined,
      logoUrl: body.logoUrl,
      posterUrl: body.posterUrl,
      isActive: body.isActive,
    },
  });
  return Response.json(umkm);
}

export async function DELETE(request, { params }) {
  const { slug } = await params;
  await prisma.umkm.delete({
    where: isNaN(Number(slug)) ? { slug } : { id: Number(slug) },
  });
  return Response.json({ success: true });
}