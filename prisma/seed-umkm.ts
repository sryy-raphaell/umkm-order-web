// prisma/seed-umkm.ts
// Jalankan: npx tsx prisma/seed-umkm.ts
// Aman dijalankan berkali-kali (upsert berdasarkan slug UMKM).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeWa(no: string): string {
  const digits = no.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return "62" + digits;
}

type ItemInput = { nama: string; deskripsi?: string };
type UmkmInput = {
  namaOwner: string;
  namaUsaha: string;
  alamatUsaha: string;
  noHpWa: string;
  produk: ItemInput[];
};

const KOMUNITAS_NAMA = "Komunitas Culinary Pasisia";
const KOMUNITAS_DESKRIPSI =
  "Komunitas UMKM kuliner Pesisir Selatan, penyelenggara event rutin Pasisia Night Culinary (PNC).";

const umkmData: UmkmInput[] = [
  { namaOwner: "Anggun Silvia Darfan", namaUsaha: "Donat Anggun", alamatUsaha: "Salido Kecil", noHpWa: "082272719348", produk: [{ nama: "Donat Paha" }, { nama: "Donat Bulat" }] },
  { namaOwner: "Dayat Pratama Putra", namaUsaha: "Bakso Mekar Tampa Cicil", alamatUsaha: "Sago", noHpWa: "081266921899", produk: [{ nama: "Bakso Mekar Mercon" }, { nama: "Bakso Mekar Kuah" }] },
  { namaOwner: "Dera Gusfitri", namaUsaha: "Bastias", alamatUsaha: "Painan-Pessel", noHpWa: "085220811518", produk: [{ nama: "Sala Bada" }, { nama: "Kupuak Leyak" }, { nama: "Risol" }, { nama: "Tahu Mercon" }, { nama: "Pangsit Telur Puyuh/Bakso" }] },
  { namaOwner: "Devit Titi Mulia", namaUsaha: "Dapoer Lala", alamatUsaha: "Painan-Pessel", noHpWa: "085159744909", produk: [{ nama: "Mie Olahan" }, { nama: "Ceker Dower" }] },
  { namaOwner: "Dinda Mauliza", namaUsaha: "Taraso Lamaknyo", alamatUsaha: "Painan-Pessel", noHpWa: "081275338254", produk: [{ nama: "Cireng" }, { nama: "Cimol" }, { nama: "Cilok Churros" }] },
  { namaOwner: "Endang Suryani", namaUsaha: "Ateng Burger", alamatUsaha: "Surantih", noHpWa: "082283834100", produk: [{ nama: "Burger" }, { nama: "Kebab" }, { nama: "Roti Jhon" }] },
  { namaOwner: "Erviela Desarta", namaUsaha: "SanAlida", alamatUsaha: "Painan-Pessel", noHpWa: "085155729765", produk: [{ nama: "Cake" }, { nama: "Brownies" }] },
  { namaOwner: "Fatma Dewi", namaUsaha: "NCD", alamatUsaha: "Painan-Pessel", noHpWa: "081374363040", produk: [{ nama: "Es Tebak" }, { nama: "Es Teller" }, { nama: "Soup Buah" }] },
  { namaOwner: "Frasetia Jaya", namaUsaha: "Telur Gulung Dilan", alamatUsaha: "Painan-Pessel", noHpWa: "087796700893", produk: [{ nama: "Telur Gulung" }] },
  { namaOwner: "Gema Trio Putra", namaUsaha: "Pokat Kotjok", alamatUsaha: "Painan-Pessel", noHpWa: "085363678461", produk: [{ nama: "Alpukat Kocok" }, { nama: "Durian Kocok" }] },
  { namaOwner: "Kasmita", namaUsaha: "Saiyo Corner", alamatUsaha: "Painan-Pessel", noHpWa: "082126767987", produk: [{ nama: "Aneka Gorengan" }, { nama: "Perkolakan" }, { nama: "Lapek Bugis" }] },
  { namaOwner: "Lila Handayani Harahap", namaUsaha: "To Jaboe", alamatUsaha: "Tarusan", noHpWa: "082285873505", produk: [{ nama: "Milkshake" }] },
  { namaOwner: "Jasmawati", namaUsaha: "Jas Sanjai", alamatUsaha: "Padang", noHpWa: "081364579184", produk: [{ nama: "Sanjai Balado" }, { nama: "Karak Kaliang" }, { nama: "Taleh Balado" }, { nama: "Keripik Kentang" }, { nama: "Aneka Camilan Lainnya" }] },
  { namaOwner: "Nadya Yulimaldevi", namaUsaha: "My Dinsum", alamatUsaha: "Tarusan", noHpWa: "082387314107", produk: [{ nama: "Risoles" }, { nama: "Dimsum" }] },
  { namaOwner: "Melisa Triadini", namaUsaha: "Dapurimi", alamatUsaha: "Painan-Pessel", noHpWa: "081268162656", produk: [{ nama: "Dimsum" }, { nama: "Kimbap" }] },
  { namaOwner: "Rahmadani Kurniati", namaUsaha: "Jagung Nadhif Adel", alamatUsaha: "Bayang", noHpWa: "083846903406", produk: [{ nama: "Jasuke" }, { nama: "Jagung Cheese Tarik" }, { nama: "Tansuke" }] },
  { namaOwner: "Revica Nanda Sari", namaUsaha: "Mie Petir", alamatUsaha: "Painan-Pessel", noHpWa: "082384829335", produk: [{ nama: "Mie Petir" }] },
  { namaOwner: "Romario Bernando", namaUsaha: "IYOKOPI", alamatUsaha: "Painan-Pessel", noHpWa: "085274185148", produk: [{ nama: "Kopi Kekinian (Cup)" }, { nama: "Kopi Kekinian (Botol)" }] },
  { namaOwner: "Siti Rahma", namaUsaha: "Lumpia Painan", alamatUsaha: "Painan-Pessel", noHpWa: "0895322833180", produk: [{ nama: "Lumpia Beef" }, { nama: "Lumpia Ayam" }, { nama: "Lumpia Milor" }] },
  { namaOwner: "Wit Siswara", namaUsaha: "Kwetiau", alamatUsaha: "Painan-Pessel", noHpWa: "082174333238", produk: [{ nama: "Kwetiau" }, { nama: "Nasi Goreng" }] },
  { namaOwner: "Yoga S. Pranata", namaUsaha: "Sutera Perfume", alamatUsaha: "Surantih", noHpWa: "081268025932", produk: [{ nama: "Parfum" }] },
  { namaOwner: "Yovy Dwika Putri", namaUsaha: "Ophieonlinefood", alamatUsaha: "Painan-Pessel", noHpWa: "085518467529", produk: [{ nama: "Aneka Dessert" }] },
  { namaOwner: "Yuni Apriani", namaUsaha: "Bakaran Yuyu", alamatUsaha: "Tarusan", noHpWa: "0811661206", produk: [{ nama: "Frozen Bakar" }] },
  { namaOwner: "Elvis Candra", namaUsaha: "Batagor", alamatUsaha: "Sago", noHpWa: "082288531040", produk: [{ nama: "Batagor" }, { nama: "Siomai" }, { nama: "Bakso Bakar" }] },
  { namaOwner: "Widya Mayang Sari", namaUsaha: "Drink Addict", alamatUsaha: "Lenganyang", noHpWa: "082288344871", produk: [{ nama: "Aneka Teh" }, { nama: "Aneka Boba" }] },
  { namaOwner: "Vina Rahmadiah", namaUsaha: "Ruang Seduh", alamatUsaha: "Lenganyang", noHpWa: "085271055167", produk: [{ nama: "Mie Jebew" }] },
  { namaOwner: "Ummul Khair", namaUsaha: "Raja Pedas", alamatUsaha: "Lenganyang", noHpWa: "082283279589", produk: [{ nama: "Ayam Geprek" }, { nama: "Tahu Mercon" }] },
  { namaOwner: "M. Valderon Ademayu", namaUsaha: "Jajanan Keyko", alamatUsaha: "Lenganyang", noHpWa: "082286336072", produk: [{ nama: "Angkringan Ayam Bakar", deskripsi: "Varian: sayap, kulit ayam, paha ayam, hati ayam, dll" }] },
  { namaOwner: "Gustin Wahyuni", namaUsaha: "Telur Gulung Ni Tin", alamatUsaha: "Tarusan", noHpWa: "085265656431", produk: [{ nama: "Telur Gulung" }] },
  { namaOwner: "Mariyanti", namaUsaha: "Jajanan Mama Arsyad", alamatUsaha: "Tarusan", noHpWa: "081374461654", produk: [{ nama: "Takoyaki" }, { nama: "Sempol Ayam" }] },
];

async function main() {
  console.log("Seeding Komunitas Culinary Pasisia...");
  const komunitas = await prisma.komunitas.upsert({
    where: { nama: KOMUNITAS_NAMA },
    update: {},
    create: { nama: KOMUNITAS_NAMA, deskripsi: KOMUNITAS_DESKRIPSI },
  });

  console.log(`Seeding ${umkmData.length} UMKM...`);
  const usedSlugs = new Set<string>();

  for (const item of umkmData) {
    let baseSlug = slugify(item.namaUsaha);
    let slug = baseSlug;
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    await prisma.umkm.upsert({
      where: { slug },
      update: {},
      create: {
        namaOwner: item.namaOwner,
        namaUsaha: item.namaUsaha,
        alamatUsaha: item.alamatUsaha,
        noHpWa: normalizeWa(item.noHpWa),
        slug,
        komunitasId: komunitas.id,
        items: {
          create: item.produk.map((p) => ({
            name: p.nama,
            type: "produk",
            price: null, // belum ada data harga fix — tampil "Hubungi penjual"
            description: p.deskripsi || `${p.nama} — ${item.namaUsaha}`,
            images: [],
          })),
        },
      },
    });
  }

  console.log("Selesai. Total UMKM:", await prisma.umkm.count());
  console.log("Total Item:", await prisma.item.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
