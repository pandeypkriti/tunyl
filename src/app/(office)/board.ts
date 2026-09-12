// Data for the home page. Raw queries live here, not in src/lib, because this
// screen sums records and builds a feed in ways nothing else needs.
import "server-only";
import { db } from "@/db";
import { records, type Claim, type RecordRow } from "@/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";
import { allProjects, ledgerFor } from "@/lib/ledger";
import { reviewQueue } from "@/lib/records";
import { lodgedClaims } from "@/lib/claims";
import { fmtDate, businessDaysBetween, todayIso } from "@/lib/units";
import type { FeedItem } from "@/components/app/activity-feed";
import type { ChipTone } from "@/components/app/status-chip";

export type HomeKpis = {
  dockets: { total: number; byRule: number; forPerson: number };
  waiting: number;
  readyToClaim: { total: number; projectCount: number };
  held: { count: number; sub: string };
};

export async function homeKpis(): Promise<HomeKpis> {
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

export type NeedsPersonRow = { id: string; title: string; supplier: string; projectName: string; status: RecordRow["status"]; why: string };

function firstSentence(text: string): string {
  const idx = text.search(/[.!?]\s/);
  return idx === -1 ? text : text.slice(0, idx + 1);
}
function shorten(text: string, max = 84): string {
  const first = firstSentence(text || "");
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

/** Up to `limit` waiting or held records, newest first, for the home page. */
export async function needsAPerson(limit = 6): Promise<NeedsPersonRow[]> {
  const [queue, projects] = await Promise.all([reviewQueue(), allProjects()]);
  const nameFor = (id: string) => projects.find((p) => p.id === id)?.name ?? "";
  return queue.slice(0, limit).map((r) => ({
    id: r.id,
    title: r.title,
    supplier: r.supplier,
    projectName: nameFor(r.projectId),
    status: r.status,
    why: shorten(r.why || "Waiting on the office"),
  }));
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
/** "just now / 8m / 2h / yesterday / 8 Sep" against `now`. */
function timeAgo(at: Date, now: Date): string {
  const diffMin = (now.getTime() - at.getTime()) / 60000;
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${Math.floor(diffMin)}m`;
  const today0 = startOfDay(now);
  const at0 = startOfDay(at);
  if (at0 === today0) return `${Math.floor(diffMin / 60)}h`;
  if (today0 - at0 === 24 * 60 * 60 * 1000) return "yesterday";
  return `${at.getDate()} ${MONTHS_SHORT[at.getMonth()]}`;
}

function activityFor(r: RecordRow, projectName: string, at: Date, now: Date): FeedItem {
  const fresh = (now.getTime() - at.getTime()) / 60000 < 15;
  const base = { id: r.id, what: r.title, tag: projectName, when: timeAgo(at, now), href: `/queue/${r.id}`, fresh };
  switch (r.status) {
    case "rule": return { ...base, kind: "tick", who: r.supplier || "The rule", did: "matched by rule" };
    case "ticked": return { ...base, kind: "tick", who: r.tickedBy || "The office", did: "ticked" };
    case "approved": return { ...base, kind: "tick", who: r.tickedBy || "The office", did: "approved" };
    case "logged": return { ...base, kind: "tick", who: r.tickedBy || "The office", did: "logged" };
    case "held": return { ...base, kind: "held", who: r.supplier || "The office", did: "held" };
    case "sent_back": return { ...base, kind: "back", who: r.tickedBy || "The office", did: "sent back" };
    default:
      if (r.source === "feed") return { ...base, kind: "feed", who: r.supplier || "The feed", did: "sent a load" };
      if (r.type === "invoice") return { ...base, kind: "invoice", who: r.supplier || "The supplier", did: "sent an invoice" };
      if (r.type === "instruction") return { ...base, kind: "email", who: r.supplier || "The builder", did: "sent an instruction" };
      return { ...base, kind: "photo", who: r.supplier || "The site", did: "sent a docket" };
  }
}

/** The most recent activity across every project, newest first. */
export async function recentActivity(limit = 8): Promise<{ items: FeedItem[]; heading: "Today" | "Recent" }> {
  const [rows, projects] = await Promise.all([db.select().from(records), allProjects()]);
  const nameFor = (id: string) => projects.find((p) => p.id === id)?.name ?? "";
  const now = new Date();
  const today0 = startOfDay(now);
  const withAt = rows
    .map((r) => ({ r, at: r.tickedAt ?? r.createdAt }))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
  const items = withAt.map(({ r, at }) => activityFor(r, nameFor(r.projectId), at, now));
  const heading: "Today" | "Recent" = withAt.some(({ at }) => startOfDay(at) === today0) ? "Today" : "Recent";
  return { items, heading };
}

export type ClaimWaitingRow = {
  id: string;
  number: number;
  projectName: string;
  client: string;
  total: number;
  scheduleText: string;
  chip: { tone: ChipTone; label: string };
  mailto: string | null;
};

function describeSchedule(c: Claim, today: string): string {
  if (c.scheduleReceived) return `Received ${fmtDate(c.scheduleReceived)}`;
  if (today > c.scheduleDue) return `Due ${fmtDate(c.scheduleDue)}, not received`;
  const day = businessDaysBetween(c.lodgedAt, today);
  return `Due ${fmtDate(c.scheduleDue)}, day ${day} of 10`;
}

function chaserMailto(c: Claim & { projectName: string; client: string; clientEmail?: string }): string {
  const subject = `Payment schedule overdue, claim ${c.number}`;
  const body = `Hi,\n\nClaim ${c.number} for ${c.projectName} was lodged on ${fmtDate(c.lodgedAt)}. Under the Security of Payment Act you have 10 business days from the date a claim is lodged to serve a payment schedule, and that period has now passed without one.\n\nCould you send the payment schedule as soon as possible?\n\nThanks`;
  return `mailto:${encodeURIComponent(c.clientEmail || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Claims lodged or certified, still waiting on the builder's money. */
export async function claimsWaitingOnMoney(): Promise<ClaimWaitingRow[]> {
  const today = todayIso();
  const rows = await lodgedClaims();
  return rows.map((c) => {
    const late = c.status !== "certified" && !c.scheduleReceived && today > c.scheduleDue;
    const chip: { tone: ChipTone; label: string } = c.status === "certified"
      ? { tone: "success", label: "Certified" }
      : late
        ? { tone: "danger", label: "Late" }
        : { tone: "info", label: "On track" };
    return {
      id: c.id,
      number: c.number,
      projectName: c.projectName,
      client: c.client,
      total: c.total,
      scheduleText: describeSchedule(c, today),
      chip,
      mailto: late ? chaserMailto(c) : null,
    };
  });
}

export type HomeProjectRow = {
  slug: string;
  name: string;
  client: string;
  bar: { name: string; unit: string; delivered: number; ordered: number; pct: number } | null;
};

/** Sahova-style project rows: name, client, headline material progress. */
export async function homeProjectRows(): Promise<HomeProjectRow[]> {
  const projects = await allProjects();
  const rows: HomeProjectRow[] = [];
  for (const p of projects) {
    const ledger = await ledgerFor(p.id);
    const m = ledger.materials[0] ?? null;
    rows.push({
      slug: p.slug,
      name: p.name,
      client: p.client,
      bar: m
        ? {
            name: m.name,
            unit: m.unit,
            delivered: m.delivered,
            ordered: m.ordered,
            pct: m.ordered > 0 ? Math.max(0, Math.min(100, Math.round((m.delivered / m.ordered) * 100))) : 0,
          }
        : null,
    });
  }
  return rows;
}
