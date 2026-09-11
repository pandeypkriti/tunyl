import Link from "next/link";
import { lodgedClaims } from "@/lib/claims";
import { money, fmt, fmtDate, todayIso } from "@/lib/units";
import { boardTiles, boardProjectRows, describeSchedule, describePayment, claimStatusChip, chaserMailto } from "./board";

export const metadata = { title: "Board view" };

export default async function Page() {
  const today = todayIso();
  const [tiles, rows, claims] = await Promise.all([boardTiles(), boardProjectRows(), lodgedClaims()]);

  return (
    <div>
      <h1 className="text-[22px]">All projects</h1>
      <p className="mt-1.5 text-[color:var(--ink2)]">Every figure is a sum of records that passed by rule or by tick. Nothing on this screen is typed in.</p>

      <div className="tiles mt-5">
        <div className="tile">
          <div className="name">Dockets in this week</div>
          <div className="num">{fmt(tiles.dockets.total)}</div>
          <div className="sub">{tiles.dockets.byRule} matched by rule, {tiles.dockets.forPerson} for a person</div>
        </div>
        <div className="tile">
          <div className="name">Waiting on a person</div>
          <div className="num">{fmt(tiles.waiting)}</div>
          <div className="sub">in the review queue</div>
        </div>
        <div className="tile">
          <div className="name">Ready to claim</div>
          <div className="num">{money(tiles.readyToClaim.total)}</div>
          <div className="sub">{tiles.readyToClaim.projectCount} {tiles.readyToClaim.projectCount === 1 ? "project" : "projects"} with verified quantities</div>
        </div>
        <div className="tile hold">
          <div className="name">Held from ApprovalMax</div>
          <div className="num">{tiles.held.count} {tiles.held.count === 1 ? "invoice" : "invoices"}</div>
          <div className="sub">{tiles.held.sub}</div>
        </div>
      </div>

      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Client and their platform</th>
              <th>Headline material, delivered against ordered</th>
              <th className="num">Needs a person</th>
              <th>Claim</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug}>
                <td>
                  <Link href={`/projects/${r.slug}`} className="font-semibold text-[color:var(--tint-ink)] underline-offset-2 hover:underline focus-visible:underline">
                    {r.name}
                  </Link>
                </td>
                <td>{r.client}, {r.clientPlatform}</td>
                <td>
                  {r.headline ? (
                    <>
                      {r.headline.name}
                      <span className="sub">{fmt(r.headline.delivered)} of {fmt(r.headline.ordered)} {r.headline.unit}, {r.headline.pct}%</span>
                      <div className="bar" aria-hidden="true"><i style={{ width: `${r.headline.pct}%` }} /></div>
                    </>
                  ) : (
                    <span className="text-[color:var(--ink2)]">No materials on this project</span>
                  )}
                </td>
                <td className="num">
                  {r.needsPerson > 0 ? <span className="chip check">{r.needsPerson}</span> : <span className="chip clear">0</span>}
                </td>
                <td>{r.claimText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="swipe">Swipe the table sideways.</p>

      <div className="mt-10">
        <h2 className="text-[22px]">Claims lodged, waiting on money</h2>
        <p className="mt-1.5 text-[color:var(--ink2)]">Under the Security of Payment Act the builder has 10 business days to serve a payment schedule. The clock starts the day the claim is lodged.</p>
      </div>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Builder</th>
              <th className="num">Amount</th>
              <th>Lodged</th>
              <th>Payment schedule</th>
              <th>Payment</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 && (
              <tr><td colSpan={8} className="text-[color:var(--ink2)]">No claims lodged yet.</td></tr>
            )}
            {claims.map((c) => {
              const chip = claimStatusChip(c, today);
              return (
                <tr key={c.id}>
                  <td>
                    <b>Claim {c.number}</b>
                    <span className="sub">{c.projectName}</span>
                  </td>
                  <td>{c.client}</td>
                  <td className="num">{money(c.total)}</td>
                  <td>{fmtDate(c.lodgedAt)}</td>
                  <td>{describeSchedule(c, today)}</td>
                  <td>{describePayment(c, today)}</td>
                  <td><span className={`chip ${chip.cls}`}>{chip.text}</span></td>
                  <td>
                    {chip.cls === "hold" && (
                      <a
                        href={chaserMailto(c)}
                        className="text-[13px] font-semibold text-[color:var(--tint-ink)] underline-offset-2 hover:underline focus-visible:underline"
                      >
                        Draft chaser
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="swipe">Swipe the table sideways.</p>
    </div>
  );
}
