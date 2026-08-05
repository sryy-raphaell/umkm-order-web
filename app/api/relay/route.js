import { prisma } from "../../../lib/prisma";

// POST /api/relay
// Body: { deviceName, relay?: bool, relays?: { "0": bool, "1": bool, ... }, channel?: number }
export async function POST(request) {
  const body = await request.json();
  const { deviceName, relay, relays, channel } = body;

  if (!deviceName) {
    return Response.json({ error: "deviceName required" }, { status: 400 });
  }

  const existing = await prisma.iotData.findUnique({ where: { deviceName } });
  if (!existing) {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }

  const updateData = {};

  if (relays !== undefined) {
    // Set multiple channels sekaligus
    updateData.relays = { ...(existing.relays ?? {}), ...relays };
    if (relays["0"] !== undefined) updateData.relay = relays["0"];
  } else if (channel !== undefined && relay !== undefined) {
    // Set channel tertentu
    const current = existing.relays ?? {};
    updateData.relays = { ...current, [String(channel)]: relay };
    if (channel === 0) updateData.relay = relay;
  } else if (relay !== undefined) {
    // Backward compat: set relay channel 0
    updateData.relay = relay;
    const current = existing.relays ?? {};
    updateData.relays = { ...current, "0": relay };
  }

  const device = await prisma.iotData.update({
    where: { deviceName },
    data: updateData,
  });

  return Response.json({
    success: true,
    relay: device.relay,
    relays: device.relays,
  });
}