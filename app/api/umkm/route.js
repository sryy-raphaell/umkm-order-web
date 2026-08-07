import { prisma } from "../../../lib/prisma";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeWa(no) {
  const digits = (no || "").replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return "62" + digits;
}

export async function GET() {
  const umkm = await prisma.umkm.findMany({
    where: { isActive: true },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      komunitas: true,
    },
    orderBy: { namaUsaha: "asc" },
  });
  return Response.json(umkm);
}

export async function POST(request) {
  const body = await request.json();

  if (!body.namaOwner || !body.namaUsaha || !body.noHpWa) {
    return Response.json(
      { error: "namaOwner, namaUsaha, dan noHpWa wajib diisi" },
      { status: 400 },
    );
  }

  // pastikan slug unik
  const baseSlug = slugify(body.namaUsaha);
  let slug = baseSlug;
  let counter = 2;
  while (await prisma.umkm.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const umkm = await prisma.umkm.create({
    data: {
      namaOwner: body.namaOwner,
      namaUsaha: body.namaUsaha,
      alamatUsaha: body.alamatUsaha || "",
      noHpWa: normalizeWa(body.noHpWa),
      slug,
      logoUrl: body.logoUrl || null,
      posterUrl: body.posterUrl || null,
      komunitasId: body.komunitasId || null,
    },
  });

  return Response.json(umkm);
}