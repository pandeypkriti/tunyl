"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const groups: Array<{ label: string; items: Array<{ href: string; label: string; badge?: "queue" }> }> = [
  { label: "The flow", items: [
    { href: "/queue", label: "Review queue", badge: "queue" },
    { href: "/projects", label: "Ledger and claims" },
    { href: "/", label: "Board view" },
  ]},
  { label: "Records", items: [{ href: "/documents", label: "Documents" }] },
  { label: "Later modules", items: [{ href: "/formats", label: "Builder formats" }, { href: "/waiting", label: "Waiting on" }] },
];

export function NavRail({ queueCount }: { queueCount: number }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav aria-label="Sections" className="flex gap-1.5 overflow-x-auto border-b border-[color:var(--border)] bg-[color:var(--row-alt)] p-2.5 md:flex-col md:border-b-0 md:border-r md:p-3">
      {groups.map((g) => (
        <div key={g.label} className="contents md:block">
          <div className="hidden px-3 pb-1 pt-3 text-[12px] font-medium text-[color:var(--ink2)] first:pt-1 md:block">{g.label}</div>
          {g.items.map((it) => (
            <Link key={it.href} href={it.href} aria-current={active(it.href) ? "page" : undefined}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl border px-3 py-2.5 text-[14px] transition-colors md:w-full ${active(it.href) ? "border-[color:var(--border)] bg-white font-semibold text-[color:var(--ink)] shadow-[var(--shadow)]" : "border-transparent font-medium text-[color:var(--ink2)] hover:bg-white"}`}>
              {it.label}
              {it.badge === "queue" && queueCount > 0 && <span className="ml-auto rounded-xl bg-[color:var(--tint)] px-2 text-[12px] font-semibold text-[color:var(--tint-ink)]">{queueCount}</span>}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
