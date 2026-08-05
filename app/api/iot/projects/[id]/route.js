import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/iot/projects/[id]
export async function GET(request, { params }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id: parseInt(id) },
    include: { devices: true },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(project);
}

// PATCH /api/iot/projects/[id] — update name/desc/widgets layout
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.widgets !== undefined) data.widgets = body.widgets;

  const project = await prisma.project.update({
    where: { id: parseInt(id) },
    data,
    include: { devices: true },
  });
  return Response.json(project);
}

// DELETE /api/iot/projects/[id]
export async function DELETE(request, { params }) {
  const { id } = await params;
  const pid = parseInt(id);
  await prisma.iotData.updateMany({
    where: { projectId: pid },
    data: { projectId: null },
  });
  await prisma.project.delete({ where: { id: pid } });
  return Response.json({ success: true });
}