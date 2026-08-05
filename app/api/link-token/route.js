import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  try {

    const { token, lid } =
      await request.json();

    const user =
      await prisma.user.findUnique({
        where: {
          linkToken: token,
        },
      });

    if (!user) {
      return Response.json(
        { error: "Token invalid" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        lid,
        linkToken: null,
      },
    });

    return Response.json({
      success: true,
      name: user.name,
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