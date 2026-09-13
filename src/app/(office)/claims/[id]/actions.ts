"use server";
// Anything that moves money is a draft until a person confirms it here.
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { claims } from "@/db/schema";
import { eq } from "drizzle-orm";
import { todayIso } from "@/lib/units";
import { officeName } from "@/lib/auth";
import { logAction } from "@/lib/actions-log";

export async function markPaidAction(claimId: string) {
  const [c] = await db.select().from(claims).where(eq(claims.id, claimId));
  if (!c) throw new Error("Claim not found");
  if (c.status !== "certified") return c; // only a certified claim can be marked paid
  const [updated] = await db.update(claims).set({ status: "paid", paidAt: todayIso() }).where(eq(claims.id, claimId)).returning();
  await logAction({ actor: await officeName(), kind: "mark_paid", subject: `claim ${c.number}`, href: `/claims/${claimId}`, projectId: c.projectId });
  revalidatePath(`/claims/${claimId}`);
  revalidatePath("/claims");
  revalidatePath("/", "layout");
  return updated;
}
