"use server";
// Certifying is the one write this public, no-login page is allowed to make,
// and it only ever moves a claim forward (draft/lodged -> certified).
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { claims } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addBusinessDays, todayIso } from "@/lib/units";
import { logAction } from "@/lib/actions-log";
import { projects } from "@/db/schema";

export async function certifyClaim(claimId: string, token: string) {
  const [c] = await db.select().from(claims).where(eq(claims.id, claimId));
  if (!c) throw new Error("Claim not found");
  const today = todayIso();
  const scheduleReceived = c.scheduleReceived || today;
  const paymentDue = c.paymentDue || addBusinessDays(today, 15);
  const [updated] = await db
    .update(claims)
    .set({ status: "certified", scheduleReceived, paymentDue })
    .where(eq(claims.id, claimId))
    .returning();
  const [p] = await db.select().from(projects).where(eq(projects.id, c.projectId));
  await logAction({ actor: `${p?.client ?? "The builder"} (builder)`, kind: "certify", subject: `claim ${c.number}`, href: `/claims/${c.id}`, projectId: c.projectId });
  revalidatePath(`/c/${token}`);
  revalidatePath("/", "layout");
  return updated;
}
