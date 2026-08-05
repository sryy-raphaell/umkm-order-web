import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  try {
    const { phone, lid } = await request.json();

    if (!phone || !lid) {
      return Response.json(
        { error: "phone and lid required" },
        { status: 400 }
      );
    }

    const cleanPhone = phone
      .replace(/\D/g, "")
      .replace(/^0/, "62");

    const user = await prisma.user.update({
      where: {
        phone: cleanPhone,
      },

      data: {
        lid,
      },
    });

    return Response.json({
      success: true,
      user,
    });
  } catch (err) {
    return Response.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }

  
}