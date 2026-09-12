import { notFound } from "next/navigation";
import { PageHeader, Section } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { Stepper, type Step, type StepState } from "@/components/app/stepper";
import { Money, Qty } from "@/components/app/money";
import { ClaimHeaderActions } from "@/components/claims/claim-header-actions";
import { claimWithProject, scheduleLate, chaserMailto } from "../data";
import { money, fmtDate, todayIso } from "@/lib/units";
import type { Claim } from "@/db/schema";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await claimWithProject(id);
  return { title: found ? `Claim ${found.claim.number}` : "Claim" };
}

/** Draft, lodged, schedule received, certified, paid. Blocked when the schedule is overdue. */
function claimSteps(c: Claim, today: string): Step[] {
  if (c.status === "draft") {
    return [
      { label: "Draft", state: "current" },
      { label: "Lodged", state: "todo" },
      { label: "Schedule received", state: "todo" },
      { label: "Certified", state: "todo" },
      { label: "Paid", state: "todo" },
    ];
  }
  const late = c.status === "lodged" && !c.scheduleReceived && !!c.scheduleDue && today > c.scheduleDue;
  const scheduleState: StepState = c.scheduleReceived ? "done" : late ? "blocked" : c.status === "lodged" ? "current" : "todo";
  const certifiedState: StepState =
    c.status === "certified" || c.status === "paid" ? "done" : c.status === "lodged" && !!c.scheduleReceived ? "current" : "todo";
  const paidState: StepState = c.status === "paid" ? "done" : c.status === "certified" ? "current" : "todo";
  return [
    { label: "Draft", state: "done" },
    { label: "Lodged", state: "done", hint: c.lodgedAt ? `Lodged ${fmtDate(c.lodgedAt)}` : undefined },
    {
      label: "Schedule received",
      state: scheduleState,
      hint: c.scheduleReceived ? `Received ${fmtDate(c.scheduleReceived)}` : c.scheduleDue ? `Due ${fmtDate(c.scheduleDue)}` : undefined,
    },
    { label: "Certified", state: certifiedState },
    { label: "Paid", state: paidState, hint: c.paidAt ? `Paid ${fmtDate(c.paidAt)}` : undefined },
  ];
}

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await claimWithProject(id);
  if (!found) notFound();
  const { claim, project } = found;
  const today = todayIso();
  const late = scheduleLate(claim, today);
  const certifiedOrPaid = claim.status === "certified" || claim.status === "paid";

  const events: Array<{ label: string; date: string }> = [
    { label: "Created", date: fmtDate(claim.createdAt.toISOString().slice(0, 10)) },
  ];
  if (claim.lodgedAt) events.push({ label: "Lodged", date: fmtDate(claim.lodgedAt) });
  if (claim.scheduleReceived) events.push({ label: "Schedule received", date: fmtDate(claim.scheduleReceived) });
  if (certifiedOrPaid) events.push({ label: "Certified", date: fmtDate(claim.scheduleReceived || claim.lodgedAt) });
  if (claim.paidAt) events.push({ label: "Paid", date: fmtDate(claim.paidAt) });

  return (
    <div>
      <PageHeader
        title={`Progress claim ${claim.number}`}
        meta={`${project.name} · to ${project.client}`}
        actions={
          <ClaimHeaderActions
            claimId={claim.id}
            token={claim.token}
            status={claim.status}
            mailto={late ? chaserMailto({ ...claim, projectName: project.name }) : null}
          />
        }
      />

      <Stepper steps={claimSteps(claim, today)} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Claim total" value={money(claim.total)} />
        <KpiCard label="Certified amount" value={certifiedOrPaid ? money(claim.total) : "Not yet"} tone="ok" />
        <KpiCard
          label="Payment due"
          value={claim.paymentDue ? fmtDate(claim.paymentDue) : "Not yet"}
          tone={claim.status === "paid" ? "ok" : "muted"}
        />
      </div>

      <Section title="Lines">
        {claim.lines.length === 0 ? (
          <p className="text-[13px] text-[color:var(--ink-3)]">Nothing on this claim yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[color:var(--border)] bg-white">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Item</th>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-right text-[12px] font-medium text-[color:var(--ink-3)]">Qty</th>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Unit</th>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-right text-[12px] font-medium text-[color:var(--ink-3)]">Rate</th>
                  <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-right text-[12px] font-medium text-[color:var(--ink-3)]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {claim.lines.map((l, i) => (
                  <tr key={i} className="border-b border-[color:var(--border)] last:border-b-0">
                    <td className="px-3 py-2.5">{l.material}</td>
                    <td className="px-3 py-2.5 text-right"><Qty value={l.qty} d={2} /></td>
                    <td className="px-3 py-2.5">{l.unit}</td>
                    <td className="px-3 py-2.5 text-right"><Money value={l.rate} /></td>
                    <td className="px-3 py-2.5 text-right"><Money value={l.amount} tone="positive" /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-3 py-2.5 font-medium" colSpan={4}>Total ex GST</td>
                  <td className="px-3 py-2.5 text-right font-semibold"><Money value={claim.total} tone="positive" /></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Section>

      <Section title="Timeline">
        <ul className="hairline">
          {events.map((e) => (
            <li key={e.label} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[14px]">{e.label}</span>
              <span className="text-[13px] text-[color:var(--ink-3)]">{e.date}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
