import { notFound } from "next/navigation";
import { claimByToken } from "@/lib/claims";
import { fmt, money, fmtDate } from "@/lib/units";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { Stepper, type Step } from "@/components/app/stepper";
import { StatusChip, recordChip } from "@/components/app/status-chip";
import type { ClaimStatus } from "@/db/schema";
import { docketsForLine } from "./dockets";
import { CertifyActions } from "./certify-actions";

const STEP_ORDER: ClaimStatus[] = ["draft", "lodged", "certified", "paid"];
const STEP_LABEL: Record<ClaimStatus, string> = { draft: "Draft", lodged: "Lodged", certified: "Certified", paid: "Paid" };

function claimSteps(status: ClaimStatus): Step[] {
  const idx = STEP_ORDER.indexOf(status);
  if (status === "draft") return STEP_ORDER.map((s, i) => ({ label: STEP_LABEL[s], state: i === 0 ? "current" : "todo" }));
  return STEP_ORDER.map((s, i) => ({ label: STEP_LABEL[s], state: i <= idx ? "done" : i === idx + 1 ? "current" : "todo" }));
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await claimByToken(token);
  return { title: result ? `Claim ${result.claim.number}, ${result.project?.name ?? ""}` : "Claim" };
}

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await claimByToken(token);
  if (!result || !result.project) notFound();
  const { claim, project } = result;

  const linesWithDockets = await Promise.all(
    claim.lines.map(async (line) => ({ line, dockets: await docketsForLine(project.id, line.material) })),
  );

  const officeEmail = process.env.OFFICE_EMAIL || "office@example.com";
  const mailto = `mailto:${officeEmail}?subject=${encodeURIComponent(`Query on claim ${claim.number}`)}`;

  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[color:var(--panel)] px-4 py-2.5 text-[12px] text-[color:var(--panel-ink2)] sm:px-6">
        <span className="mono font-medium text-[color:var(--panel-ink)]">
          tunyl.app/c/{project.clientSlug}/claim-{claim.number}
        </span>
        <span>No login</span>
        <span>Read only</span>
      </div>

      <div className="mx-auto max-w-[760px] px-4 py-8 sm:py-12">
        <PageHeader
          title={`Progress claim ${claim.number}`}
          meta={`From your company to ${project.client} · Period to ${fmtDate(claim.periodEnd)}`}
          description="Every line opens to the dockets behind it."
        >
          <Stepper steps={claimSteps(claim.status)} />
        </PageHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiCard label="Claim total" value={money(claim.total)} tone="ok" />
          <KpiCard
            label={claim.paymentDue ? "Payment due" : "Payment"}
            value={claim.paymentDue ? fmtDate(claim.paymentDue) : "Awaiting certification"}
            tone={claim.paymentDue ? "primary" : "muted"}
          />
        </div>

        <div className="mt-6 grid gap-2">
          {linesWithDockets.map(({ line, dockets }, i) => (
            <details key={i} className="group rounded-xl border border-[color:var(--border)] bg-white open:shadow-[var(--shadow)]">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[14px] marker:content-none focus-visible:outline-2">
                <b className="flex-1 basis-[200px] font-medium">{line.material}</b>
                <span className="tabular-nums text-[color:var(--ink-2)]">{fmt(line.qty, 2)} {line.unit} at {money(line.rate)}</span>
                <span className="font-semibold tabular-nums">{money(line.amount)}</span>
              </summary>
              <div className="border-t border-[color:var(--border)] px-4 pb-4 pt-3">
                {dockets.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-[color:var(--border)]">
                    <table className="w-full min-w-[560px] border-collapse text-[13px]">
                      <thead>
                        <tr>
                          <th className="border-b border-[color:var(--border)] px-3 py-2 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Date</th>
                          <th className="border-b border-[color:var(--border)] px-3 py-2 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Docket</th>
                          <th className="border-b border-[color:var(--border)] px-3 py-2 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Supplier</th>
                          <th className="border-b border-[color:var(--border)] px-3 py-2 text-right text-[12px] font-medium text-[color:var(--ink-3)]">Quantity</th>
                          <th className="border-b border-[color:var(--border)] px-3 py-2 text-left text-[12px] font-medium text-[color:var(--ink-3)]">How it got in</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dockets.map((d) => {
                          const chip = recordChip(d.status);
                          return (
                            <tr key={d.id} className="last:[&>td]:border-b-0">
                              <td className="border-b border-[color:var(--border)] px-3 py-2">{fmtDate(d.date)}</td>
                              <td className="mono border-b border-[color:var(--border)] px-3 py-2">{d.ref || d.title}</td>
                              <td className="border-b border-[color:var(--border)] px-3 py-2">{d.supplier}</td>
                              <td className="border-b border-[color:var(--border)] px-3 py-2 text-right tabular-nums">{fmt(d.qty, 2)} {d.unit}</td>
                              <td className="border-b border-[color:var(--border)] px-3 py-2">
                                <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
                                {d.status === "ticked" && d.tickedBy && (
                                  <div className="mt-1 text-[12px] text-[color:var(--ink-3)]">by {d.tickedBy}</div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[13px] text-[color:var(--ink-3)]">
                    Day-rate or plant line. The timesheet behind it is attached in the full version.
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t-2 border-[color:var(--border)] pt-3 text-[16px] font-semibold">
          <span>Total ex GST</span>
          <span className="tabular-nums">{money(claim.total)}</span>
        </div>

        <CertifyActions claim={claim} mailto={mailto} />

        <p className="mt-10 border-t border-[color:var(--border)] pt-4 text-[13px] text-[color:var(--ink-3)]">
          This is what the builder&#39;s project manager sees. Nothing to install, nothing to sign up to.
        </p>
      </div>
    </div>
  );
}
