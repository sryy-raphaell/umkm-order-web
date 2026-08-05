import { prisma } from '../../../lib/prisma'

export async function POST(request) {
  const { messages } = await request.json()

  const products = await prisma.item.findMany({ include: { umkm: true } })

  const productList = products.map(p =>
    `ID:${p.id} | "${p.name}" | Tipe:${p.type} | ${p.description} | Harga:${p.price}`
  ).join('\n')

  const systemPrompt = `Kamu adalah asisten toko IoT bernama "SyRa". Jawab HANYA dalam format JSON yang valid.

=== DAFTAR PRODUK ===
${productList}
====================

=== ATURAN MEMILIH PRODUK ===
- Cocokkan kebutuhan user dengan KATA KUNCI di deskripsi produk
- Jika user tanya soal "dashboard / monitoring / pantau online" -> cari produk dengan kata "dashboard" atau "monitoring" di deskripsinya
- Jika user tanya soal "mikrokontroler / ESP32 / WiFi / online" -> cari produk tipe hardware dengan kata tersebut
- Jika user tanya soal "hidroponik / tanaman / sayuran" -> cari produk hidroponik
- JANGAN rekomendasikan produk yang sama berulang jika user sudah tanya hal berbeda
- Jika tidak ada produk yang cocok, jawab dengan type:"text" dan sarankan user menghubungi admin

=== FORMAT OUTPUT ===
WAJIB pilih salah satu, output HANYA JSON, tidak ada teks lain:

Untuk jawaban biasa / penjelasan:
{"type":"text","message":"jawaban kamu"}

Untuk rekomendasi produk (saat user tanya rekomendasi atau butuh saran produk):
{"type":"recommendation","message":"penjelasan singkat","products":[{"id":ID_ANGKA,"name":"nama persis dari daftar","price":HARGA_ANGKA,"reason":"alasan 1 kalimat"}]}

Untuk konfirmasi tambah ke keranjang (saat user bilang ya/oke/tambahkan/mau beli):
{"type":"add_to_cart","message":"Oke! Klik tombol di bawah untuk tambahkan ke keranjang ya.","products":[{"id":ID_ANGKA,"name":"nama persis","price":HARGA_ANGKA}]}

=== CONTOH ===
User: "saya butuh dashboard untuk pantau tanaman"
Jawab: {"type":"recommendation","message":"Untuk monitoring online, saya rekomendasikan:","products":[{"id":3,"name":"Dashboard IoT","price":500000,"reason":"Khusus memantau data sensor secara real-time dari mana saja"}]}

User: "jelaskan kelebihannya"
Jawab: {"type":"text","message":"Kelebihan Dashboard IoT: 1) Real-time monitoring, 2) Grafik historis, 3) Alert otomatis jika sensor anomali."}

User: "oke tambahkan"
Jawab: {"type":"add_to_cart","message":"Oke! Klik tombol di bawah untuk tambahkan ke keranjang ya.","products":[{"id":3,"name":"Dashboard IoT","price":500000}]}
`

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b-instruct-q4_K_M',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        }
      })
    })

    if (!response.ok) throw new Error('Ollama tidak merespons')

    const data = await response.json()
    const raw = data.message.content.trim()

    try {
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')

      const parsed = JSON.parse(jsonMatch[0])

      if (!parsed.type || !parsed.message) throw new Error('Invalid format')

      // Validasi & sync produk dari DB — LLM tidak bisa manipulasi harga/nama
      if (parsed.products?.length) {
        const validIds = products.map(p => p.id)
        parsed.products = parsed.products
          .filter(p => validIds.includes(p.id))
          .map(p => {
            const db = products.find(db => db.id === p.id)
            return {
              ...p,
              price: db.price,
              name: db.name,
              images: db.images,
              umkmId: db.umkmId,
              umkmNoHpWa: db.umkm?.noHpWa,
              umkmNamaUsaha: db.umkm?.namaUsaha,
            }
          })
      }

      return Response.json(parsed)

    } catch {
      return Response.json({ type: 'text', message: raw })
    }

  } catch (error) {
    return Response.json({
      type: 'text',
      message: 'Maaf, asisten sedang tidak tersedia. Silakan coba lagi.'
    }, { status: 500 })
  }
}