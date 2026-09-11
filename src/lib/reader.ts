// The docket reader: one vision-model call into a fixed schema, a state per
// field. It never invents a number: a field it cannot read comes back
// "unreadable" with an empty value.
import { z } from "zod";
import { structuredParse } from "./provider";
import type { ReadField, Flag } from "@/db/schema";

const F = z.object({ value: z.string(), confidence: z.enum(["clear", "check", "unreadable"]) });

export const DocketReadingSchema = z.object({
  isDocket: z.boolean(),
  kind: z.enum(["weighbridge", "concrete", "tipping", "delivery", "invoice", "instruction", "other"]),
  supplier: F,
  docket: F,
  date: F,          // YYYY-MM-DD
  material: F,
  quantity: F,      // number as text, e.g. "24.86"
  unit: F,          // m³, t, loads, L, each or empty
  truck: F,
  deliveredTo: F,
  signedBy: F,
  purchaseOrder: F, // any PO / order number printed on the docket
  flags: z.array(z.object({ level: z.enum(["check", "crit"]), text: z.string() })),
});
export type DocketReading = z.infer<typeof DocketReadingSchema>;

export const FIELD_LABELS: Array<[keyof DocketReading, string]> = [
  ["supplier", "Supplier"], ["docket", "Docket number"], ["date", "Date"], ["material", "Material"],
  ["quantity", "Quantity"], ["unit", "Unit"], ["truck", "Truck or rego"], ["deliveredTo", "Delivered to"],
  ["signedBy", "Received by"], ["purchaseOrder", "Purchase order"],
];

const PROMPT = `You are reading a photo of a construction delivery document from an Australian site: a quarry weighbridge docket, a concrete delivery docket, a tipping or cartage docket for spoil, a general delivery docket, a supplier invoice, or a builder's site instruction.
Extract the fields. Rules:
- confidence is "clear" when printed and unambiguous, "check" when handwritten, partly obscured or readable two ways, "unreadable" when it cannot be read (then leave value empty).
- unit is one of m³, t, loads, L, each, or empty.
- On a weighbridge docket the quantity is the NET weight, never gross or tare.
- date is YYYY-MM-DD.
- purchaseOrder is any order or PO number printed on the document, else empty.
- Never invent a value. If it is not on the paper, leave it empty and mark unreadable.
- flags: short notes, one per thing a person should check against the paper. level "crit" for a missing signature, an ambiguous quantity, or a quantity and unit that do not match the material; otherwise "check".
- If the photo is not a construction document at all, set isDocket to false and put one flag saying what the photo shows.`;

export async function readDocket(imageB64: string): Promise<DocketReading> {
  return structuredParse({ text: PROMPT, imageB64, schemaName: "docket_reading" }, DocketReadingSchema);
}

// Shape the reading into the fields the app stores and shows.
export function toFields(r: DocketReading): ReadField[] {
  return FIELD_LABELS.map(([k, label]) => {
    const f = r[k] as { value: string; confidence: "clear" | "check" | "unreadable" };
    return { label, value: f.value ?? "", state: f.confidence ?? "check" };
  });
}
export function toFlags(r: DocketReading): Flag[] {
  return (r.flags || []).filter((f) => f && f.text).map((f) => ({ level: f.level === "crit" ? "crit" : "check", text: f.text }));
}
