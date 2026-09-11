"use client";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Claim } from "@/db/schema";
import { fmtDate } from "@/lib/units";
import { certifyClaim } from "./actions";

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
        <p className="mb-3 rounded-[12px] bg-[color:var(--ok-bg)] px-4 py-3 text-[14px] font-medium text-[color:var(--ok-ink)]">
          Certified. Payment due {fmtDate(current.paymentDue)}.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {current.status === "lodged" && (
          <Button type="button" onClick={onCertify} disabled={pending}>
            {pending ? "Certifying…" : "Certify"}
          </Button>
        )}
        <a href={mailto} className={buttonVariants({ variant: "secondary" })}>Query a line</a>
      </div>
    </div>
  );
}
