"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Inbox, FolderKanban, Receipt, FileText, FileOutput, Clock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const groups: Array<{ label: string; items: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: "queue" }> }> = [
  { label: "Work", items: [
    { href: "/", label: "Home", icon: Home },
    { href: "/queue", label: "Review queue", icon: Inbox, badge: "queue" },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/claims", label: "Claims", icon: Receipt },
    { href: "/documents", label: "Documents", icon: FileText },
  ]},
  { label: "Later modules", items: [
    { href: "/formats", label: "Builder formats", icon: FileOutput },
    { href: "/waiting", label: "Waiting on", icon: Clock },
  ]},
];

export function Sidebar({ queueCount, name }: { queueCount: number; name: string }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <nav aria-label="Sections" className="flex gap-1 overflow-x-auto border-b border-[color:var(--border)] bg-white px-3 py-2 md:sticky md:top-14 md:h-[calc(100vh-56px)] md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:px-3 md:py-4">
      {groups.map((g) => (
        <div key={g.label} className="contents md:mb-4 md:block">
          <div className="tag hidden px-3 pb-1.5 md:block">{g.label}</div>
          {g.items.map((it) => {
            const on = active(it.href);
            return (
              <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
                className={cn("flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-[14px] transition-colors md:w-full", on ? "bg-[color:var(--primary-soft)] font-medium text-[color:var(--primary-ink)]" : "text-[color:var(--ink-2)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]")}>
                <it.icon className={cn("size-4 flex-none", on ? "text-[color:var(--primary)]" : "text-[color:var(--ink-3)]")} aria-hidden />
                {it.label}
                {it.badge === "queue" && queueCount > 0 && <span className="ml-auto rounded-full bg-[color:var(--warn-soft)] px-2 text-[12px] font-medium text-[color:var(--warn-ink)]">{queueCount}</span>}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="hidden md:mt-auto md:block">
        <div className="tag px-3 pb-1.5">Signed in</div>
        <div className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[color:var(--ink-2)]"><span className="flex size-6 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[11px] font-semibold text-[color:var(--primary-ink)]">{name.slice(0, 1).toUpperCase()}</span><span className="truncate">{name}</span></div>
        <a href="/logout" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-[color:var(--ink-3)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]"><LogOut className="size-4" aria-hidden />Sign out</a>
      </div>
    </nav>
  );
}
