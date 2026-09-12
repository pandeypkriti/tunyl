"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markPaidAction } from "@/app/(office)/claims/[id]/actions";

/** Open the builder's link, copy it, mark the claim paid, or draft a chaser. */
export function ClaimHeaderActions({
  claimId,
  token,
  status,
  mailto,
}: {
  claimId: string;
  token: string;
  status: string;
  mailto: string | null;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [fellBack, setFellBack] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  async function onCopy() {
    const url = `${window.location.origin}/c/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFellBack(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFellBack(true);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }

  function onMarkPaid() {
    startTransition(async () => {
      await markPaidAction(claimId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`/c/${token}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[color:var(--border-strong)] bg-white px-2.5 text-[13px] text-[color:var(--ink-2)] transition-colors hover:bg-[color:var(--surface-2)] focus-visible:outline-2 focus-visible:outline-[color:var(--primary)]"
      >
        <ExternalLink className="size-3.5" aria-hidden />
        Open builder link
      </a>
      <Button type="button" variant="outline" size="sm" onClick={onCopy}>
        {copied ? <Check className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      {fellBack && (
        <input
          ref={inputRef}
          readOnly
          value={`${typeof window !== "undefined" ? window.location.origin : ""}/c/${token}`}
          aria-label="Builder link"
          onFocus={(e) => e.currentTarget.select()}
          className="h-8 w-[220px] rounded-md border border-[color:var(--border-strong)] bg-white px-2 text-[12px] text-[color:var(--ink-2)] outline-none focus-visible:border-[color:var(--primary)]"
        />
      )}
      {status === "certified" && (
        <Button type="button" onClick={onMarkPaid} disabled={pending}>
          {pending ? "Marking paid…" : "Mark paid"}
        </Button>
      )}
      {mailto && (
        <a
          href={mailto}
          className="inline-flex h-8 items-center rounded-md border border-transparent bg-[color:var(--danger-soft)] px-2.5 text-[13px] font-medium text-[color:var(--danger-ink)] transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[color:var(--danger)]"
        >
          Draft chaser
        </a>
      )}
    </div>
  );
}
