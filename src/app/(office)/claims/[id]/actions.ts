"use server";
// Anything that moves money is a draft until a person confirms it here.
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { claims } from "@/db/schema";
import { eq } from "drizzle-orm";
import { todayIso } from "@/lib/units";

export async function markPaidAction(claimId: string) {
  const [c] = await db.select().from(claims).where(eq(claims.id, claimId));
  if (!c) throw new Error("Claim not found");
  if (c.status !== "certified") return c; // only a certified claim can be marked paid
  const [updated] = await db.update(claims).set({ status: "paid", paidAt: todayIso() }).where(eq(claims.id, claimId)).returning();
  revalidatePath(`/claims/${claimId}`);
  revalidatePath("/claims");
  revalidatePath("/", "layout");
  return updated;
}
