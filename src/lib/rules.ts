// The rule that lets a clean docket into the ledger without a person:
// every field reads ok, the material is on a purchase order for this project,
// and the docket carries a purchase order number. Anything else waits.
import type { Material, ReadField } from "@/db/schema";

export function findMaterial(materialsList: Material[], text: string): Material | null {
  const m = (text || "").toLowerCase();
  if (!m) return null;
  for (const mat of materialsList) {
    for (const k of mat.keys || []) if (k && m.includes(k.toLowerCase())) return mat;
  }
  return null;
}

export type RuleResult = { pass: boolean; why: string; material: Material | null };

export function evaluateRule(fields: ReadField[], po: string, materialText: string, materialsList: Material[]): RuleResult {
  const material = findMaterial(materialsList, materialText);
  const notClear = fields.filter((f) => f.state !== "clear" && f.state !== "neutral" && f.label !== "Purchase order").length;
  if (notClear) return { pass: false, why: `${notClear} ${notClear === 1 ? "field needs" : "fields need"} a look, so it waits for the office.`, material };
  if (!material) return { pass: false, why: "The material is not on a purchase order for this project, so it waits for the office.", material };
  if (!po) return { pass: false, why: "No purchase order number on the docket, so it waits for the office.", material };
  return { pass: true, why: `Every field reads ok and ${po} matches the purchase order. Straight to the ledger.`, material };
}
