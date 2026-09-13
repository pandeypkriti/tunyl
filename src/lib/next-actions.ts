import "server-only";
import { db } from "@/db";
import { claims, projects, records } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { allProjects, ledgerFor } from "./ledger";
import { lodgedClaims } from "./claims";
import { lastActionBy, timeAgo } from "./actions-log";
import { businessDaysBetween, fmtDate, money, todayIso } from "./units";

export type NextAction = { id: string; kind: "continue" | "lodge" | "chase" | "paper" | "payment" | "claim" | "ask"; label: string; meta: string; href?: string; question?: string };
export type BriefItem = { id: string; tone: "warn" | "danger" | "success" | "info"; title: string; detail: string; question: string; href?: string };

/** What the signed-in person will probably do next, from what they did last and what is unfinished. */
export async function nextActions(name: string): Promise<NextAction[]> {
  const today = todayIso();
  const ps = await allProjects();
  const pname = (id: string) => ps.find((p) => p.id === id);
  const items: NextAction[] = [];
  const queue = await db.select().from(records).where(inArray(records.status, ["waiting", "held"])).orderBy(desc(records.createdAt));
  const drafts = await db.select().from(claims).where(eq(claims.status, "draft"));
  const lodged = await lodgedClaims();
  const last = await lastActionBy(name);

  for (const c of drafts) {
    const p = pname(c.projectId);
    items.push({ id: "lodge-" + c.id, kind: "lodge", label: `Lodge claim ${c.number} on ${p?.name ?? "the project"}`, meta: `${money(c.total)}, drafted ${timeAgo(c.createdAt)}`, href: p ? `/projects/${p.slug}` : "/claims" });
  }
  for (const c of lodged) {
    if (c.status === "lodged" && !c.scheduleReceived && c.scheduleDue && today > c.scheduleDue) {
      items.push({ id: "chase-" + c.id, kind: "chase", label: `Chase ${c.client} for claim ${c.number}'s payment schedule`, meta: `${businessDaysBetween(c.scheduleDue, today)} business days late, ${c.projectName}`, href: `/claims/${c.id}` });
    }
    if (c.status === "certified" && c.paymentDue && today >= c.paymentDue && !c.paidAt) {
      items.push({ id: "pay-" + c.id, kind: "payment", label: `Check payment for claim ${c.number}`, meta: `${money(c.total)} from ${c.client}, was due ${fmtDate(c.paymentDue)}`, href: `/claims/${c.id}` });
    }
  }
  const held = queue.filter((r) => r.status === "held");
  for (const r of held.slice(0, 1)) {
    items.push({ id: "paper-" + r.id, kind: "paper", label: `Ask the site for the paper behind ${r.title}`, meta: `${pname(r.projectId)?.name ?? ""}, held ${timeAgo(r.createdAt)}`, href: `/queue/${r.id}` });
  }
  if (queue.length) {
    const waiting = queue.filter((r) => r.status === "waiting").length;
    const cont: NextAction = { id: "queue", kind: "continue", label: last?.kind === "tick" ? "Continue the review queue" : "Tick what is waiting in the review queue", meta: `${waiting} waiting, ${held.length} held${last?.kind === "tick" ? `, you last ticked ${timeAgo(last.createdAt)}` : ""}`, href: "/queue" };
    if (last?.kind === "tick") items.unshift(cont); else items.push(cont);
  }
  // ready-to-claim nudge when nothing is drafted for a project with verified quantities
  for (const p of ps) {
    if (drafts.some((d) => d.projectId === p.id)) continue;
    const led = await ledgerFor(p.id);
    const total = led.materials.reduce((s, m) => s + m.toClaim * m.rate, 0);
    if (total > 20000) items.push({ id: "claim-" + p.id, kind: "claim", label: `Draft claim ${p.nextClaimNo} on ${p.name}`, meta: `${money(total)} verified and unclaimed`, href: `/projects/${p.slug}` });
  }
  return items.slice(0, 5);
}

/** Data-driven prompts for the Ask cover: what is true right now, phrased as questions the person can tap. */
export async function briefing(): Promise<BriefItem[]> {
  const today = todayIso();
  const items: BriefItem[] = [];
  const ps = await allProjects();
  const queue = await db.select().from(records).where(inArray(records.status, ["waiting", "held"]));
  const waiting = queue.filter((r) => r.status === "waiting").length, held = queue.filter((r) => r.status === "held");
  if (waiting) items.push({ id: "waiting", tone: "warn", title: `${waiting} waiting for a person`, detail: "Dockets, invoices and instructions the rule could not pass on its own.", question: "What is waiting for a person?", href: "/queue" });
  if (held.length) items.push({ id: "held", tone: "danger", title: `${held.length} invoice${held.length === 1 ? "" : "s"} held`, detail: held[0].why.split(".")[0] + ".", question: "Which invoices have loads with no docket?", href: `/queue/${held[0].id}` });
  const lodged = await lodgedClaims();
  const late = lodged.filter((c) => c.status === "lodged" && !c.scheduleReceived && c.scheduleDue && today > c.scheduleDue);
  if (late.length) items.push({ id: "late", tone: "danger", title: `Claim ${late[0].number} is late`, detail: `${late[0].client} has not served a payment schedule for ${late[0].projectName}.`, question: "Which claims are overdue?", href: `/claims/${late[0].id}` });
  let ready = 0, readyProjects = 0;
  for (const p of ps) { const led = await ledgerFor(p.id); const t = led.materials.reduce((s, m) => s + m.toClaim * m.rate, 0); if (t > 0) { ready += t; readyProjects++; } }
  if (ready) items.push({ id: "ready", tone: "success", title: `${money(ready)} ready to claim`, detail: `Verified quantities across ${readyProjects} project${readyProjects === 1 ? "" : "s"}, not yet claimed.`, question: "What is unclaimed?", href: "/claims" });
  const owed = lodged.reduce((s, c) => s + c.total, 0);
  if (owed) items.push({ id: "owed", tone: "info", title: `${money(owed)} outstanding`, detail: `${lodged.length} claim${lodged.length === 1 ? "" : "s"} lodged or certified, not yet paid.`, question: "What are we owed?", href: "/claims" });
  return items.slice(0, 4);
}
