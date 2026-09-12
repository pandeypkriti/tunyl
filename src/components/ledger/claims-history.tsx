import Link from "next/link";
import type { Claim } from "@/db/schema";
import { StatusChip, claimChip } from "@/components/app/status-chip";
import { money, fmtDate } from "@/lib/units";

/** A hairline list of past claims, newest first, each opening the office claim page. */
export function ClaimsHistory({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return (
      <div className="rounded-lg border border-[color:var(--border)] bg-white px-4 py-6 text-[13px] text-[color:var(--ink-3)]">
        No claims lodged yet.
      </div>
    );
  }
  return (
    <div className="hairline overflow-hidden rounded-lg border border-[color:var(--border)] bg-white">
      {claims.map((c) => {
        const chip = claimChip(c.status);
        return (
          <Link
            key={c.id}
            href={`/claims/${c.id}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-[13px] transition-colors hover:bg-[color:var(--surface-2)] focus-visible:bg-[color:var(--surface-2)] focus-visible:outline-none"
          >
            <span className="font-medium text-[color:var(--ink)]">Claim {c.number}</span>
            <span className="text-[color:var(--ink-3)]">Period to {fmtDate(c.periodEnd)}</span>
            <span className="ml-auto font-medium tabular-nums">{money(c.total)}</span>
            <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
          </Link>
        );
      })}
    </div>
  );
}
