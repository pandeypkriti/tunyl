"use client";
import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ask, type AskResult } from "@/app/actions/ask";
import { cn } from "@/lib/utils";

type Ctx = { open: () => void; close: () => void; isOpen: boolean; ask: (q: string) => void };
const AskContext = React.createContext<Ctx | null>(null);
export function useAsk(): Ctx {
  const c = React.useContext(AskContext);
  if (!c) throw new Error("useAsk needs AskProvider");
  return c;
}

const SUGGESTED: Array<{ group: string; items: string[] }> = [
  { group: "Ask", items: ["What is unclaimed on Kellyville Ridge?", "How much select fill was delivered on Kellyville Ridge?", "What are we owed?"] },
  { group: "Check", items: ["Which invoices have loads with no docket?", "What is waiting for a person?", "Where is docket 88212?"] },
  { group: "Draft", items: ["Draft claim 6", "Send claim 6 to Xero"] },
];

export function AskProvider({ name, children }: { name: string; children: React.ReactNode }) {
  const [isOpen, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [thread, setThread] = React.useState<Array<{ q: string; a: AskResult | null }>>([]);
  const [pending, start] = React.useTransition();
  const run = React.useCallback((question: string) => {
    const text = question.trim(); if (!text) return;
    setOpen(true); setQ("");
    setThread((t) => [...t, { q: text, a: null }]);
    start(async () => {
      let a: AskResult;
      try { a = await ask(text); } catch { a = { answer: "That question could not be answered right now. Try one of the suggestions." }; }
      setThread((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a } : x)));
    });
  }, []);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  const ctx = React.useMemo<Ctx>(() => ({ open: () => setOpen(true), close: () => setOpen(false), isOpen, ask: run }), [isOpen, run]);
  return (
    <AskContext.Provider value={ctx}>
      {children}
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]" showCloseButton={false}>
          <SheetHeader className="border-b border-[color:var(--border)] px-5 py-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-[16px] font-semibold"><Sparkles className="size-4 text-[color:var(--primary)]" aria-hidden />Ask Tunyl</SheetTitle>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-1 text-[color:var(--ink-3)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]"><X className="size-4" /></button>
            </div>
            <SheetDescription className="text-[13px] text-[color:var(--ink-3)]">Answers come from the ledger, the queue and the documents. Anything that moves money comes back as a draft.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {thread.length === 0 ? (
              <div>
                <p className="mb-4 text-[18px] font-semibold tracking-[-0.01em]">What do you want to know, {name}?</p>
                {SUGGESTED.map((g) => (
                  <div key={g.group} className="mb-4">
                    <div className="tag mb-1.5">{g.group}</div>
                    <ul className="hairline">
                      {g.items.map((s) => (
                        <li key={s}><button type="button" onClick={() => run(s)} className="flex w-full items-center justify-between gap-2 py-2 text-left text-[14px] text-[color:var(--ink-2)] hover:text-[color:var(--ink)]">{s}<ArrowRight className="size-3.5 flex-none text-[color:var(--ink-3)]" aria-hidden /></button></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="grid gap-4">
                {thread.map((t, i) => (
                  <li key={i} className="grid gap-2">
                    <div className="ml-8 rounded-lg bg-[color:var(--primary-soft)] px-3 py-2 text-[14px] text-[color:var(--primary-ink)]">{t.q}</div>
                    <div className={cn("mr-8 rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-[14px]", !t.a && "text-[color:var(--ink-3)]")} aria-live="polite">
                      {t.a ? (<>
                        <p>{t.a.answer}</p>
                        {t.a.href && <Link href={t.a.href} onClick={() => setOpen(false)} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[color:var(--primary)] hover:underline">Open<ArrowRight className="size-3.5" aria-hidden /></Link>}
                        {t.a.foot && <p className="mt-2 text-[12px] text-[color:var(--ink-3)]">{t.a.foot}</p>}
                      </>) : "Looking…"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="border-t border-[color:var(--border)] p-4">
            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--border-strong)] bg-white px-3 focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--primary-soft)]">
              <Sparkles className="size-4 flex-none text-[color:var(--primary)]" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about quantities, invoices, dockets or claims" aria-label="Ask Tunyl" className="h-11 w-full bg-transparent text-[14px] outline-none placeholder:text-[#98A2B3]" autoFocus />
              <button type="submit" disabled={pending || !q.trim()} className="rounded-md bg-[color:var(--primary)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[color:var(--primary-hover)] disabled:opacity-50">Ask</button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </AskContext.Provider>
  );
}

/** The hero input on the home page: same panel, opened with the typed question. */
export function AskHero({ name }: { name: string }) {
  const { ask } = useAsk();
  const [q, setQ] = React.useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); ask(q); setQ(""); }} className="flex items-center gap-3 rounded-xl border border-[color:var(--border-strong)] bg-white px-4 shadow-[var(--shadow)] focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--primary-soft)]">
      <Sparkles className="size-5 flex-none text-[color:var(--primary)]" aria-hidden />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`What do you want to know, ${name}?`} aria-label="Ask Tunyl" className="h-14 w-full bg-transparent text-[16px] outline-none placeholder:text-[#98A2B3]" />
      <kbd className="mono hidden rounded border border-[color:var(--border)] bg-[color:var(--surface-2)] px-1.5 py-0.5 text-[11px] text-[color:var(--ink-3)] sm:inline">⌘K</kbd>
    </form>
  );
}
