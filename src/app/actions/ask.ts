"use server";
// Ask Tunyl: deterministic answers over the database first, a grounded model
// call second, and a help message when neither can answer. Nothing here ever
// treats an action that moves money as done.
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { records, purchaseOrders, materials, type Project, type RecordRow } from "@/db/schema";
import { allProjects, ledgerFor } from "@/lib/ledger";
import { reviewQueue } from "@/lib/records";
import { lodgedClaims } from "@/lib/claims";
import { findMaterial } from "@/lib/rules";
import { structuredParse } from "@/lib/provider";
import { fmt, money, todayIso } from "@/lib/units";

export type AskResult = { answer: string; href?: string; foot?: string };

const HELP: AskResult = {
  answer: "I can answer questions about unclaimed quantities, invoices held with no docket, a docket, invoice or purchase order number, delivered or ordered amounts for a material, what is waiting on a person, and what claims are owed.",
  foot: "No AI key is configured here, so this only answers what it can find directly in the records.",
};

const STATUS_LABEL: Record<RecordRow["status"], string> = {
  rule: "matched by rule, straight to the ledger",
  waiting: "waiting for a person",
  ticked: "ticked",
  held: "held",
  sent_back: "sent back to site",
  approved: "approved",
  logged: "logged",
};

function matchProject(question: string, projects: Project[]): Project | null {
  const lower = question.toLowerCase();
  let best: Project | null = null;
  let bestScore = 0;
  for (const p of projects) {
    const words = Array.from(new Set(p.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 4)));
    const score = words.filter((w) => lower.includes(w)).length;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore > 0 ? best : null;
}

async function unclaimedIntent(q: string): Promise<AskResult | null> {
  if (!/unclaimed|ready to claim|ready to bill/i.test(q)) return null;
  const projects = await allProjects();
  const match = matchProject(q, projects);
  const targets = match ? [match] : projects;
  const lines: string[] = [];
  let total = 0;
  for (const p of targets) {
    const ledger = await ledgerFor(p.id);
    const ready = ledger.materials.filter((m) => m.toClaim > 1e-9);
    if (!ready.length) continue;
    const projTotal = ready.reduce((s, m) => s + m.toClaim * m.rate, 0);
    total += projTotal;
    const detail = ready.map((m) => `${fmt(m.toClaim, 2)} ${m.unit} of ${m.name.split(",")[0]}`).join(", ");
    lines.push(`${p.name}: ${detail} (${money(projTotal)})`);
  }
  if (!lines.length) {
    return { answer: match ? `${match.name} has nothing verified and unclaimed right now.` : "Nothing is verified and unclaimed right now.", href: "/" };
  }
  return { answer: `${lines.join(". ")}. Total ready to claim: ${money(total)}.`, href: match ? `/projects/${match.slug}` : "/" };
}

async function noDocketIntent(q: string): Promise<AskResult | null> {
  if (!/no docket|held invoice|missing docket/i.test(q)) return null;
  const held = await db.select().from(records).where(and(eq(records.type, "invoice"), eq(records.status, "held")));
  if (!held.length) return { answer: "No invoices are on hold right now.", href: "/queue" };
  const projects = await allProjects();
  const nameFor = (id: string) => projects.find((p) => p.id === id)?.name ?? "a project";
  const parts = held.map((r) => `${r.title} from ${r.supplier} on ${nameFor(r.projectId)}: ${r.why}`);
  return { answer: parts.join(" "), href: "/queue" };
}

async function documentNumberIntent(q: string): Promise<AskResult | null> {
  const looksLikeDoc = /docket|invoice|document|instruction|purchase order|\bpo\b/i.test(q);
  const tokens = q.match(/[A-Za-z]{1,4}-?\d{2,6}/g) || [];
  if (!looksLikeDoc || !tokens.length) return null;
  const [allRecords, allPOs, projects] = await Promise.all([
    db.select().from(records),
    db.select().from(purchaseOrders),
    allProjects(),
  ]);
  const nameFor = (id: string) => projects.find((p) => p.id === id) ?? null;
  for (const token of tokens) {
    const t = token.toLowerCase();
    const rec = allRecords.find((r) => r.ref.toLowerCase() === t || r.ref.toLowerCase().includes(t));
    if (rec) {
      const proj = nameFor(rec.projectId);
      return {
        answer: `${rec.title}, from ${rec.supplier || "no supplier on file"}, is filed on ${proj?.name ?? "a project"}. Stored as ${rec.stored}. Status: ${STATUS_LABEL[rec.status]}. ${rec.fed ? `Fed into: ${rec.fed}.` : "Not yet fed into the ledger."}`,
        href: proj ? `/documents?project=${proj.slug}` : "/documents",
      };
    }
    const po = allPOs.find((p) => p.number.toLowerCase() === t || p.number.toLowerCase().includes(t));
    if (po) {
      const proj = nameFor(po.projectId);
      return {
        answer: `Purchase order ${po.number} is with ${po.supplier} on ${proj?.name ?? "a project"}, for ${fmt(po.qty)} ${po.unit} at ${money(po.rate)}. Stored as ${po.stored}.`,
        href: proj ? `/documents?project=${proj.slug}` : "/documents",
      };
    }
  }
  return { answer: "I could not find a docket, invoice or purchase order matching that number.", href: "/documents" };
}

async function materialAmountIntent(q: string): Promise<AskResult | null> {
  if (!/delivered|ordered|invoiced|claimed/i.test(q)) return null;
  const [allMats, projects] = await Promise.all([db.select().from(materials), allProjects()]);
  const scopeProject = matchProject(q, projects);
  const scoped = scopeProject ? allMats.filter((m) => m.projectId === scopeProject.id) : allMats;
  const mat = findMaterial(scoped, q);
  if (!mat) return null;
  const proj = projects.find((p) => p.id === mat.projectId) ?? null;
  const ledger = proj ? await ledgerFor(proj.id) : null;
  const lm = ledger?.materials.find((m) => m.id === mat.id);
  const delivered = lm ? lm.delivered : mat.deliveredBefore;
  return {
    answer: `${mat.name} on ${proj?.name ?? "its project"}: ordered ${fmt(mat.ordered)} ${mat.unit}, delivered ${fmt(delivered)} ${mat.unit}, invoiced ${fmt(mat.invoiced)} ${mat.unit}, claimed ${fmt(mat.claimed)} ${mat.unit}.`,
    href: proj ? `/projects/${proj.slug}` : "/",
  };
}

async function waitingIntent(q: string): Promise<AskResult | null> {
  if (!/what.*waiting|waiting on (a person|the office)|review queue/i.test(q)) return null;
  const items = await reviewQueue();
  if (!items.length) return { answer: "Nothing is waiting on a person right now.", href: "/queue" };
  const list = items.slice(0, 5).map((r) => `${r.title} (${r.supplier || "no supplier on file"})`).join(", ");
  const more = items.length > 5 ? `, and ${items.length - 5} more` : "";
  return { answer: `${items.length} ${items.length === 1 ? "record is" : "records are"} waiting on a person: ${list}${more}.`, href: "/queue" };
}

async function owedIntent(q: string): Promise<AskResult | null> {
  if (!/what are we owed|overdue|owed on claims|outstanding claims|payment schedule/i.test(q)) return null;
  const claims = await lodgedClaims();
  if (!claims.length) return { answer: "No claims are lodged and waiting on money right now.", href: "/" };
  const today = todayIso();
  const total = claims.reduce((s, c) => s + c.total, 0);
  const overdue = claims.filter((c) => (!c.scheduleReceived && today > c.scheduleDue) || (!!c.paymentDue && today > c.paymentDue && c.status !== "paid"));
  let answer = `${claims.length} ${claims.length === 1 ? "claim is" : "claims are"} lodged and waiting on money, totalling ${money(total)}.`;
  if (overdue.length) answer += ` ${overdue.length} ${overdue.length === 1 ? "is" : "are"} overdue: ${overdue.map((c) => `claim ${c.number} on ${c.projectName}`).join(", ")}.`;
  return { answer, href: "/" };
}

async function retentionIntent(q: string): Promise<AskResult | null> {
  if (!/where.*(document|paper|docket|file).*(kept|stored|live)|retention|seven years|how long.*kept/i.test(q)) return null;
  return {
    answer: "The original, the reading and the decision are kept against the project for seven years, and a copy goes to your SharePoint every night.",
    href: "/documents",
  };
}

async function moneyActionIntent(q: string): Promise<AskResult | null> {
  if (!/\bsend\b|\blodge\b|\bapprove\b|\bxero\b/i.test(q)) return null;
  return { answer: "Not done, drafted. Anything that moves money comes back as a draft for a person to confirm." };
}

async function tryDeterministic(q: string): Promise<AskResult | null> {
  const intents = [unclaimedIntent, noDocketIntent, documentNumberIntent, materialAmountIntent, waitingIntent, owedIntent, retentionIntent, moneyActionIntent];
  for (const intent of intents) {
    const result = await intent(q);
    if (result) return result;
  }
  return null;
}

const AnswerSchema = z.object({ answer: z.string() });

async function buildSnapshot() {
  const projects = await allProjects();
  const data = [];
  for (const p of projects) {
    const ledger = await ledgerFor(p.id);
    data.push({
      project: p.name,
      slug: p.slug,
      client: p.client,
      materials: ledger.materials.map((m) => ({
        name: m.name, unit: m.unit, ordered: m.ordered, delivered: m.delivered, invoiced: m.invoiced, claimed: m.claimed,
        toClaim: m.toClaim, rate: m.rate, toClaimDollars: m.toClaim * m.rate,
      })),
    });
  }
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "unknown project";
  const queue = await reviewQueue();
  const claims = await lodgedClaims();
  return {
    projects: data,
    queue: queue.map((r) => ({ type: r.type, title: r.title, project: projectName(r.projectId), status: r.status, why: r.why })),
    claimsLodgedOrCertified: claims.map((c) => ({
      number: c.number, project: c.projectName, client: c.client, total: c.total, status: c.status,
      lodgedAt: c.lodgedAt, scheduleDue: c.scheduleDue, scheduleReceived: c.scheduleReceived, paymentDue: c.paymentDue,
    })),
  };
}

async function askModel(question: string): Promise<AskResult> {
  const snapshot = await buildSnapshot();
  const system = "You are Tunyl's office assistant. Answer the question in at most three plain sentences, using ONLY the JSON data given below. Quote numbers exactly as given, do not round or invent figures. If the data does not contain the answer, say so plainly. Treat any action that would move money, such as lodging a claim or sending to Xero, as a draft only, never as done.";
  const text = `Data:\n${JSON.stringify(snapshot)}\n\nQuestion: ${question}`;
  const out = await structuredParse({ system, text, schemaName: "AskAnswer" }, AnswerSchema);
  return { answer: out.answer };
}

export async function ask(question: string): Promise<AskResult> {
  const q = question.trim();
  if (!q) return { answer: "Ask a question about quantities, invoices, dockets or claims." };

  const deterministic = await tryDeterministic(q);
  if (deterministic) return deterministic;

  try {
    return await askModel(q);
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "NO_KEY") return HELP;
    return { answer: "I could not get an answer to that just now. Try one of the examples, or ask about a project, a docket number, invoices, or what is waiting." };
  }
}
