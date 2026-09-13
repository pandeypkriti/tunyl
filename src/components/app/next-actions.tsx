import Link from "next/link";
import { Inbox, Send, Mail, FileQuestion, Banknote, Receipt, Sparkles } from "lucide-react";
import type { NextAction } from "@/lib/next-actions";

const icons = { continue: Inbox, lodge: Send, chase: Mail, paper: FileQuestion, payment: Banknote, claim: Receipt, ask: Sparkles };

/** Sahova-style rows: what you will probably do next, from what you did last and what is unfinished. */
export function NextActionsList({ items, heading }: { items: NextAction[]; heading?: string }) {
  if (!items.length) return null;
  return (
    <div>
      {heading && <div className="tag mb-1">{heading}</div>}
      <ul className="hairline">
        {items.map((it) => {
          const Icon = icons[it.kind];
          return (
            <li key={it.id}>
              <Link href={it.href ?? "/"} className="flex items-center gap-3 py-3 text-[15px] transition-colors hover:text-[color:var(--primary-ink)] focus-visible:outline-2">
                <Icon className="size-4 flex-none text-[color:var(--ink-3)]" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                <span className="flex-none text-[13px] text-[color:var(--ink-3)]">{it.meta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
