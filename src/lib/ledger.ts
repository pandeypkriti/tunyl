import "server-only";
import { db } from "@/db";
import { records, materials, projects, claims, type Material, type RecordRow, type Project, type Claim } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export type LedgerMaterial = Material & { delivered: number; toClaim: number; gap: { kind: "hold" | "ok" | "none" | "done"; text: string } };
export type Ledger = { project: Project; materials: LedgerMaterial[]; dockets: RecordRow[]; draft: Claim | null };

const IN_LEDGER = ["rule", "ticked"] as const;

export async function ledgerFor(projectId: string): Promise<Ledger> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) throw new Error("Project not found");
  const mats = await db.select().from(materials).where(eq(materials.projectId, projectId)).orderBy(materials.sort);
  const rows = await db.select().from(records).where(and(eq(records.projectId, projectId), inArray(records.status, [...IN_LEDGER]))).orderBy(desc(records.date), desc(records.createdAt));
  const delivered = new Map<string, number>();
  for (const r of rows) if (r.materialId && r.qtyContract) delivered.set(r.materialId, (delivered.get(r.materialId) ?? 0) + r.qtyContract);
  const lm: LedgerMaterial[] = mats.map((m) => {
    const del = m.deliveredBefore + (delivered.get(m.id) ?? 0);
    const toClaim = Math.max(0, del - m.claimed);
    let gap: LedgerMaterial["gap"];
    if (m.invoiced > del + 1e-9) gap = { kind: "hold", text: `Invoiced ${fmtN(m.invoiced - del)} ${m.unit} more than delivered. Hold the invoice.` };
    else if (del === 0) gap = { kind: "none", text: "Not started" };
    else if (toClaim > 0) gap = { kind: "ok", text: `${fmtN(toClaim)} ${m.unit} verified, not yet claimed` };
    else gap = { kind: "done", text: "Fully claimed" };
    return { ...m, delivered: del, toClaim, gap };
  });
  const [draft] = await db.select().from(claims).where(and(eq(claims.projectId, projectId), eq(claims.status, "draft"))).orderBy(desc(claims.createdAt)).limit(1);
  return { project, materials: lm, dockets: rows, draft: draft ?? null };
}

function fmtN(n: number) { return Number(n).toLocaleString("en-AU", { maximumFractionDigits: 0 }); }

export async function allProjects(): Promise<Project[]> {
  return db.select().from(projects).orderBy(projects.name);
}
