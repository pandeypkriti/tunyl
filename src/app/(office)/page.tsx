import Link from "next/link";
import { officeName } from "@/lib/auth";
import { AskHero } from "@/components/app/ask-panel";
import { KpiCard } from "@/components/app/kpi-card";
import { StatusChip, recordChip } from "@/components/app/status-chip";
import { ActivityFeed } from "@/components/app/activity-feed";
import { Section } from "@/components/app/page-header";
import { Money } from "@/components/app/money";
import { fmt, money } from "@/lib/units";
import { homeKpis, needsAPerson, recentActivity, claimsWaitingOnMoney, homeProjectRows } from "./board";

export const metadata = { title: "Home" };

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function metaLine(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${hh}:${mm}`;
}
function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const now = new Date();
  const [name, kpis, needsPerson, activity, claimsRows, projectRows] = await Promise.all([
    officeName(),
    homeKpis(),
    needsAPerson(6),
    recentActivity(8),
    claimsWaitingOnMoney(),
    homeProjectRows(),
  ]);
  const first = name.split(" ")[0];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[color:var(--ink-3)]">{metaLine(now)}</p>
        <div className="flex items-center gap-1.5 text-[12px] text-[color:var(--ink-3)]">
          <span aria-hidden className="size-1.5 rounded-full bg-[color:var(--success)]" />
          {kpis.waiting} waiting for a person
        </div>
      </div>

      <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.02em]">
        {greeting(now.getHours())}, {first}
      </h1>

      <div className="mt-5">
        <AskHero name={first} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Dockets in this week"
          value={fmt(kpis.dockets.total)}
          sub={`${kpis.dockets.byRule} matched by rule, ${kpis.dockets.forPerson} for a person`}
        />
        <KpiCard label="Waiting on a person" value={fmt(kpis.waiting)} tone="warn" href="/queue" />
        <KpiCard
          label="Ready to claim"
          value={money(kpis.readyToClaim.total)}
          tone="ok"
          sub={`${kpis.readyToClaim.projectCount} project${kpis.readyToClaim.projectCount === 1 ? "" : "s"} with verified quantities`}
        />
        <KpiCard
          label="Held from ApprovalMax"
          value={`${kpis.held.count} ${kpis.held.count === 1 ? "invoice" : "invoices"}`}
          tone="hold"
          sub={kpis.held.sub}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
        <Section
          title="Needs a person"
          aside={
            <Link href="/queue" className="font-medium text-[color:var(--primary)] hover:underline focus-visible:underline">
              View all
            </Link>
          }
        >
          {needsPerson.length === 0 ? (
            <p className="text-[13px] text-[color:var(--ink-3)]">Nothing needs a person right now.</p>
          ) : (
            <ul className="hairline">
              {needsPerson.map((r) => {
                const chip = recordChip(r.status);
                return (
                  <li key={r.id}>
                    <Link
                      href={`/queue/${r.id}`}
                      className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[color:var(--surface-2)] focus-visible:bg-[color:var(--surface-2)] focus-visible:outline-none"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium">{r.title}</div>
                        <div className="truncate text-[12px] text-[color:var(--ink-3)]">
                          {r.supplier}
                          {r.supplier && r.projectName ? " · " : ""}
                          {r.projectName}
                        </div>
                        <div className="mt-1 text-[12px] text-[color:var(--ink-3)]">{r.why}</div>
                      </div>
                      <StatusChip tone={chip.tone} className="flex-none">{chip.label}</StatusChip>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <div>
          <ActivityFeed items={activity.items} heading={activity.heading} empty="Nothing has happened yet." />
        </div>
      </div>

      <Section title="Claims waiting on money">
        {claimsRows.length === 0 ? (
          <p className="text-[13px] text-[color:var(--ink-3)]">No claims are lodged and waiting on money right now.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[color:var(--border)] bg-white">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Claim</th>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Builder</th>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-right text-[12px] font-medium text-[color:var(--ink-3)]">Amount</th>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Payment schedule</th>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Status</th>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {claimsRows.map((c) => (
                  <tr key={c.id} className="border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:var(--surface-2)]">
                    <td className="px-3 py-2.5">
                      <Link href={`/claims/${c.id}`} className="font-medium text-[color:var(--ink)] hover:underline focus-visible:underline">
                        Claim {c.number}
                      </Link>
                      <div className="text-[12px] text-[color:var(--ink-3)]">{c.projectName}</div>
                    </td>
                    <td className="px-3 py-2.5">{c.client}</td>
                    <td className="px-3 py-2.5 text-right"><Money value={c.total} tone="positive" /></td>
                    <td className="px-3 py-2.5">{c.scheduleText}</td>
                    <td className="px-3 py-2.5"><StatusChip tone={c.chip.tone}>{c.chip.label}</StatusChip></td>
                    <td className="px-3 py-2.5 text-right">
                      {c.mailto && (
                        <a href={c.mailto} className="font-medium text-[color:var(--primary)] hover:underline focus-visible:underline">
                          Draft chaser
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Projects">
        {projectRows.length === 0 ? (
          <p className="text-[13px] text-[color:var(--ink-3)]">No projects are set up yet.</p>
        ) : (
          <ul className="hairline">
            {projectRows.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-[color:var(--surface-2)] focus-visible:bg-[color:var(--surface-2)] focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">{p.name}</div>
                    <div className="truncate text-[12px] text-[color:var(--ink-3)]">{p.client}</div>
                  </div>
                  {p.bar ? (
                    <>
                      <div className="hidden w-[160px] flex-none sm:block">
                        <div className="bar" aria-hidden="true"><i style={{ width: `${p.bar.pct}%` }} /></div>
                      </div>
                      <span className="mono w-10 flex-none text-right text-[13px] tabular-nums">{p.bar.pct}%</span>
                    </>
                  ) : (
                    <span className="flex-none text-[12px] text-[color:var(--ink-3)]">No materials</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
