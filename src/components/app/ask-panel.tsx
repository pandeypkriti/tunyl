"use client";
import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X, ArrowUp, RotateCcw } from "lucide-react";
import { ask, type AskResult } from "@/app/actions/ask";
import type { BriefItem, NextAction } from "@/lib/next-actions";
import { NextActionsList } from "./next-actions";
import { cn } from "@/lib/utils";

export type RecentRow = { id: string; who: string; did: string; subject: string; when: string; href: string };
type Ctx = { open: () => void; close: () => void; isOpen: boolean; ask: (q: string) => void };
const AskContext = React.createContext<Ctx | null>(null);
export function useAsk(): Ctx {
  const c = React.useContext(AskContext);
  if (!c) throw new Error("useAsk needs AskProvider");
  return c;
}

const SUGGESTED = ["What is waiting for a person?", "Which invoices have loads with no docket?", "What are we owed?", "What is unclaimed on Kellyville Ridge?", "How much select fill was delivered?", "Where is docket 88212?", "Draft claim 6"];
const toneDot: Record<BriefItem["tone"], string> = { warn: "bg-[color:var(--warn)]", danger: "bg-[color:var(--danger)]", success: "bg-[color:var(--success)]", info: "bg-[color:var(--info)]" };

export function AskProvider({ name, brief = [], next = [], recent = [], children }: { name: string; brief?: BriefItem[]; next?: NextAction[]; recent?: RecentRow[]; children: React.ReactNode }) {
  const [isOpen, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [thread, setThread] = React.useState<Array<{ q: string; a: AskResult | null }>>([]);
  const [pending, start] = React.useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);
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
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  React.useEffect(() => { if (isOpen) { document.body.style.overflow = "hidden"; const t = setTimeout(() => inputRef.current?.focus(), 50); return () => { document.body.style.overflow = ""; clearTimeout(t); }; } }, [isOpen]);
  const ctx = React.useMemo<Ctx>(() => ({ open: () => setOpen(true), close: () => setOpen(false), isOpen, ask: run }), [isOpen, run]);
  const inThread = thread.length > 0;

  const inputBar = (
    <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="flex items-center gap-3 rounded-2xl border border-[color:var(--border-strong)] bg-white px-4 shadow-[var(--shadow-lg)] focus-within:border-[color:var(--primary)] focus-within:ring-4 focus-within:ring-[color:var(--primary-soft)]">
      <Sparkles className="size-5 flex-none text-[color:var(--primary)]" aria-hidden />
      <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={inThread ? "Ask a follow-up" : "Ask about quantities, invoices, dockets or claims"} aria-label="Ask Tunyl" className="h-16 w-full bg-transparent text-[18px] outline-none focus-visible:outline-none placeholder:text-[#98A2B3]" />
      <button type="submit" disabled={pending || !q.trim()} aria-label="Ask" className="flex size-10 flex-none items-center justify-center rounded-xl bg-[color:var(--primary)] text-white transition-colors hover:bg-[color:var(--primary-hover)] disabled:opacity-40"><ArrowUp className="size-5" /></button>
    </form>
  );

  return (
    <AskContext.Provider value={ctx}>
      {children}
      {isOpen && (
        <div role="dialog" aria-modal="true" aria-label="Ask Tunyl" className="fixed inset-0 z-50 overflow-y-auto bg-[color:var(--bg)]" style={{ animation: "rise .2s ease-out both" }}>
          <div className="sticky top-0 z-10 flex h-14 items-center justify-between bg-[color:var(--bg)]/95 px-4 backdrop-blur md:px-8">
            <div className="flex items-baseline gap-2"><span className="text-[16px] font-semibold tracking-[-0.01em]">Tunyl</span><span className="text-[13px] text-[color:var(--ink-3)]">Ask</span></div>
            <div className="flex items-center gap-2">
              {inThread && <button type="button" onClick={() => setThread([])} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] text-[color:var(--ink-2)] hover:bg-white"><RotateCcw className="size-3.5" aria-hidden />New question</button>}
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9 items-center gap-2 rounded-md border border-[color:var(--border)] bg-white px-3 text-[13px] text-[color:var(--ink-2)] hover:bg-[color:var(--surface-2)]" aria-label="Close"><X className="size-4" /><kbd className="mono text-[11px] text-[color:var(--ink-3)]">Esc</kbd></button>
            </div>
          </div>

          {!inThread ? (
            <div className="mx-auto max-w-[880px] px-4 pb-24 pt-10 md:px-8 md:pt-16">
              <p className="tag mb-3">Ask Tunyl</p>
              <h1 className="text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">What do you want to know, {name}?</h1>
              <p className="mt-2 max-w-[60ch] text-[15px] text-[color:var(--ink-2)]">Answers come from the ledger, the queue and the documents. Anything that moves money comes back as a draft.</p>
              <div className="mt-6">{inputBar}</div>

              {brief.length > 0 && (
                <div className="mt-10">
                  <div className="tag mb-2">Right now</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {brief.map((b) => (
                      <button key={b.id} type="button" onClick={() => run(b.question)} className="group flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-white p-4 text-left shadow-[var(--shadow)] transition-colors hover:border-[color:var(--primary)] focus-visible:outline-2">
                        <span aria-hidden className={cn("mt-1.5 size-2 flex-none rounded-full", toneDot[b.tone])} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold">{b.title}</span>
                          <span className="mt-0.5 block text-[13px] text-[color:var(--ink-2)]">{b.detail}</span>
                          <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[color:var(--primary)]">{b.question}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10 grid gap-10 md:grid-cols-2">
                <NextActionsList items={next} heading="You will probably do next" />
                {recent.length > 0 && (
                  <div>
                    <div className="tag mb-1">What you did last</div>
                    <ul className="hairline">
                      {recent.map((r) => (
                        <li key={r.id}>
                          <Link href={r.href || "/"} className="flex items-center gap-3 py-3 text-[14px] hover:text-[color:var(--primary-ink)]">
                            <span className="min-w-0 flex-1 truncate"><b className="font-semibold">{r.who}</b> {r.did} {r.subject}</span>
                            <span className="flex-none text-[12px] text-[color:var(--ink-3)]">{r.when}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-10">
                <div className="tag mb-2">Try asking</div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED.map((s) => <button key={s} type="button" onClick={() => run(s)} className="rounded-full border border-[color:var(--border)] bg-white px-3.5 py-1.5 text-[13px] text-[color:var(--ink-2)] transition-colors hover:border-[color:var(--primary)] hover:text-[color:var(--primary-ink)] focus-visible:outline-2">{s}</button>)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-[880px] flex-col px-4 md:px-8">
              <ul className="flex-1 space-y-6 py-8">
                {thread.map((t, i) => (
                  <li key={i} className="grid gap-3">
                    <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[color:var(--primary-soft)] px-4 py-2.5 text-[15px] text-[color:var(--primary-ink)]">{t.q}</div>
                    <div className={cn("mr-auto max-w-[85%] rounded-2xl rounded-bl-md border border-[color:var(--border)] bg-white px-4 py-3 text-[15px] shadow-[var(--shadow)]", !t.a && "text-[color:var(--ink-3)]")} aria-live="polite">
                      {t.a ? (<>
                        <p>{t.a.answer}</p>
                        {t.a.href && <Link href={t.a.href} onClick={() => setOpen(false)} className="mt-2 inline-flex items-center gap-1 text-[14px] font-medium text-[color:var(--primary)] hover:underline">Open<ArrowRight className="size-4" aria-hidden /></Link>}
                        {t.a.foot && <p className="mt-2 text-[12px] text-[color:var(--ink-3)]">{t.a.foot}</p>}
                      </>) : "Looking…"}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="sticky bottom-0 bg-[color:var(--bg)] pb-6 pt-2">{inputBar}</div>
            </div>
          )}
        </div>
      )}
    </AskContext.Provider>
  );
}

/** The hero input on the home page: same cover, opened with the typed question. */
export function AskHero({ name }: { name: string }) {
  const { ask, open } = useAsk();
  const [q, setQ] = React.useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { ask(q); setQ(""); } else open(); }} className="flex items-center gap-3 rounded-2xl border border-[color:var(--border-strong)] bg-white px-4 shadow-[var(--shadow)] focus-within:border-[color:var(--primary)] focus-within:ring-4 focus-within:ring-[color:var(--primary-soft)]">
      <Sparkles className="size-5 flex-none text-[color:var(--primary)]" aria-hidden />
      <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => { if (!q) open(); }} placeholder={`What do you want to know, ${name}?`} aria-label="Ask Tunyl" className="h-14 w-full bg-transparent text-[16px] outline-none focus-visible:outline-none placeholder:text-[#98A2B3]" />
      <kbd className="mono hidden rounded border border-[color:var(--border)] bg-[color:var(--surface-2)] px-1.5 py-0.5 text-[11px] text-[color:var(--ink-3)] sm:inline">⌘K</kbd>
    </form>
  );
}
