// Data for the board view. Raw queries live here, not in src/lib, because this
// screen sums records a handful of ways nothing else needs.
import "server-only";
import { db } from "@/db";
import { records, type Claim } from "@/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";
import { allProjects, ledgerFor } from "@/lib/ledger";
import { reviewQueue } from "@/lib/records";
import { claimsFor } from "@/lib/claims";
import { fmtDate, businessDaysBetween, money } from "@/lib/units";

export type BoardTiles = {
  dockets: { total: number; byRule: number; forPerson: number };
  waiting: number;
  readyToClaim: { total: number; projectCount: number };
  held: { count: number; sub: string };
};

export type BoardProjectRow = {
  slug: string;
  name: string;
  client: string;
  clientPlatform: string;
  headline: { name: string; unit: string; delivered: number; ordered: number; pct: number } | null;
  needsPerson: number;
  claimText: string;
};

export async function boardTiles(): Promise<BoardTiles> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekly = await db.select().from(records).where(and(inArray(records.type, ["docket", "feed"]), gte(records.createdAt, weekAgo)));
  const byRule = weekly.filter((r) => r.status === "rule").length;
  const forPerson = weekly.filter((r) => r.status === "waiting" || r.status === "held" || r.status === "ticked").length;

  const heldInvoices = await db.select().from(records).where(and(eq(records.type, "invoice"), eq(records.status, "held")));
  const heldSub = heldInvoices.length === 0
    ? "No invoices on hold right now."
    : (heldInvoices[0].why || "Billed with no docket on file.").split(":")[0];

  const queue = await reviewQueue();
  const projects = await allProjects();
  let readyTotal = 0;
  let readyProjects = 0;
  for (const p of projects) {
    const ledger = await ledgerFor(p.id);
    const projectToClaim = ledger.materials.reduce((s, m) => s + m.toClaim * m.rate, 0);
    if (projectToClaim > 1e-9) { readyTotal += projectToClaim; readyProjects++; }
  }

  return {
    dockets: { total: weekly.length, byRule, forPerson },
    waiting: queue.length,
    readyToClaim: { total: readyTotal, projectCount: readyProjects },
    held: { count: heldInvoices.length, sub: heldSub },
  };
}

export async function boardProjectRows(): Promise<BoardProjectRow[]> {
  const projects = await allProjects();
  const queue = await reviewQueue();
  const rows: BoardProjectRow[] = [];
  for (const p of projects) {
    const [ledger, claims] = await Promise.all([ledgerFor(p.id), claimsFor(p.id)]);
    const headlineMat = ledger.materials[0] ?? null;
    const claimText = ledger.draft
      ? `Claim ${ledger.draft.number} draft, ${money(ledger.draft.total)}`
      : claims[0]
        ? `Claim ${claims[0].number}, ${claims[0].status}`
        : "No claims yet";
    rows.push({
      slug: p.slug,
      name: p.name,
      client: p.client,
      clientPlatform: p.clientPlatform,
      headline: headlineMat
        ? {
            name: headlineMat.name,
            unit: headlineMat.unit,
            delivered: headlineMat.delivered,
            ordered: headlineMat.ordered,
            pct: headlineMat.ordered > 0 ? Math.max(0, Math.min(100, Math.round((headlineMat.delivered / headlineMat.ordered) * 100))) : 0,
          }
        : null,
      needsPerson: queue.filter((r) => r.projectId === p.id).length,
      claimText,
    });
  }
  return rows;
}

/** Payment schedule cell: received, on the clock, or overdue. */
export function describeSchedule(c: Claim, today: string): string {
  if (c.scheduleReceived) return `Received ${fmtDate(c.scheduleReceived)}`;
  if (today > c.scheduleDue) return `Due ${fmtDate(c.scheduleDue)}, not received`;
  const day = businessDaysBetween(c.lodgedAt, today);
  return `Due ${fmtDate(c.scheduleDue)}, day ${day} of 10`;
}

/** Payment cell: due date, or overdue if it has passed. */
export function describePayment(c: Claim, today: string): string {
  if (!c.paymentDue) return "Not yet set";
  return today > c.paymentDue ? `Was due ${fmtDate(c.paymentDue)}` : `Due ${fmtDate(c.paymentDue)}`;
}

export function claimStatusChip(c: Claim, today: string): { cls: "clear" | "hold" | "check"; text: string } {
  const scheduleLate = !c.scheduleReceived && today > c.scheduleDue;
  const paymentOverdue = !!c.paymentDue && today > c.paymentDue && c.status !== "paid";
  if (scheduleLate) return { cls: "hold", text: "Schedule overdue" };
  if (paymentOverdue) return { cls: "hold", text: "Payment overdue" };
  if (c.status === "certified") return { cls: "clear", text: "Certified" };
  if (c.status === "paid") return { cls: "clear", text: "Paid" };
  return { cls: "check", text: "Awaiting schedule" };
}

export function chaserMailto(c: Claim & { projectName: string; client: string }): string {
  const subject = `Payment schedule overdue, claim ${c.number}`;
  const body = `Hi,\n\nClaim ${c.number} for ${c.projectName} was lodged on ${fmtDate(c.lodgedAt)}. Under the Security of Payment Act you have 10 business days from the date a claim is lodged to serve a payment schedule, and that period has now passed without one.\n\nCould you send the payment schedule as soon as possible?\n\nThanks`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
