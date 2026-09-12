"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Stepper, type Step } from "@/components/app/stepper";
import { SubmitButton } from "./submit-button";
import type { Claim, ClaimStatus } from "@/db/schema";
import { fmt, money, fmtDate } from "@/lib/units";

const STEP_ORDER: ClaimStatus[] = ["draft", "lodged", "certified", "paid"];
const STEP_LABEL: Record<ClaimStatus, string> = { draft: "Draft", lodged: "Lodged", certified: "Certified", paid: "Paid" };

function claimSteps(status: ClaimStatus): Step[] {
  const idx = STEP_ORDER.indexOf(status);
  return STEP_ORDER.map((s, i) => ({ label: STEP_LABEL[s], state: i < idx ? "done" : i === idx ? "current" : "todo" }));
}

// The origin never changes once mounted, so there is nothing to subscribe to;
// this only exists to give the server render an empty snapshot and the
// client its real one without a useEffect + setState render cascade.
function subscribeNever() {
  return () => {};
}
function getOrigin() {
  return window.location.origin;
}
function getServerOrigin() {
  return "";
}

/**
 * The draft/lodged claim for this project. Lodging is a plain form bound to
 * the server action passed down from the page; the copy-to-clipboard button
 * is the only reason this is a client component.
 */
export function ClaimPanel({
  claim,
  lodgeAction,
}: {
  claim: Claim | null;
  lodgeAction: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(subscribeNever, getOrigin, getServerOrigin);

  if (!claim) return null;

  const lodged = claim.status !== "draft";
  const builderUrl = `${origin}/c/${claim.token}`;

  function onCopy() {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(builderUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <div className="card">
      <Stepper steps={claimSteps(claim.status)} />

      <h3 className="mt-4 text-[16px] font-semibold">Claim {claim.number}, period to {fmtDate(claim.periodEnd)}</h3>
      <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
        Quantities are matched and ticked dockets less what has already been claimed.
      </p>

      {claim.lines.length === 0 ? (
        <p className="mt-3 text-[14px] text-[color:var(--ink-2)]">Nothing verified is unclaimed right now.</p>
      ) : (
        <div className="tbl mt-3">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th className="num">Qty</th>
                <th>Unit</th>
                <th className="num">Rate</th>
                <th className="num">Amount</th>
              </tr>
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

      {!lodged && (
        <form action={lodgeAction} className="mt-4 flex justify-end">
          <SubmitButton pendingLabel="Lodging…" variant="secondary">Lodge claim</SubmitButton>
        </form>
      )}

      {lodged && (
        <div className="mt-4 border-t border-[color:var(--border)] pt-4">
          <p className="text-[13px] font-medium text-[color:var(--ink-2)]">Builder&#39;s link</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={builderUrl}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Builder claim link"
              className="mono h-9 min-w-0 flex-1 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-3 text-[13px] text-[color:var(--ink-2)] outline-none focus-visible:border-[color:var(--primary)] focus-visible:ring-2 focus-visible:ring-[color:var(--primary-soft)]"
            />
            <Button type="button" variant="secondary" size="sm" onClick={onCopy}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <p className="mt-3 text-[13px] text-[color:var(--ink-2)]">
            The Security of Payment clock started today: payment schedule due {fmtDate(claim.scheduleDue)}.
          </p>
          <Link
            href={`/claims/${claim.id}`}
            className="mt-2 inline-block text-[13px] font-medium text-[color:var(--primary-ink)] underline-offset-2 hover:underline focus-visible:underline"
          >
            View claim {claim.number} in claims
          </Link>
        </div>
      )}
    </div>
  );
}
