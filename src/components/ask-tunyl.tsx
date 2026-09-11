"use client";
// Header widget mounted in office-shell.tsx. Answers come from the database
// first (see src/app/actions/ask.ts); the panel only ever shows what that
// action returns.
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ask } from "@/app/actions/ask";

type AskResult = { answer: string; href?: string; foot?: string };

const EXAMPLES = [
  "What is unclaimed on Kellyville Ridge?",
  "Which invoices have loads with no docket?",
  "Where is docket 88212?",
  "What are we owed?",
];

export function AskTunyl() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [pending, startTransition] = useTransition();

  function run(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setOpen(true);
    startTransition(async () => {
      const r = await ask(trimmed);
      setResult(r);
    });
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Ask Tunyl
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[min(92vw,380px)] rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-[var(--shadow)]">
          <form
            onSubmit={(e) => { e.preventDefault(); run(question); }}
            className="flex gap-2"
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about quantities, invoices, dockets or claims"
              aria-label="Ask Tunyl a question"
              disabled={pending}
            />
            <Button type="submit" disabled={pending || !question.trim()}>
              {pending ? "Asking" : "Ask"}
            </Button>
          </form>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                disabled={pending}
                onClick={() => run(ex)}
                className="chip neutral cursor-pointer transition-colors hover:bg-[color:var(--tint)] hover:text-[color:var(--tint-ink)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>

          {result && (
            <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--row-alt)] p-3" aria-live="polite">
              <p className="text-[14px] text-[color:var(--ink)]">{result.answer}</p>
              {result.href && (
                <Link
                  href={result.href}
                  onClick={() => setOpen(false)}
                  className="mt-1.5 inline-block text-[13px] font-semibold text-[color:var(--tint-ink)] underline-offset-2 hover:underline focus-visible:underline"
                >
                  Open
                </Link>
              )}
              {result.foot && <p className="mt-1.5 text-[12px] text-[color:var(--ink2)]">{result.foot}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
