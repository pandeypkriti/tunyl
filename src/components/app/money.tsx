import { cn } from "@/lib/utils";
import { money as fmtMoney, fmt } from "@/lib/units";

/** Money coloured by meaning: positive = owed to us or verified, negative = cost, held or overdue. */
export function Money({ value, tone = "plain", className }: { value: number; tone?: "plain" | "positive" | "negative"; className?: string }) {
  return <span className={cn("tabular-nums", tone === "positive" && "text-[color:var(--success-ink)]", tone === "negative" && "text-[color:var(--danger-ink)]", className)}>{fmtMoney(value)}</span>;
}
export function Qty({ value, unit, d = 0, className }: { value: number; unit?: string; d?: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{fmt(value, d)}{unit ? ` ${unit}` : ""}</span>;
}
