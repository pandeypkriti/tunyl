import { db } from "@/db";
import { waits, type Wait } from "@/db/schema";
import { eq } from "drizzle-orm";
import { businessDaysBetween, fmtDate, todayIso } from "@/lib/units";
import { officeName } from "@/lib/auth";

export const metadata = { title: "Waiting on" };

function waitStatus(day: number, kpi: number): { cls: string; text: string } {
  if (day > kpi) {
    const over = day - kpi;
    return { cls: "hold", text: `Overdue ${over} day${over === 1 ? "" : "s"}` };
  }
  if (day === kpi) return { cls: "check", text: "Due today" };
  return { cls: "clear", text: "On track" };
}

function chaserMailto(w: Wait, day: number, signoff: string): string {
  const late = day > w.kpiDays;
  const subject = `${w.what}, ${w.job}, requested ${fmtDate(w.askedOn)}`;
  let body: string;
  if (w.fromParty === "Client") {
    body = `Hi,\n\nA reminder that your ${w.what.toLowerCase()} for ${w.job} (job ${w.jobNo}) are still outstanding. We asked on ${fmtDate(w.askedOn)} and we cannot release the job to construction until they are in.\n\nReply with a day that suits and we will book it in.\n\nThanks,\n${signoff}`;
  } else {
    body = `Hi ${w.who},\n\nFollowing up on the ${w.what.toLowerCase()} for ${w.job} (job ${w.jobNo}), requested on ${fmtDate(w.askedOn)}. Our programme allows ${w.kpiDays} days for this and we are at day ${day}${late ? ", so it is now holding the job" : ""}. Could you let me know where it is up to and when we can expect it?\n\nThanks,\n${signoff}`;
  }
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default async function WaitingPage() {
  const today = todayIso();
  const signoff = `${await officeName()}, client project coordinator`;
  const open = await db.select().from(waits).where(eq(waits.done, false));

  return (
    <div>
      <h1 className="text-[22px]">Waiting on</h1>
      <p className="mt-1.5 text-[color:var(--ink2)]">Every external approval with its KPI clock running. The chaser is written before anyone needs it.</p>
      <p className="mt-1.5 text-[13px] text-[color:var(--ink2)]">Builder-side module: built only when a customer asks for it.</p>

      <div className="tbl mt-5">
        <table>
          <thead>
            <tr>
              <th>Waiting for</th>
              <th>From</th>
              <th>Job</th>
              <th className="num">KPI</th>
              <th className="num">Day</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {open.length === 0 && (
              <tr><td colSpan={7} className="text-[color:var(--ink2)]">Nothing is being waited on right now.</td></tr>
            )}
            {open.map((w) => {
              const day = businessDaysBetween(w.askedOn, today);
              const status = waitStatus(day, w.kpiDays);
              return (
                <tr key={w.id}>
                  <td><b>{w.what}</b></td>
                  <td>{w.fromParty}</td>
                  <td>
                    {w.job}
                    <span className="sub">{w.jobNo}, asked {fmtDate(w.askedOn)}</span>
                  </td>
                  <td className="num">{w.kpiDays} days</td>
                  <td className="num">{day}</td>
                  <td><span className={`chip ${status.cls}`}>{status.text}</span></td>
                  <td>
                    <a
                      href={chaserMailto(w, day, signoff)}
                      className="text-[13px] font-semibold text-[color:var(--tint-ink)] underline-offset-2 hover:underline focus-visible:underline"
                    >
                      Draft chaser
                    </a>
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
