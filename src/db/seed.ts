// Demo data, ported from the docket-to-claim demo. Every company, docket and
// figure is invented. Run: npm run db:seed (needs DATABASE_URL).
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" }); loadEnv();
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as s from "./schema";
import type { ReadField, Flag } from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema: s });

const F = (label: string, value: string, state: ReadField["state"] = "clear"): ReadField => ({ label, value, state });

async function main() {
  // wipe (order matters for foreign keys)
  await db.delete(s.records); await db.delete(s.claims); await db.delete(s.purchaseOrders);
  await db.delete(s.materials); await db.delete(s.projects); await db.delete(s.waits);

  const [kv, bh, mp, sc] = await db.insert(s.projects).values([
    { slug: "kellyville-ridge", name: "Kellyville Ridge bulk earthworks", client: "Harrowgate Constructions", clientPlatform: "their own portal", clientSlug: "harrowgate", clientEmail: "accounts@harrowgate.example.com", nextClaimNo: 6, siteToken: "kr-gate2-7f3a" },
    { slug: "box-hill-basin", name: "Box Hill detention basin", client: "Stoneleigh Developments", clientPlatform: "HammerTech", clientSlug: "stoneleigh", clientEmail: "contracts@stoneleigh.example.com", nextClaimNo: 9, siteToken: "bh-basin-2c9e" },
    { slug: "marsden-park-roads", name: "Marsden Park roads, stage 3", client: "Meridian Build Group", clientPlatform: "Procore", clientSlug: "meridian", clientEmail: "claims@meridian.example.com", nextClaimNo: 5, siteToken: "mp-roads-91ab" },
    { slug: "schofields-drainage", name: "Schofields drainage package", client: "Harrowgate Constructions", clientPlatform: "their own portal", clientSlug: "harrowgate", clientEmail: "accounts@harrowgate.example.com", nextClaimNo: 3, siteToken: "sc-drain-44d0" },
  ]).returning();

  const mats = await db.insert(s.materials).values([
    { projectId: kv.id, name: "Select fill, supply and place", unit: "m³", keys: ["select fill"], ordered: 12000, rate: 42, tPerM3: 1.8, deliveredBefore: 8640, invoiced: 8200, claimed: 4740, sort: 1 },
    { projectId: kv.id, name: "DGB20 road base", unit: "t", keys: ["dgb20", "road base"], ordered: 2400, rate: 46.5, tPerM3: 2.1, deliveredBefore: 1116, invoiced: 1116, claimed: 476, sort: 2 },
    { projectId: kv.id, name: "N32 concrete", unit: "m³", keys: ["n32", "concrete"], ordered: 120, rate: 285, tPerM3: 2.4, deliveredBefore: 84, invoiced: 84, claimed: 70, sort: 3 },
    { projectId: kv.id, name: "Spoil out (ENM), cartage", unit: "m³", keys: ["spoil", "enm"], ordered: 900, rate: 18.5, tPerM3: 1.6, deliveredBefore: 388, invoiced: 388, claimed: 300, sort: 4 },
    { projectId: kv.id, name: "GP sand", unit: "t", keys: ["sand"], ordered: 1200, rate: 29, tPerM3: 1.5, deliveredBefore: 480, invoiced: 480, claimed: 100, sort: 5 },
    { projectId: kv.id, name: "Topsoil", unit: "m³", keys: ["topsoil"], ordered: 900, rate: 35, tPerM3: 1.3, deliveredBefore: 0, invoiced: 0, claimed: 0, sort: 6 },
    { projectId: kv.id, name: "Dewatering, day rate", unit: "days", keys: ["dewatering"], ordered: 0, rate: 1955, tPerM3: 1, deliveredBefore: 4, invoiced: 0, claimed: 0, sort: 7 },
    { projectId: bh.id, name: "N20 concrete, 20 mm", unit: "m³", keys: ["n20"], ordered: 640, rate: 285, tPerM3: 2.4, deliveredBefore: 610, invoiced: 630, claimed: 400, sort: 1 },
    { projectId: bh.id, name: "N32 concrete, kerb", unit: "m³", keys: ["kerb"], ordered: 160, rate: 310, tPerM3: 2.4, deliveredBefore: 120, invoiced: 120, claimed: 60, sort: 2 },
    { projectId: bh.id, name: "Select fill, supply and place", unit: "m³", keys: ["select fill"], ordered: 2100, rate: 42, tPerM3: 1.8, deliveredBefore: 2100, invoiced: 2100, claimed: 1700, sort: 3 },
    { projectId: bh.id, name: "Geofabric", unit: "m²", keys: ["geofabric"], ordered: 4000, rate: 6.5, tPerM3: 1, deliveredBefore: 3400, invoiced: 3400, claimed: 2200, sort: 4 },
    { projectId: bh.id, name: "20 t excavator, hours", unit: "h", keys: ["excavator"], ordered: 0, rate: 398.5, tPerM3: 1, deliveredBefore: 100, invoiced: 0, claimed: 0, sort: 5 },
    { projectId: mp.id, name: "DGB20 road base", unit: "t", keys: ["dgb20", "road base"], ordered: 4500, rate: 46.5, tPerM3: 2.1, deliveredBefore: 3120, invoiced: 3120, claimed: 3120, sort: 1 },
    { projectId: sc.id, name: "GP sand", unit: "t", keys: ["sand"], ordered: 1200, rate: 29, tPerM3: 1.5, deliveredBefore: 480, invoiced: 480, claimed: 0, sort: 1 },
    { projectId: sc.id, name: "Drainage pipe, 375 RCP", unit: "m", keys: ["rcp", "pipe"], ordered: 900, rate: 48, tPerM3: 1, deliveredBefore: 640, invoiced: 640, claimed: 0, sort: 2 },
  ]).returning();
  const M = (projectId: string, key: string) => mats.find((m) => m.projectId === projectId && m.keys.includes(key))!;

  await db.insert(s.purchaseOrders).values([
    { projectId: kv.id, number: "PO-4468", supplier: "Kellyville Quarries", materialId: M(kv.id, "select fill").id, qty: 12000, unit: "m³", rate: 42, date: "2026-08-05" },
    { projectId: kv.id, number: "PO-4471", supplier: "Kurrajong Quarries", materialId: M(kv.id, "dgb20").id, qty: 2400, unit: "t", rate: 46.5, date: "2026-08-12" },
    { projectId: kv.id, number: "PO-4475", supplier: "Westline Concrete Pty Ltd", materialId: M(kv.id, "n32").id, qty: 120, unit: "m³", rate: 285, date: "2026-08-14" },
    { projectId: bh.id, number: "PO-4490", supplier: "Westgate Concrete", materialId: M(bh.id, "n20").id, qty: 640, unit: "m³", rate: 285, date: "2026-08-20" },
    { projectId: mp.id, number: "PO-4455", supplier: "Kurrajong Quarries", materialId: M(mp.id, "dgb20").id, qty: 4500, unit: "t", rate: 46.5, date: "2026-07-28" },
  ]);

  const docket = (projectId: string, o: Partial<s.RecordRow> & { title: string; supplier: string; ref: string; date: string; matKey?: string; qty?: number; unit?: string }) => {
    const mat = o.matKey ? M(projectId, o.matKey) : null;
    const qc = mat && o.qty != null ? (o.unit === "t" && mat.unit === "m³" ? o.qty / mat.tPerM3 : o.qty) : null;
    return {
      projectId, type: (o.type ?? "docket") as s.RecordType, status: (o.status ?? "rule") as s.RecordStatus, source: (o.source ?? "photo") as s.RecordSource,
      title: o.title, supplier: o.supplier, ref: o.ref, date: o.date, materialId: mat?.id ?? null, materialText: mat?.name ?? o.materialText ?? "",
      qty: o.qty ?? null, unit: o.unit ?? "", qtyContract: o.status === "waiting" || o.status === "held" ? null : qc, po: o.po ?? "",
      fields: o.fields ?? [], flags: o.flags ?? [], imageUrl: "", stored: o.stored ?? "Photo",
      handedBy: o.handedBy ?? `${o.supplier}, driver to the site supervisor`, fed: o.fed ?? (mat && qc != null ? `${mat.name.split(",")[0]}, ${qc.toFixed(2)} ${mat.unit}` : ""),
      why: o.why ?? (o.status === "rule" ? "Every field read ok and the purchase order matched." : ""), tickedBy: o.tickedBy ?? "", tickedAt: o.tickedBy ? new Date("2026-09-08T07:02:00Z") : null,
    };
  };

  await db.insert(s.records).values([
    // Kellyville, in the ledger (delivered figures above already include these, so qtyContract is kept out of the seeded totals by using deliveredBefore)
    docket(kv.id, { title: "Weighbridge docket 88212", supplier: "Kellyville Quarries", ref: "88212", date: "2026-09-08", matKey: "select fill", qty: 31.4, unit: "t", po: "PO-4468", status: "rule" }),
    docket(kv.id, { title: "Weighbridge docket 88211", supplier: "Kellyville Quarries", ref: "88211", date: "2026-09-08", matKey: "select fill", qty: 31.88, unit: "t", po: "PO-4468", status: "rule" }),
    docket(kv.id, { title: "Weighbridge docket 2026-091540", supplier: "Kurrajong Quarries", ref: "2026-091540", date: "2026-09-07", matKey: "dgb20", qty: 24.62, unit: "t", po: "PO-4471", status: "rule" }),
    docket(kv.id, { title: "Concrete docket 48198", supplier: "Westline Concrete Pty Ltd", ref: "48198", date: "2026-09-07", matKey: "n32", qty: 7, unit: "m³", po: "PO-4475", status: "rule" }),
    docket(kv.id, { title: "Tipping docket 0916", supplier: "Mullins Haulage", ref: "0916", date: "2026-09-06", matKey: "spoil", qty: 12, unit: "m³", status: "ticked", tickedBy: "Mel R.", why: "Handwritten quantity; loose volume, bulking applied." }),
    docket(kv.id, { title: "Haulage docket HH-30976", supplier: "Hume Haulage", ref: "HH-30976", date: "2026-09-08", type: "feed", source: "feed", stored: "Data feed", status: "ticked", tickedBy: "Mel R.", materialText: "Cartage, select fill", qty: 11, unit: "loads", fed: "Cartage, 11 loads, 8.5 h to ApprovalMax", handedBy: "Hume Haulage, from their Kynection app" }),
    // Kellyville, waiting
    docket(kv.id, { title: "Haulage docket HH-30977", supplier: "Hume Haulage", ref: "HH-30977", date: "2026-09-08", type: "feed", source: "feed", stored: "Data feed", status: "waiting", materialText: "Cartage, select fill", qty: 12, unit: "loads", handedBy: "Hume Haulage, from their Kynection app", why: "Cartage is billed by the hour, material by the tonne. A person pairs the 12 loads with weighbridge dockets 88202 to 88213 once; after that the pairing runs by itself.",
      fields: [F("Source", "Hume Haulage, Kynection docket feed, received as data", "neutral"), F("Docket number", "HH-30977"), F("Date", "2026-09-08"), F("Truck", "XR 44 PQ, truck and dog"), F("Cartage", "Kellyville Quarries pit to Kellyville Ridge"), F("Loads", "12"), F("Hours", "9.5"), F("Rate", "$148 per hour cartage, matches the purchase order"), F("Weighbridge dockets", "12 of 12 found, 88202 to 88213, by rego and time", "check")],
      flags: [{ level: "check", text: "Cartage is billed by the hour, material by the tonne. Confirm once that these 12 loads are weighbridge dockets 88202 to 88213." }] as Flag[] }),
    docket(kv.id, { title: "Tax invoice INV-4471", supplier: "Kellyville Quarries", ref: "INV-4471", date: "2026-09-08", type: "invoice", source: "email", stored: "PDF, emailed", status: "held", materialText: "Select fill", qty: 812.4, unit: "t", handedBy: "Kellyville Quarries accounts, to the project inbox", why: "Two loads on the invoice, dockets 88190 and 88191, have no docket on file: 63.5 t, $1,428.75 billed without paper.",
      fields: [F("Supplier", "Kellyville Quarries"), F("Invoice number", "INV-4471"), F("Period", "1 to 7 Sep 2026"), F("Loads billed", "26"), F("Dockets on file", "24", "check"), F("Tonnes billed", "812.4 t"), F("Tonnes on dockets", "748.9 t", "check"), F("Rate", "$22.50 per tonne, matches the purchase order"), F("Total ex GST", "$18,279.00")],
      flags: [{ level: "crit", text: "Two loads on the invoice, dockets 88190 and 88191, have no docket on file. That is 63.5 t, or $1,428.75, billed without paper." }, { level: "check", text: "The 24 matched loads can go to ApprovalMax now with their dockets attached. The two unmatched loads stay held until the site finds the paper." }] as Flag[] }),
    // Box Hill
    docket(bh.id, { title: "Concrete docket C-20990", supplier: "Westgate Concrete", ref: "C-20990", date: "2026-09-09", matKey: "n20", qty: 6, unit: "m³", po: "PO-4490", status: "rule" }),
    docket(bh.id, { title: "Concrete docket C-20984", supplier: "Westgate Concrete", ref: "C-20984", date: "2026-09-08", matKey: "n20", qty: 6, unit: "m³", po: "PO-4490", status: "rule" }),
    docket(bh.id, { title: "Concrete docket C-20991", supplier: "Westgate Concrete", ref: "C-20991", date: "2026-09-09", matKey: "n20", qty: 6, unit: "m³", po: "PO-4490", status: "waiting", why: "Time on site and the signature cannot be read from this photo.",
      fields: [F("Supplier", "Westgate Concrete"), F("Docket number", "C-20991"), F("Date", "2026-09-09"), F("Material", "N20 concrete, 20 mm, slump 100"), F("Quantity", "6.0"), F("Unit", "m³"), F("Truck or rego", "WG 118"), F("Delivered to", "Box Hill detention basin"), F("Received by", "", "unreadable"), F("Purchase order", "PO-4490")],
      flags: [{ level: "crit", text: "Time on site and the signature cannot be read from this photo. The quantity is clear, so the 6.0 m³ can be added now and the signature chased, or the docket sent back for a better photo." }] as Flag[] }),
    // Marsden Park
    docket(mp.id, { title: "Site instruction SI-31", supplier: "Meridian Build Group", ref: "SI-31", date: "2026-09-09", type: "instruction", source: "email", stored: "Email and PDF", status: "waiting", materialText: "DGB20 road base", qty: 400, unit: "t", handedBy: "Meridian Build Group site engineer, to our foreman", why: "The email says approx 400 t. Log the instruction, raise the variation, let the dockets set the final tonnage.",
      fields: [F("From", "Site engineer, Meridian Build Group"), F("Received", "2026-09-09 07:12"), F("Instruction number", "SI-31"), F("Material", "DGB20 road base"), F("Quantity", "400 t, stated as approximate", "check"), F("Location", "Chainage 1200 to 1350"), F("Suggested action", "Raise variation V-08 against the instruction", "neutral")],
      flags: [{ level: "check", text: "The email says \"approx 400 t\". Log the instruction now, raise V-08, and let the dockets set the final tonnage." }] as Flag[] }),
  ]);

  await db.insert(s.claims).values([
    { projectId: kv.id, number: 5, periodEnd: "2026-08-31", lines: [{ material: "Select fill, supply and place", qty: 3900, unit: "m³", rate: 42, amount: 163800 }, { material: "DGB20 road base", qty: 400, unit: "t", rate: 46.5, amount: 18600 }, { material: "Dewatering, day rate", qty: 3, unit: "days", rate: 1955, amount: 5865 }], total: 188265, status: "certified", token: "kr-claim5-a1b2c3", createdAt: new Date("2026-08-31T09:00:00Z"), lodgedAt: "2026-09-01", scheduleDue: "2026-09-15", scheduleReceived: "2026-09-09", paymentDue: "2026-09-29", stored: "Builder template and PDF" },
    { projectId: mp.id, number: 4, periodEnd: "2026-08-31", lines: [{ material: "DGB20 road base", qty: 2073, unit: "t", rate: 46.5, amount: 96394.5 }], total: 96394.5, status: "lodged", token: "mp-claim4-d4e5f6", createdAt: new Date("2026-09-01T09:00:00Z"), lodgedAt: "2026-09-02", scheduleDue: "2026-09-16", stored: "Procore upload and PDF" },
    { projectId: bh.id, number: 8, periodEnd: "2026-08-24", lines: [{ material: "N20 concrete, 20 mm", qty: 400, unit: "m³", rate: 285, amount: 114000 }, { material: "Geofabric", qty: 1192, unit: "m²", rate: 6.5, amount: 7748 }], total: 121748, status: "lodged", token: "bh-claim8-g7h8i9", createdAt: new Date("2026-08-24T09:00:00Z"), lodgedAt: "2026-08-25", scheduleDue: "2026-09-08", stored: "HammerTech upload and PDF" },
    { projectId: sc.id, number: 2, periodEnd: "2026-08-02", lines: [{ material: "GP sand", qty: 480, unit: "t", rate: 29, amount: 13920 }, { material: "Drainage pipe, 375 RCP", qty: 640, unit: "m", rate: 48, amount: 30720 }, { material: "Excavation to trench, day rate", qty: 7, unit: "days", rate: 1955, amount: 13685 }], total: 58325, status: "certified", token: "sc-claim2-j1k2l3", createdAt: new Date("2026-08-03T09:00:00Z"), lodgedAt: "2026-08-04", scheduleDue: "2026-08-18", scheduleReceived: "2026-08-12", paymentDue: "2026-09-01", stored: "Builder template and PDF" },
  ]);

  await db.insert(s.waits).values([
    { what: "BASIX certificate", fromParty: "BASIX consultant", who: "Priya", job: "Lot 214 The Gables", jobNo: "26-0412", kpiDays: 7, askedOn: "2026-09-01" },
    { what: "Structural engineering", fromParty: "Engineer", who: "Sam", job: "Lot 214 The Gables", jobNo: "26-0412", kpiDays: 7, askedOn: "2026-09-06" },
    { what: "Survey and soils", fromParty: "Surveyor", who: "Dean", job: "Lot 88 Box Hill", jobNo: "26-0388", kpiDays: 14, askedOn: "2026-08-26" },
    { what: "Sydney Water approval", fromParty: "Sydney Water", who: "the case officer", job: "Lot 214 The Gables", jobNo: "26-0412", kpiDays: 10, askedOn: "2026-08-31" },
    { what: "Construction certificate", fromParty: "Private certifier", who: "Mel", job: "Lot 31 Thornton", jobNo: "26-0431", kpiDays: 5, askedOn: "2026-09-08" },
    { what: "Colour selections", fromParty: "Client", who: "the client", job: "Lot 88 Box Hill", jobNo: "26-0388", kpiDays: 14, askedOn: "2026-08-20" },
  ]);

  await db.delete(s.actions);
  const ago = (h: number) => new Date(Date.now() - h * 3600 * 1000);
  await db.insert(s.actions).values([
    { actor: "Mel R.", kind: "tick", subject: "Tipping docket 0916", href: "/queue", projectId: kv.id, createdAt: ago(30) },
    { actor: "Mel R.", kind: "tick", subject: "Haulage docket HH-30976", href: "/queue", projectId: kv.id, createdAt: ago(26) },
    { actor: "Mel R.", kind: "lodge_claim", subject: "claim 4, $96,395", href: "/claims", projectId: mp.id, createdAt: ago(20) },
    { actor: "Site, Kellyville Ridge bulk earthworks", kind: "site_send", subject: "Weighbridge docket 88212", href: "/queue", projectId: kv.id, createdAt: ago(18) },
  ]);
  console.log("Seeded: 4 projects, materials, purchase orders, records, claims, waits, actions.");
  console.log("Site links: /site/kr-gate2-7f3a (Kellyville), /site/bh-basin-2c9e (Box Hill)");
  console.log("Builder links: /c/kr-claim5-a1b2c3, /c/mp-claim4-d4e5f6");
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
