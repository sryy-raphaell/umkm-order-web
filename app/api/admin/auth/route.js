import { cookies } from "next/headers";
import { getExpectedToken, verifyAdminAuth } from "../../../../lib/adminAuth";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttemptCount,
} from "../../../../lib/rateLimit";

function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function GET() {
  const isAuth = await verifyAdminAuth();
  return Response.json({ authenticated: isAuth });
}

export async function POST(req) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return Response.json({ error: rateCheck.message }, { status: 429 });
    }

    const { password } = await req.json();
    const expectedPass = process.env.ADMIN_PASSWORD || "admin123";

    if (password !== expectedPass) {
      // Delay buatan 800ms untuk memperlambat otomatisasi bot
      await new Promise((resolve) => setTimeout(resolve, 800));

      const remaining = recordFailedAttempt(clientIp);
      const errorMsg =
        remaining > 0
          ? `Password admin tidak sesuai. (Sisa percobaan: ${remaining}x)`
          : `Terlalu banyak percobaan salah. Login dikunci selama 15 menit.`;

      return Response.json({ error: errorMsg }, { status: 401 });
    }

    // Jika password benar, reset hitungan salah
    resetAttemptCount(clientIp);

    const token = getExpectedToken();
    const cookieStore = await cookies();

    cookieStore.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 jam
      path: "/",
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return Response.json({ success: true });
}
