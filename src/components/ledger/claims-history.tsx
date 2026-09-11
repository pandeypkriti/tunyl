import Link from "next/link";
import type { Claim, ClaimStatus } from "@/db/schema";
import { money, fmtDate } from "@/lib/units";

const STATUS: Record<ClaimStatus, { cls: string; text: string }> = {
  draft: { cls: "neutral", text: "Draft" },
  lodged: { cls: "check", text: "Lodged" },
  certified: { cls: "clear", text: "Certified" },
  paid: { cls: "clear", text: "Paid" },
};

export function ClaimsHistory({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return <p className="text-[14px] text-[color:var(--ink2)]">No claims lodged yet.</p>;
  }
  return (
    <div className="tbl">
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Period to</th>
            <th className="num">Total</th>
            <th>Status</th>
            <th>Lodged</th>
            <th>Builder&#39;s link</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => {
            const status = STATUS[c.status];
            return (
              <tr key={c.id}>
                <td><b>Claim {c.number}</b></td>
                <td>{fmtDate(c.periodEnd)}</td>
                <td className="num">{money(c.total)}</td>
                <td><span className={`chip ${status.cls}`}>{status.text}</span></td>
                <td>{c.lodgedAt ? fmtDate(c.lodgedAt) : "-"}</td>
                <td>
                  <Link href={`/c/${c.token}`} className="text-[13px] font-medium text-[color:var(--tint-ink)] underline-offset-2 hover:underline focus-visible:underline">
                    /c/{c.token}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
