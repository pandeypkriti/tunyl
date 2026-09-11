"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Claim } from "@/db/schema";
import { fmt, money, fmtDate } from "@/lib/units";
import { draftClaimAction, lodgeClaimAction } from "@/app/(office)/projects/[slug]/actions";

export function ClaimPanel({
  projectId,
  slug,
  initialDraft,
}: {
  projectId: string;
  slug: string;
  initialDraft: Claim | null;
}) {
  const [claim, setClaim] = useState<Claim | null>(initialDraft);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDraft() {
    startTransition(async () => {
      const c = await draftClaimAction(projectId, slug);
      setClaim(c);
      setCopied(false);
    });
  }

  function onLodge() {
    if (!claim) return;
    startTransition(async () => {
      const c = await lodgeClaimAction(claim.id, slug);
      setClaim(c);
    });
  }

  function onCopy() {
    if (!claim) return;
    const url = `${window.location.origin}/c/${claim.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onDraft} disabled={pending}>
          {pending && !claim ? "Working…" : "Draft progress claim"}
        </Button>
        {claim && claim.status === "draft" && (
          <Button type="button" variant="secondary" onClick={onLodge} disabled={pending}>
            {pending ? "Working…" : "Lodge claim"}
          </Button>
        )}
        <a href={`/api/export/dockets?project=${slug}`} className={buttonVariants({ variant: "outline" })}>Download dockets (CSV)</a>
        <a href={`/api/export/xero?project=${slug}`} className={buttonVariants({ variant: "outline" })}>Download Xero bills (CSV)</a>
      </div>

      {claim && (
        <div className="card mt-4">
          <h3 className="text-[16px] font-semibold">Claim {claim.number}, period to {fmtDate(claim.periodEnd)}</h3>
          <p className="mt-1 text-[13px] text-[color:var(--ink2)]">Quantities are matched and ticked dockets less what has already been claimed.</p>

          {claim.lines.length === 0 ? (
            <p className="mt-3 text-[14px] text-[color:var(--ink2)]">Nothing verified is unclaimed right now.</p>
          ) : (
            <div className="tbl mt-3">
              <table>
                <thead>
                  <tr><th>Material</th><th className="num">Qty</th><th>Unit</th><th className="num">Rate</th><th className="num">Amount</th></tr>
                </thead>
                <tbody>
                  {claim.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.material}</td>
                      <td className="num">{fmt(l.qty, 2)}</td>
                      <td>{l.unit}</td>
                      <td className="num">{money(l.rate)}</td>
                      <td className="num">{money(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-right text-[15px] font-semibold">Total ex GST {money(claim.total)}</p>

          {claim.status !== "draft" && (
            <div className="mt-4 border-t border-[color:var(--border)] pt-4">
              <p className="text-[14px]">
                Builder&#39;s link:{" "}
                <Link href={`/c/${claim.token}`} className="font-medium text-[color:var(--tint-ink)] underline-offset-2 hover:underline focus-visible:underline">
                  /c/{claim.token}
                </Link>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" size="sm" onClick={onCopy}>{copied ? "Copied" : "Copy link"}</Button>
                <span className="text-[13px] text-[color:var(--ink2)]">
                  The Security of Payment clock started today: payment schedule due {fmtDate(claim.scheduleDue)}.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
