import Link from "next/link";
import { NavRail } from "./nav-rail";

export function OfficeShell({ children, queueCount }: { children: React.ReactNode; queueCount: number }) {
  return (
    <div className="mx-auto max-w-[1120px] px-5 pb-20 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <Link href="/" className="flex items-baseline gap-2.5"><b className="text-[18px] font-bold tracking-tight">Tunyl</b><span className="text-[15px] text-[color:var(--ink2)]">Docket to claim</span></Link>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="chip neutral">Office</span>
        </div>
      </header>
      <div className="grid overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white shadow-[var(--shadow)] md:grid-cols-[212px_minmax(0,1fr)]">
        <NavRail queueCount={queueCount} />
        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
