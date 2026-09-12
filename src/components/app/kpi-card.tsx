import { cn } from "@/lib/utils";
import Link from "next/link";

export type KpiTone = "primary" | "ok" | "warn" | "hold" | "muted";
const line: Record<KpiTone, string> = { primary: "bg-[color:var(--primary)]", ok: "bg-[color:var(--success)]", warn: "bg-[color:var(--warn)]", hold: "bg-[color:var(--danger)]", muted: "bg-[color:var(--ink-3)]" };

/** A figure with a coloured underline. Only the figure is big; the meaning sits in the sub line. */
export function KpiCard({ label, value, sub, tone = "primary", href, className }: { label: string; value: string; sub?: string; tone?: KpiTone; href?: string; className?: string }) {
  const body = (
    <>
      <div className="text-[13px] font-medium text-[color:var(--ink-2)]">{label}</div>
      <div className={cn("mt-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em]", tone === "hold" && "text-[color:var(--danger-ink)]")}>{value}</div>
      {sub && <div className="mt-2 text-[12px] text-[color:var(--ink-3)]">{sub}</div>}
      <span aria-hidden className={cn("absolute inset-x-5 bottom-0 h-[3px] rounded-t", line[tone])} />
    </>
  );
  const cls = cn("relative block overflow-hidden rounded-xl border border-[color:var(--border)] bg-white p-5 shadow-[var(--shadow)]", href && "transition-colors hover:bg-[color:var(--surface-2)]", className);
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}
