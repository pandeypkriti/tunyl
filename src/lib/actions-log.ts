import "server-only";
import { db } from "@/db";
import { actions, type ActionKind, type ActionRow } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function logAction(a: { actor: string; kind: ActionKind; subject: string; href?: string; projectId?: string | null }) {
  try {
    await db.insert(actions).values({ actor: a.actor || "the office", kind: a.kind, subject: a.subject, href: a.href ?? "", projectId: a.projectId ?? null });
  } catch (e) { console.error("logAction failed", e); }
}
export async function recentActions(limit = 8): Promise<ActionRow[]> {
  return db.select().from(actions).orderBy(desc(actions.createdAt)).limit(limit);
}
export async function lastActionBy(actor: string): Promise<ActionRow | null> {
  const [row] = await db.select().from(actions).where(eq(actions.actor, actor)).orderBy(desc(actions.createdAt)).limit(1);
  return row ?? null;
}
export function timeAgo(d: Date | string | null | undefined, now = new Date()): string {
  if (!d) return "";
  const t = typeof d === "string" ? new Date(d) : d;
  const s = Math.max(0, (now.getTime() - t.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86400);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return t.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}
export const KIND_LABEL: Record<ActionKind, string> = {
  tick: "ticked", send_back: "sent back", hold: "held", draft_claim: "drafted", lodge_claim: "lodged", certify: "certified", mark_paid: "marked paid", site_send: "sent in", ask: "asked",
};
