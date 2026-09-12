// Data for the claims pages. Raw queries live here, not in src/lib, because
// these screens join claims to their project and describe the payment
// schedule in ways nothing else needs.
import "server-only";
import { db } from "@/db";
import { claims, projects, type Claim, type Project } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { fmtDate, businessDaysBetween } from "@/lib/units";

export type ClaimWithProject = Claim & { projectName: string; client: string; projectSlug: string };

/** Every claim, newest first, joined to its project's name and client. */
export async function allClaimsWithProject(): Promise<ClaimWithProject[]> {
  const [cls, ps] = await Promise.all([
    db.select().from(claims).orderBy(desc(claims.createdAt)),
    db.select().from(projects),
  ]);
  return cls.map((c) => {
    const p = ps.find((x) => x.id === c.projectId);
    return { ...c, projectName: p?.name ?? "", client: p?.client ?? "", projectSlug: p?.slug ?? "" };
  });
}

export async function claimWithProject(id: string): Promise<{ claim: Claim; project: Project } | null> {
  const [claim] = await db.select().from(claims).where(eq(claims.id, id));
  if (!claim) return null;
  const [project] = await db.select().from(projects).where(eq(projects.id, claim.projectId));
  if (!project) return null;
  return { claim, project };
}

/** A claim is overdue when the builder is late with the schedule, or has certified but not paid. */
export function isOverdue(c: Claim, today: string): boolean {
  if (c.status === "lodged" && !c.scheduleReceived && !!c.scheduleDue && today > c.scheduleDue) return true;
  if (c.status === "certified" && !!c.paymentDue && today > c.paymentDue) return true;
  return false;
}

/** The schedule the builder owes under the Security of Payment Act, 10 business days from lodging. */
export function scheduleText(c: Claim, today: string): string {
  if (!c.lodgedAt) return "Not yet lodged";
  if (c.scheduleReceived) return `Received ${fmtDate(c.scheduleReceived)}`;
  if (c.scheduleDue && today > c.scheduleDue) return `Due ${fmtDate(c.scheduleDue)}, not received`;
  const day = businessDaysBetween(c.lodgedAt, today);
  return `Due ${fmtDate(c.scheduleDue)}, day ${day} of 10`;
}

export function paymentText(c: Claim, today: string): string {
  if (c.status === "paid") return c.paidAt ? `Paid ${fmtDate(c.paidAt)}` : "Paid";
  if (!c.paymentDue) return "Not yet set";
  return today > c.paymentDue ? `Was due ${fmtDate(c.paymentDue)}` : `Due ${fmtDate(c.paymentDue)}`;
}

/** True when the schedule itself is overdue, the trigger for a chaser email. */
export function scheduleLate(c: Claim, today: string): boolean {
  return c.status === "lodged" && !c.scheduleReceived && !!c.scheduleDue && today > c.scheduleDue;
}

export function chaserMailto(c: (ClaimWithProject | (Claim & { projectName: string })) & { clientEmail?: string; project?: { clientEmail?: string } }): string {
  const to = c.clientEmail || c.project?.clientEmail || "";
  const subject = `Payment schedule overdue, claim ${c.number}`;
  const body = `Hi,\n\nClaim ${c.number} for ${c.projectName} was lodged on ${fmtDate(c.lodgedAt)}. Under the Security of Payment Act you have 10 business days from the date a claim is lodged to serve a payment schedule, and that period has now passed without one.\n\nCould you send the payment schedule as soon as possible?\n\nThanks`;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
