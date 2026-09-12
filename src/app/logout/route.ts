import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";
export async function GET(req: Request) {
  await signOut();
  return NextResponse.redirect(new URL("/login", req.url));
}
