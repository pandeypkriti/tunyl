import { db } from "@/db";
import { waits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { businessDaysBetween, fmt, todayIso } from "@/lib/units";
import { officeName } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { WaitsTable, type WaitRow } from "./waits-table";

export const metadata = { title: "Waiting on" };

function chaserMailto(w: { what: string; fromParty: string; job: string; jobNo: string; askedOn: string; kpiDays: number }, day: number, signoff: string): string {
  const late = day > w.kpiDays;
  const subject = `${w.what}, ${w.job}, requested ${w.askedOn}`;
  let body: string;
  if (w.fromParty === "Client") {
    body = `Hi,\n\nA reminder that your ${w.what.toLowerCase()} for ${w.job} (job ${w.jobNo}) are still outstanding. We asked on ${w.askedOn} and we cannot release the job to construction until they are in.\n\nReply with a day that suits and we will book it in.\n\nThanks,\n${signoff}`;
  } else {
    body = `Hi,\n\nFollowing up on the ${w.what.toLowerCase()} for ${w.job} (job ${w.jobNo}), requested on ${w.askedOn}. Our programme allows ${w.kpiDays} days for this and we are at day ${day}${late ? ", so it is now holding the job" : ""}. Could you let me know where it is up to and when we can expect it?\n\nThanks,\n${signoff}`;
  }
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default async function WaitingPage() {
  const today = todayIso();
  const signoff = `${await officeName()}, client project coordinator`;
  const open = await db.select().from(waits).where(eq(waits.done, false));

  const rows: WaitRow[] = open.map((w) => {
    const day = businessDaysBetween(w.askedOn, today);
    return { ...w, day, chaserHref: chaserMailto(w, day, signoff) };
  });

  const overdue = rows.filter((r) => r.day > r.kpiDays).length;
  const dueToday = rows.filter((r) => r.day === r.kpiDays).length;
  const onTrack = rows.filter((r) => r.day < r.kpiDays).length;

  return (
    <div>
      <PageHeader
        title="Waiting on"
        description={
          <>
            Every external approval with its KPI clock running. The chaser is written before anyone needs it.
            <span className="mt-1 block text-[12px] text-[color:var(--ink-3)]">Builder-side module: built only when a customer asks for it.</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Overdue" value={fmt(overdue)} tone="hold" sub={overdue === 1 ? "1 approval past its KPI" : `${overdue} approvals past their KPI`} />
        <KpiCard label="Due today" value={fmt(dueToday)} tone="warn" sub="At the KPI day today" />
        <KpiCard label="On track" value={fmt(onTrack)} tone="ok" sub="Inside the KPI window" />
      </div>

      <div className="mt-6">
        <WaitsTable rows={rows} />
      </div>
    </div>
  );
}
