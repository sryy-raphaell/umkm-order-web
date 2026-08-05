import { prisma } from '../../../lib/prisma'

export async function GET() {
  const devices = await prisma.iotData.findMany()
  return Response.json(devices)
}   