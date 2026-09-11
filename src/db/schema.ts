// Tunyl data model. One record per piece of paper, filed against its project.
// Quantities are doubles; money is in dollars ex GST. Dates are ISO strings
// (YYYY-MM-DD) because that is how they appear on the paper.
import {
  pgTable, text, doublePrecision, integer, jsonb, timestamp, boolean, uuid,
} from "drizzle-orm/pg-core";

export type FieldState = "clear" | "check" | "unreadable" | "neutral";
export type ReadField = { label: string; value: string; state: FieldState };
export type Flag = { level: "check" | "crit"; text: string };
export type RecordType = "docket" | "invoice" | "instruction" | "feed";
export type RecordStatus = "rule" | "waiting" | "ticked" | "held" | "sent_back" | "approved" | "logged";
export type RecordSource = "photo" | "email" | "feed" | "example" | "whatsapp";
export type ClaimStatus = "draft" | "lodged" | "certified" | "paid";
export type ClaimLine = { material: string; qty: number; unit: string; rate: number; amount: number };

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  client: text("client").notNull(),
  clientPlatform: text("client_platform").notNull().default(""),
  clientSlug: text("client_slug").notNull().default(""),
  nextClaimNo: integer("next_claim_no").notNull().default(1),
  siteToken: text("site_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  unit: text("unit").notNull(),               // contract unit: m³, t, m², h, days
  keys: jsonb("keys").$type<string[]>().notNull().default([]), // lowercase match words
  ordered: doublePrecision("ordered").notNull().default(0),
  rate: doublePrecision("rate").notNull().default(0),
  tPerM3: doublePrecision("t_per_m3").notNull().default(1), // conversion factor from the PO
  deliveredBefore: doublePrecision("delivered_before").notNull().default(0), // brought forward
  invoiced: doublePrecision("invoiced").notNull().default(0),
  claimed: doublePrecision("claimed").notNull().default(0),
  sort: integer("sort").notNull().default(0),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  supplier: text("supplier").notNull(),
  materialId: uuid("material_id").references(() => materials.id, { onDelete: "set null" }),
  qty: doublePrecision("qty").notNull().default(0),
  unit: text("unit").notNull().default(""),
  rate: doublePrecision("rate").notNull().default(0),
  date: text("date").notNull().default(""),
  stored: text("stored").notNull().default("PDF from Xero"),
});

export const records = pgTable("records", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").$type<RecordType>().notNull().default("docket"),
  status: text("status").$type<RecordStatus>().notNull().default("waiting"),
  source: text("source").$type<RecordSource>().notNull().default("photo"),
  title: text("title").notNull().default(""),      // e.g. "Weighbridge docket 88213"
  supplier: text("supplier").notNull().default(""),
  ref: text("ref").notNull().default(""),          // docket / invoice / SI number
  date: text("date").notNull().default(""),
  materialId: uuid("material_id").references(() => materials.id, { onDelete: "set null" }),
  materialText: text("material_text").notNull().default(""),
  qty: doublePrecision("qty"),                     // as on the paper
  unit: text("unit").notNull().default(""),        // as on the paper
  qtyContract: doublePrecision("qty_contract"),    // in the material's contract unit
  po: text("po").notNull().default(""),
  fields: jsonb("fields").$type<ReadField[]>().notNull().default([]),
  flags: jsonb("flags").$type<Flag[]>().notNull().default([]),
  imageUrl: text("image_url").notNull().default(""),
  stored: text("stored").notNull().default("Photo"),
  handedBy: text("handed_by").notNull().default(""),
  fed: text("fed").notNull().default(""),
  why: text("why").notNull().default(""),          // why it waited, or "matched by rule"
  tickedBy: text("ticked_by").notNull().default(""),
  tickedAt: timestamp("ticked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  periodEnd: text("period_end").notNull(),
  lines: jsonb("lines").$type<ClaimLine[]>().notNull().default([]),
  total: doublePrecision("total").notNull().default(0),
  status: text("status").$type<ClaimStatus>().notNull().default("draft"),
  token: text("token").notNull().unique(),
  lodgedAt: text("lodged_at").notNull().default(""),
  scheduleDue: text("schedule_due").notNull().default(""),
  scheduleReceived: text("schedule_received").notNull().default(""),
  paymentDue: text("payment_due").notNull().default(""),
  paidAt: text("paid_at").notNull().default(""),
  stored: text("stored").notNull().default("Draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Builder-side module, kept for parity with the demo.
export const waits = pgTable("waits", {
  id: uuid("id").primaryKey().defaultRandom(),
  what: text("what").notNull(),
  fromParty: text("from_party").notNull(),
  who: text("who").notNull(),
  job: text("job").notNull(),
  jobNo: text("job_no").notNull(),
  kpiDays: integer("kpi_days").notNull(),
  askedOn: text("asked_on").notNull(),
  done: boolean("done").notNull().default(false),
});

export type Project = typeof projects.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type RecordRow = typeof records.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type Wait = typeof waits.$inferSelect;
