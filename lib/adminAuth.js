import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function getExpectedToken() {
  return crypto
    .createHmac("sha256", "syra-admin-salt-key")
    .update(ADMIN_PASSWORD)
    .digest("hex");
}

export async function verifyAdminAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    return token === getExpectedToken();
  } catch {
    return false;
  }
}
