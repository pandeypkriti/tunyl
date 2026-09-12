import "server-only";
import { db } from "@/db";
import { claims, materials, projects, type Claim, type ClaimLine } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { ledgerFor } from "./ledger";
import { addBusinessDays, todayIso } from "./units";
import { randomBytes } from "node:crypto";

export function newToken(prefix = ""): string {
  return prefix + randomBytes(9).toString("base64url");
}

/** Build (or rebuild) the draft claim from verified quantities only. */
export async function draftClaim(projectId: string, periodEnd = todayIso()): Promise<Claim> {
  const led = await ledgerFor(projectId);
  const lines: ClaimLine[] = led.materials.filter((m) => m.toClaim > 0).map((m) => ({
    material: m.name, qty: m.toClaim, unit: m.unit, rate: m.rate, amount: m.toClaim * m.rate,
  }));
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const existing = led.draft;
  if (existing) {
    const [u] = await db.update(claims).set({ lines, total, periodEnd }).where(eq(claims.id, existing.id)).returning();
    return u;
  }
  const [c] = await db.insert(claims).values({
    projectId, number: led.project.nextClaimNo, periodEnd, lines, total, status: "draft", token: newToken(), stored: "Draft",
  }).returning();
  return c;
}

/** Lodging moves the claimed figures, starts the Security of Payment clock, and bumps the claim number. */
export async function lodgeClaim(claimId: string): Promise<Claim> {
  const [c] = await db.select().from(claims).where(eq(claims.id, claimId));
  if (!c) throw new Error("Claim not found");
  if (c.status !== "draft") return c;
  const today = todayIso();
  const mats = await db.select().from(materials).where(eq(materials.projectId, c.projectId));
  for (const line of c.lines) {
    const m = mats.find((x) => x.name === line.material);
    if (m) await db.update(materials).set({ claimed: m.claimed + line.qty }).where(eq(materials.id, m.id));
  }
  const [u] = await db.update(claims).set({
    status: "lodged", lodgedAt: today, scheduleDue: addBusinessDays(today, 10), stored: "Builder template and PDF",
  }).where(eq(claims.id, claimId)).returning();
  await db.update(projects).set({ nextClaimNo: c.number + 1 }).where(eq(projects.id, c.projectId));
  return u;
}

export async function claimByToken(token: string) {
  const [c] = await db.select().from(claims).where(eq(claims.token, token));
  if (!c) return null;
  const [p] = await db.select().from(projects).where(eq(projects.id, c.projectId));
  return { claim: c, project: p };
}

export async function claimsFor(projectId: string): Promise<Claim[]> {
  return db.select().from(claims).where(eq(claims.projectId, projectId)).orderBy(desc(claims.number));
}
export async function lodgedClaims(): Promise<Array<Claim & { projectName: string; client: string; clientEmail: string }>> {
  const rows = await db.select().from(claims).where(and(eq(claims.status, "lodged"))).orderBy(desc(claims.lodgedAt));
  const cert = await db.select().from(claims).where(eq(claims.status, "certified"));
  const ps = await db.select().from(projects);
  return [...rows, ...cert].map((c) => { const p = ps.find((x) => x.id === c.projectId); return { ...c, projectName: p?.name ?? "", client: p?.client ?? "", clientEmail: p?.clientEmail ?? "" }; });
}
