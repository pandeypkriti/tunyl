import { Camera, FileText, Check, Receipt, Mail, Truck, Undo2, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedItem = { id: string; who: string; did: string; what: string; tag?: string; when: string; kind: "photo" | "file" | "tick" | "invoice" | "email" | "feed" | "back" | "held"; href?: string; fresh?: boolean };
const icons = { photo: Camera, file: FileText, tick: Check, invoice: Receipt, email: Mail, feed: Truck, back: Undo2, held: PauseCircle };
const tint = { photo: "bg-[color:var(--info-soft)] text-[color:var(--info-ink)]", file: "bg-[color:var(--surface-2)] text-[color:var(--ink-2)]", tick: "bg-[color:var(--success-soft)] text-[color:var(--success-ink)]", invoice: "bg-[color:var(--surface-2)] text-[color:var(--ink-2)]", email: "bg-[color:var(--surface-2)] text-[color:var(--ink-2)]", feed: "bg-[color:var(--primary-soft)] text-[color:var(--primary-ink)]", back: "bg-[color:var(--warn-soft)] text-[color:var(--warn-ink)]", held: "bg-[color:var(--danger-soft)] text-[color:var(--danger-ink)]" };

/** Sahova-style feed: icon tile, "Who did what", a sub line with a mono project tag, time on the right. */
export function ActivityFeed({ items, heading = "Today", empty = "Nothing has happened yet today." }: { items: FeedItem[]; heading?: string; empty?: string }) {
  return (
    <div>
      <div className="tag mb-2">{heading}</div>
      {items.length === 0 ? <p className="text-[13px] text-[color:var(--ink-3)]">{empty}</p> : (
        <ul className="hairline">
          {items.map((it) => {
            const Icon = icons[it.kind];
            const row = (
              <div className={cn("flex items-center gap-3 py-2.5", it.fresh && "rounded-lg bg-[color:var(--surface-2)] px-2 -mx-2")}>
                <span className={cn("flex size-9 flex-none items-center justify-center rounded-lg", tint[it.kind])}><Icon className="size-4" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px]"><b className="font-semibold">{it.who}</b> {it.did}</div>
                  <div className="truncate text-[12px] text-[color:var(--ink-3)]">{it.what}{it.tag && <> <span aria-hidden>·</span> <span className="tag">{it.tag}</span></>}</div>
                </div>
                <div className={cn("flex-none text-[12px]", it.fresh ? "font-medium text-[color:var(--success-ink)]" : "text-[color:var(--ink-3)]")}>{it.when}</div>
              </div>
            );
            return <li key={it.id}>{it.href ? <a href={it.href} className="block rounded-lg hover:bg-[color:var(--surface-2)]">{row}</a> : row}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
