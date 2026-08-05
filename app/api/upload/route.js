import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request) {
  const data = await request.formData()
  const file = data.get('file')

  if (!file) return Response.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Simpan ke /public/uploads/
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const filename = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
  const filepath = join(uploadDir, filename)
  await writeFile(filepath, buffer)

  return Response.json({ url: `/uploads/${filename}` })
}