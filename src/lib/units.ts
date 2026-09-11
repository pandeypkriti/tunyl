// Trucks deliver tonnes, contracts measure cubic metres. The factor lives on
// the material (from the purchase order) and is shown, never hidden.
export function toContractUnits(qty: number, unit: string, contractUnit: string, tPerM3: number): { qty: number; note: string } {
  const u = (unit || "").trim();
  if (!u || u === contractUnit || u === "loads" || u === "each") return { qty, note: "" };
  if (u === "t" && contractUnit === "m³") {
    const q = qty / (tPerM3 || 1);
    return { qty: q, note: `${fmt(q, 2)} m³ at ${tPerM3} t/m³` };
  }
  if (u === "m³" && contractUnit === "t") {
    const q = qty * (tPerM3 || 1);
    return { qty: q, note: `${fmt(q, 2)} t at ${tPerM3} t/m³` };
  }
  return { qty, note: "" };
}

export function fmt(n: number | null | undefined, d = 0): string {
  return Number(n ?? 0).toLocaleString("en-AU", { maximumFractionDigits: d });
}
export function money(n: number | null | undefined): string {
  return "$" + fmt(n, 0);
}
export function fmtDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1].slice(2)}` : iso || "";
}
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
export function addBusinessDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const w = d.getUTCDay();
    if (w !== 0 && w !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}
export function businessDaysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00Z"), b = new Date(toIso + "T00:00:00Z");
  let n = 0;
  while (a < b) {
    a.setUTCDate(a.getUTCDate() + 1);
    const w = a.getUTCDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}
