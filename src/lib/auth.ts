import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

const COOKIE = "tunyl_office";
function expected(): string {
  const pass = process.env.APP_PASSCODE || "";
  return createHash("sha256").update("tunyl:" + pass).digest("hex");
}
export async function isOffice(): Promise<boolean> {
  if (!process.env.APP_PASSCODE) return true; // no passcode configured: open (local dev)
  const c = (await cookies()).get(COOKIE)?.value;
  return !!c && c === expected();
}
export async function signIn(passcode: string): Promise<boolean> {
  if (!process.env.APP_PASSCODE) return true;
  if (passcode !== process.env.APP_PASSCODE) return false;
  (await cookies()).set(COOKIE, expected(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return true;
}
export async function signOut() { (await cookies()).delete(COOKIE); }
export async function officeName(): Promise<string> {
  return (await cookies()).get("tunyl_name")?.value || "the office";
}
