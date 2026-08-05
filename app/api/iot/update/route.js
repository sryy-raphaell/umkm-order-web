import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/iot/update
// Dipanggil ESP32 setiap interval
// Body: { authToken, deviceName, temperature?, humidity?, pins?, relays? }
export async function POST(request) {
  try {
    const body = await request.json();
    const { authToken, deviceName, temperature, humidity, pins, relays } = body;

    if (!deviceName) {
      return Response.json({ error: "deviceName required" }, { status: 400 });
    }

    // Resolve project via authToken
    let projectId = null;
    if (authToken) {
      const project = await prisma.project.findUnique({
        where: { authToken },
      });
      if (!project) {
        return Response.json({ error: "Invalid authToken" }, { status: 401 });
      }
      projectId = project.id;
    }

    const updateData = {
      status: "online",
      updatedAt: new Date(),
    };
    if (temperature !== undefined) updateData.temperature = temperature;
    if (humidity !== undefined) updateData.humidity = humidity;
    if (projectId !== null) updateData.projectId = projectId;

    // Merge virtual pins
    if (pins && typeof pins === "object") {
      const existing = await prisma.iotData.findUnique({
        where: { deviceName },
      });
      const currentPins = existing?.pins ?? {};
      updateData.pins = { ...currentPins, ...pins };
    }

    // Merge relays

    const device = await prisma.iotData.upsert({
      where: { deviceName },
      update: updateData,
      create: {
        deviceName,
        projectId,
        temperature: temperature ?? 0,
        humidity: humidity ?? 0,
        status: "online",
        pins: pins ?? {},
        relays: {},
        relay: false,
      },
    });

    const latest = await prisma.iotData.findUnique({
      where: { deviceName },
    });

    return Response.json({
      success: true,
      relay: latest?.relay ?? false,
      relays: latest?.relays ?? {},
    });
    
  } catch (err) {
    console.error("IoT update error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
