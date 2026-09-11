import { notFound } from "next/navigation";
import { claimByToken } from "@/lib/claims";
import { fmt, money, fmtDate } from "@/lib/units";
import { docketsForLine } from "./dockets";
import { CertifyActions } from "./certify-actions";

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
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] bg-[color:var(--panel)] px-4 py-2.5 text-[12px] text-[color:var(--panel-ink2)]">
        <b className="text-[color:var(--panel-ink)]">tunyl.app/c/{project.clientSlug}/claim-{claim.number}</b>
        <span>No login</span>
        <span>Read only</span>
      </div>

      <h1 className="text-[28px] font-bold leading-[1.15]">Progress claim {claim.number}, {project.name}</h1>
      <p className="mt-2 text-[color:var(--ink2)]">
        From your company to {project.client}. Period to {fmtDate(claim.periodEnd)}. Every line opens to the dockets behind it.
      </p>

      {claim.status === "draft" && <span className="chip neutral mt-3 inline-block">Draft, not yet lodged</span>}

      <div className="mt-6 grid gap-2">
        {linesWithDockets.map(({ line, dockets }, i) => (
          <details key={i} className="rounded-[12px] border border-[color:var(--border)] bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[14px]">
              <b className="flex-1 basis-[200px]">{line.material}</b>
              <span className="text-[color:var(--ink2)] tabular-nums">{fmt(line.qty, 2)} {line.unit} at {money(line.rate)}</span>
              <span className="font-semibold tabular-nums">{money(line.amount)}</span>
            </summary>
            <div className="px-4 pb-4">
              {dockets.length > 0 ? (
                <div className="tbl">
                  <table>
                    <thead>
                      <tr><th>Date</th><th>Docket</th><th>Supplier</th><th className="num">Quantity</th><th>How it got in</th><th>Photo</th></tr>
                    </thead>
                    <tbody>
                      {dockets.map((d) => (
                        <tr key={d.id}>
                          <td>{fmtDate(d.date)}</td>
                          <td>{d.ref || d.title}</td>
                          <td>{d.supplier}</td>
                          <td className="num">{fmt(d.qty, 2)} {d.unit}</td>
                          <td>
                            {d.status === "rule"
                              ? <span className="chip clear">By rule</span>
                              : <span className="chip check">Ticked by {d.tickedBy || "the office"}</span>}
                          </td>
                          <td>
                            {d.imageUrl ? (
                              <a href={d.imageUrl} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-[color:var(--tint-ink)] underline-offset-2 hover:underline focus-visible:underline">
                                Photo
                              </a>
                            ) : (
                              <span className="text-[color:var(--ink2)]">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[13px] text-[color:var(--ink2)]">Day-rate or plant line. The timesheet behind it is attached in the full version.</p>
              )}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t-2 border-[color:var(--border)] pt-3 text-[16px] font-semibold">
        <span>Total ex GST</span>
        <span>{money(claim.total)}</span>
      </div>

      <CertifyActions claim={claim} mailto={mailto} />

      <p className="mt-10 border-t border-[color:var(--border)] pt-4 text-[13px] text-[color:var(--ink2)]">
        This is what the builder&#39;s project manager sees. Nothing to install, nothing to sign up to.
      </p>
    </div>
  );
}
