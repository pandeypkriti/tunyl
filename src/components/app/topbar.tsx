"use client";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAsk } from "./ask-panel";

export function Topbar({ name }: { name: string }) {
  const { open } = useAsk();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[color:var(--border)] bg-white px-4 min-[900px]:px-6">
      <Link href="/" className="flex items-baseline gap-2"><span className="text-[16px] font-semibold tracking-[-0.01em]">Tunyl</span><span className="hidden text-[13px] text-[color:var(--ink-3)] sm:inline">Docket to claim</span></Link>
      <div className="flex items-center gap-2">
        <button type="button" onClick={open} className="inline-flex h-9 items-center gap-2 rounded-md border border-[color:var(--border-strong)] bg-white px-3 text-[13px] text-[color:var(--ink-2)] transition-colors hover:bg-[color:var(--surface-2)] focus-visible:outline-2">
          <Sparkles className="size-4 text-[color:var(--primary)]" aria-hidden />
          <span className="hidden sm:inline">Ask Tunyl</span>
          <kbd className="mono hidden rounded border border-[color:var(--border)] bg-[color:var(--surface-2)] px-1.5 text-[11px] text-[color:var(--ink-3)] sm:inline">⌘K</kbd>
        </button>
        <span className="hidden text-[13px] text-[color:var(--ink-2)] min-[900px]:inline">{name}</span>
      </div>
    </header>
  );
}
