import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Builder formats" };

type MapStatus = "auto" | "check" | "missing";
type MapRow = [ourField: string, theirField: string, status: MapStatus, note: string];

type Builder = { id: string; name: string; platform: string; rows: MapRow[] };

// Ported from the back-office demo. Invented builders and platforms, kept
// only as an illustration until a real customer names theirs.
const BUILDERS: Builder[] = [
  {
    id: "harrowgate",
    name: "Harrowgate Constructions",
    platform: "their own portal, CSV upload",
    rows: [
      ["Document title", "doc_title", "auto", ""],
      ["High risk construction work", "hrcw_code", "check", "Their codes are numbered 1 to 18. Ours are named. Map once, remembered after that."],
      ["PCBU and ABN", "abn", "auto", ""],
      ["Site supervisor", "supervisor_name", "auto", ""],
      ["Plant and equipment", "plant_items, one per line", "auto", ""],
      ["Hazards and controls", "controls, plus hierarchy_level", "check", "They want the control hierarchy (eliminate, substitute, isolate, engineer, admin, PPE) as its own column. Ours is inside the text."],
      ["Sign-on register", "separate PDF upload", "missing", "Their portal takes the sign-on sheet as a second file."],
      ["Review date", "review_date, dd/mm/yyyy", "auto", ""],
      ["Emergency contacts", "not accepted", "missing", "Not a field in their portal. Stays in our copy."],
    ],
  },
  {
    id: "meridian",
    name: "Meridian Build Group",
    platform: "Procore",
    rows: [
      ["Document title", "Title", "auto", ""],
      ["High risk construction work", "Trade, from their picklist", "check", "Their picklist is by trade, not by risk category. Pick once."],
      ["PCBU and ABN", "Company", "auto", "Pulled from their vendor record."],
      ["Site supervisor", "Responsible person", "auto", ""],
      ["Plant and equipment", "Equipment", "auto", ""],
      ["Hazards and controls", "Hazard analysis table", "auto", "Same columns as ours."],
      ["Sign-on register", "Attachment", "auto", "Uploaded alongside as a PDF."],
      ["Review date", "Expiry", "auto", ""],
      ["Emergency contacts", "Attachment", "auto", ""],
    ],
  },
  {
    id: "stoneleigh",
    name: "Stoneleigh Developments",
    platform: "HammerTech",
    rows: [
      ["Document title", "Activity", "auto", ""],
      ["High risk construction work", "HRCW", "auto", "Same list as the WHS Regulation."],
      ["PCBU and ABN", "Subcontractor", "auto", ""],
      ["Site supervisor", "Supervisor", "auto", ""],
      ["Plant and equipment", "Plant", "auto", ""],
      ["Hazards and controls", "Hazard, risk, control, residual risk", "check", "Their residual risk is a 1 to 25 score. Ours is low, medium, high. Pick the conversion once."],
      ["Sign-on register", "not needed", "auto", "Workers sign the SWMS in their app."],
      ["Review date", "Expiry", "auto", ""],
      ["Emergency contacts", "Site emergency plan", "missing", "Held at their site level, not per SWMS."],
    ],
  },
];

function statusChip(s: MapStatus) {
  if (s === "auto") return { cls: "clear", text: "Auto" };
  if (s === "check") return { cls: "check", text: "Check once" };
  return { cls: "unreadable", text: "No home" };
}

function packSummary(b: Builder): string {
  const auto = b.rows.filter((r) => r[2] === "auto").length;
  const check = b.rows.filter((r) => r[2] === "check").length;
  const missing = b.rows.filter((r) => r[2] === "missing").length;
  let text = `SWMS-014 revision 7, formatted for ${b.name}. Mapped into ${b.platform}. ${auto} fields filled automatically.`;
  if (check) text += ` ${check} ${check === 1 ? "needs" : "need"} a person the first time, then the choice is remembered.`;
  if (missing) text += ` ${missing} ${missing === 1 ? "has" : "have"} nowhere to go in their system and stay in our copy.`;
  text += ` Next job for ${b.name}: nothing to map.`;
  return text;
}

export default async function FormatsPage({ searchParams }: { searchParams: Promise<{ builder?: string; generated?: string }> }) {
  const sp = await searchParams;
  const builder = BUILDERS.find((b) => b.id === sp.builder) ?? BUILDERS[0];
  const generated = sp.generated === "1";

  return (
    <div>
      <h1 className="text-[22px]">Builder formats</h1>
      <p className="mt-1.5 text-[color:var(--ink2)]">One master document from your BMS. Mapped once per builder platform. Regenerated for every job after that.</p>
      <p className="mt-1.5 text-[13px] text-[color:var(--ink2)]">Builder-side module: built only when a customer asks for it.</p>

      <p className="mt-5 text-[13px] font-medium text-[color:var(--ink2)]">
        Document: <span className="font-semibold text-[color:var(--ink)]">SWMS-014 Bulk excavation</span>, from the BMS, revision 7
      </p>

      <form action="/formats" className="mt-3 flex flex-wrap items-end gap-2.5">
        <label className="grid gap-1 text-[13px] font-medium text-[color:var(--ink2)]">
          Builder
          <select
            name="builder"
            defaultValue={builder.id}
            className="h-9 w-full min-w-[240px] rounded-xl border border-[color:var(--input)] bg-[color:var(--row-alt)] px-3 text-[14px] text-[color:var(--ink)] transition-colors outline-none hover:border-[color:var(--ink2)] focus-visible:border-[color:var(--ring)]"
          >
            {BUILDERS.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary" size="sm">Go</Button>
      </form>
      <p className="mt-1 text-[13px] text-[color:var(--ink2)]">{builder.platform}</p>

      <div className="tbl">
        <table>
          <thead>
            <tr><th>Our field</th><th>Their field</th><th>Status</th><th>Note</th></tr>
          </thead>
          <tbody>
            {builder.rows.map((r) => {
              const chip = statusChip(r[2]);
              return (
                <tr key={r[0]}>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td><span className={`chip ${chip.cls}`}>{chip.text}</span></td>
                  <td className="text-[13px] text-[color:var(--ink2)]">{r[3]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="swipe">Swipe the table sideways.</p>

      <form action="/formats" className="mt-4 flex flex-wrap items-center gap-2.5">
        <input type="hidden" name="builder" value={builder.id} />
        <input type="hidden" name="generated" value="1" />
        <Button type="submit">Generate the pack</Button>
        {generated && (
          <Link href={`/formats?builder=${builder.id}`} className="text-[13px] font-medium text-[color:var(--ink2)] underline-offset-2 hover:underline focus-visible:underline">
            Clear
          </Link>
        )}
      </form>

      {generated && (
        <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--row-alt)] p-4">
          <h3 className="text-[16px]">Pack ready</h3>
          <p className="mt-1.5 text-[14px] text-[color:var(--ink2)]">{packSummary(builder)}</p>
        </div>
      )}
    </div>
  );
}
