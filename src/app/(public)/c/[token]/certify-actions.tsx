"use client";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Claim } from "@/db/schema";
import { fmtDate } from "@/lib/units";
import { certifyClaim } from "./actions";

/** Certifying is the one write this no-login page can make. The action itself
 * is unchanged; this file only restyles what it renders. */
export function CertifyActions({ claim, mailto }: { claim: Claim; mailto: string }) {
  const [current, setCurrent] = useState(claim);
  const [pending, startTransition] = useTransition();

  function onCertify() {
    startTransition(async () => {
      const updated = await certifyClaim(current.id, current.token);
      setCurrent(updated);
    });
  }

  const certified = current.status === "certified" || current.status === "paid";

  return (
    <div className="mt-5">
      {certified && (
        <p className="mb-3 rounded-lg bg-[color:var(--success-soft)] px-4 py-3 text-[14px] font-medium text-[color:var(--success-ink)]">
          Certified on {fmtDate(current.scheduleReceived)}. Payment due {fmtDate(current.paymentDue)}.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {current.status === "lodged" && (
          <Button
            type="button"
            onClick={onCertify}
            disabled={pending}
            className="bg-[color:var(--success)] text-white hover:bg-[color:var(--success)]/90 disabled:opacity-50"
          >
            {pending ? "Certifying…" : "Certify"}
          </Button>
        )}
        <a href={mailto} className={cn(buttonVariants({ variant: "secondary" }))}>Query a line</a>
      </div>
    </div>
  );
}
