import { prisma } from "../../../../lib/prisma";

// GET /api/iot/projects
export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { devices: true },
  });
  return Response.json(projects);
}

// POST /api/iot/projects
export async function POST(request) {
  console.log("prisma =", prisma);
  console.log("project =", prisma?.project);

  const { name, description } = await request.json();

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
    },
  });

  return Response.json(project);
}