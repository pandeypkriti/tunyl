import "server-only";
import { db } from "@/db";
import {
  records, materials, projects,
  type RecordRow, type ReadField, type Flag, type RecordSource, type RecordType, type RecordStatus, type Material,
} from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { evaluateRule, findMaterial } from "./rules";
import { toContractUnits, fmt, todayIso } from "./units";

export type NewReading = {
  kind: string;                 // weighbridge | concrete | tipping | delivery | invoice | instruction | feed
  fields: ReadField[];
  flags: Flag[];
  po: string;
  imageUrl?: string;
  source: RecordSource;
  handedBy?: string;
  stored?: string;
};

const get = (fields: ReadField[], label: string) => fields.find((f) => f.label === label)?.value?.trim() ?? "";

export function titleFor(kind: string, ref: string): string {
  const k = kind.toLowerCase();
  const base = k === "weighbridge" ? "Weighbridge docket" : k === "concrete" ? "Concrete docket" : k === "tipping" ? "Tipping docket"
    : k === "invoice" ? "Tax invoice" : k === "instruction" ? "Site instruction" : k === "feed" ? "Haulage docket" : "Delivery docket";
  return ref ? `${base} ${ref}` : base;
}
export function typeFor(kind: string): RecordType {
  const k = kind.toLowerCase();
  return k === "invoice" ? "invoice" : k === "instruction" ? "instruction" : k === "feed" ? "feed" : "docket";
}

/** The site sends a reading. The rule decides: straight to the ledger, or wait. */
export async function createRecordFromReading(projectId: string, r: NewReading) {
  const mats = await db.select().from(materials).where(eq(materials.projectId, projectId));
  const supplier = get(r.fields, "Supplier"), ref = get(r.fields, "Docket number") || get(r.fields, "Invoice number");
  const date = get(r.fields, "Date") || todayIso(), materialText = get(r.fields, "Material");
  const qty = parseFloat(get(r.fields, "Quantity")), unit = get(r.fields, "Unit");
  const type = typeFor(r.kind);
  const rule = type === "docket" ? evaluateRule(r.fields, r.po, materialText, mats) : { pass: false, why: "Invoices and instructions always wait for a person.", material: findMaterial(mats, materialText) };
  const mat = rule.material;
  const conv = mat && Number.isFinite(qty) && qty > 0 ? toContractUnits(qty, unit, mat.unit, mat.tPerM3) : { qty: Number.NaN, note: "" };
  const status: RecordStatus = rule.pass ? "rule" : "waiting";
  const fed = rule.pass && mat ? `${mat.name.split(",")[0]}, ${fmt(conv.qty, 2)} ${mat.unit}${conv.note ? " (" + conv.note + ")" : ""}` : "";
  const [row] = await db.insert(records).values({
    projectId, type, status, source: r.source,
    title: titleFor(r.kind, ref), supplier, ref, date,
    materialId: mat?.id ?? null, materialText,
    qty: Number.isFinite(qty) ? qty : null, unit,
    qtyContract: rule.pass && Number.isFinite(conv.qty) ? conv.qty : null,
    po: r.po, fields: r.fields, flags: r.flags,
    imageUrl: r.imageUrl ?? "", stored: r.stored ?? (r.source === "feed" ? "Data feed" : r.source === "email" ? "PDF, emailed" : "Photo"),
    handedBy: r.handedBy ?? (type === "docket" ? `${supplier || "Supplier"}, driver to the site supervisor` : ""),
    fed, why: rule.why,
  }).returning();
  return { record: row, rule, material: mat, converted: conv };
}

/** A person ticks it. The quantity they confirm is what enters the ledger. */
export async function approveRecord(id: string, opts: { qty?: number | null; unit?: string; tickedBy: string; note?: string }) {
  const [row] = await db.select().from(records).where(eq(records.id, id));
  if (!row) throw new Error("Record not found");
  const mats = await db.select().from(materials).where(eq(materials.projectId, row.projectId));
  const mat = row.materialId ? mats.find((m) => m.id === row.materialId) ?? null : findMaterial(mats, row.materialText);
  const qty = opts.qty ?? row.qty ?? null;
  const unit = opts.unit ?? row.unit;
  if ((row.type === "docket" || row.type === "feed") && qty != null && !(qty > 0)) throw new Error("Quantity must be above zero");
  let qtyContract: number | null = null, fed = row.fed;
  let status: RecordStatus = "ticked";
  if (row.type === "docket" || row.type === "feed") {
    if (mat && qty != null && qty > 0) {
      const conv = toContractUnits(qty, unit, mat.unit, mat.tPerM3);
      qtyContract = conv.qty;
      fed = `${mat.name.split(",")[0]}, ${fmt(conv.qty, 2)} ${mat.unit}${conv.note ? " (" + conv.note + ")" : ""}`;
    } else if (row.type === "feed") { fed = fed || "Cartage, paired with weighbridge dockets"; }
  } else if (row.type === "invoice") { status = "approved"; fed = opts.note || fed || "Matched loads sent to ApprovalMax with dockets attached"; }
  else if (row.type === "instruction") { status = "logged"; fed = opts.note || fed || "Logged; variation raised, quantity set by dockets"; }
  const [updated] = await db.update(records).set({
    status, qty, unit, qtyContract, materialId: mat?.id ?? row.materialId, fed,
    tickedBy: opts.tickedBy, tickedAt: new Date(),
  }).where(eq(records.id, id)).returning();
  return updated;
}

export async function sendBackRecord(id: string, tickedBy: string) {
  const [updated] = await db.update(records).set({ status: "sent_back", tickedBy, tickedAt: new Date(), fed: "Sent back to site for a clearer photo" }).where(eq(records.id, id)).returning();
  return updated;
}

export async function holdRecord(id: string, why: string) {
  const [updated] = await db.update(records).set({ status: "held", why }).where(eq(records.id, id)).returning();
  return updated;
}

/** The exceptions a person needs to look at, newest first. */
export async function reviewQueue(projectId?: string): Promise<RecordRow[]> {
  const where = projectId
    ? and(eq(records.projectId, projectId), inArray(records.status, ["waiting", "held"]))
    : inArray(records.status, ["waiting", "held"]);
  return db.select().from(records).where(where).orderBy(desc(records.createdAt));
}

export async function recordById(id: string) {
  const [row] = await db.select().from(records).where(eq(records.id, id));
  return row ?? null;
}

export async function projectBySlug(slug: string) {
  const [p] = await db.select().from(projects).where(eq(projects.slug, slug));
  return p ?? null;
}
export async function projectBySiteToken(token: string) {
  const [p] = await db.select().from(projects).where(eq(projects.siteToken, token));
  return p ?? null;
}
export async function materialsFor(projectId: string): Promise<Material[]> {
  return db.select().from(materials).where(eq(materials.projectId, projectId)).orderBy(materials.sort);
}
