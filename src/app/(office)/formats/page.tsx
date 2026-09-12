import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { fmt } from "@/lib/units";
import { cn } from "@/lib/utils";
import { FormatTable, type MapRow, type MapStatus } from "./format-table";

export const metadata = { title: "Builder formats" };

type Builder = { id: string; name: string; platform: string; rows: MapRow[] };

// Ported from the back-office demo. Invented builders and platforms, kept
// only as an illustration until a real customer names theirs.
const BUILDERS: Builder[] = [
  {
    id: "harrowgate",
    name: "Harrowgate Constructions",
    platform: "their own portal, CSV upload",
    rows: [
      { ourField: "Document title", theirField: "doc_title", status: "auto", note: "" },
      { ourField: "High risk construction work", theirField: "hrcw_code", status: "check", note: "Their codes are numbered 1 to 18. Ours are named. Map once, remembered after that." },
      { ourField: "PCBU and ABN", theirField: "abn", status: "auto", note: "" },
      { ourField: "Site supervisor", theirField: "supervisor_name", status: "auto", note: "" },
      { ourField: "Plant and equipment", theirField: "plant_items, one per line", status: "auto", note: "" },
      { ourField: "Hazards and controls", theirField: "controls, plus hierarchy_level", status: "check", note: "They want the control hierarchy (eliminate, substitute, isolate, engineer, admin, PPE) as its own column. Ours is inside the text." },
      { ourField: "Sign-on register", theirField: "separate PDF upload", status: "missing", note: "Their portal takes the sign-on sheet as a second file." },
      { ourField: "Review date", theirField: "review_date, dd/mm/yyyy", status: "auto", note: "" },
      { ourField: "Emergency contacts", theirField: "not accepted", status: "missing", note: "Not a field in their portal. Stays in our copy." },
    ],
  },
  {
    id: "meridian",
    name: "Meridian Build Group",
    platform: "Procore",
    rows: [
      { ourField: "Document title", theirField: "Title", status: "auto", note: "" },
      { ourField: "High risk construction work", theirField: "Trade, from their picklist", status: "check", note: "Their picklist is by trade, not by risk category. Pick once." },
      { ourField: "PCBU and ABN", theirField: "Company", status: "auto", note: "Pulled from their vendor record." },
      { ourField: "Site supervisor", theirField: "Responsible person", status: "auto", note: "" },
      { ourField: "Plant and equipment", theirField: "Equipment", status: "auto", note: "" },
      { ourField: "Hazards and controls", theirField: "Hazard analysis table", status: "auto", note: "Same columns as ours." },
      { ourField: "Sign-on register", theirField: "Attachment", status: "auto", note: "Uploaded alongside as a PDF." },
      { ourField: "Review date", theirField: "Expiry", status: "auto", note: "" },
      { ourField: "Emergency contacts", theirField: "Attachment", status: "auto", note: "" },
    ],
  },
  {
    id: "stoneleigh",
    name: "Stoneleigh Developments",
    platform: "HammerTech",
    rows: [
      { ourField: "Document title", theirField: "Activity", status: "auto", note: "" },
      { ourField: "High risk construction work", theirField: "HRCW", status: "auto", note: "Same list as the WHS Regulation." },
      { ourField: "PCBU and ABN", theirField: "Subcontractor", status: "auto", note: "" },
      { ourField: "Site supervisor", theirField: "Supervisor", status: "auto", note: "" },
      { ourField: "Plant and equipment", theirField: "Plant", status: "auto", note: "" },
      { ourField: "Hazards and controls", theirField: "Hazard, risk, control, residual risk", status: "check", note: "Their residual risk is a 1 to 25 score. Ours is low, medium, high. Pick the conversion once." },
      { ourField: "Sign-on register", theirField: "not needed", status: "auto", note: "Workers sign the SWMS in their app." },
      { ourField: "Review date", theirField: "Expiry", status: "auto", note: "" },
      { ourField: "Emergency contacts", theirField: "Site emergency plan", status: "missing", note: "Held at their site level, not per SWMS." },
    ],
  },
];

function countBy(rows: MapRow[], status: MapStatus) {
  return rows.filter((r) => r.status === status).length;
}

function packSummary(b: Builder): string {
  const auto = countBy(b.rows, "auto");
  const check = countBy(b.rows, "check");
  const missing = countBy(b.rows, "missing");
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
  const auto = countBy(builder.rows, "auto");
  const check = countBy(builder.rows, "check");
  const missing = countBy(builder.rows, "missing");

  return (
    <div>
      <PageHeader
        title="Builder formats"
        description={
          <>
            One master document from your BMS. Mapped once per builder platform. Regenerated for every job after that.
            <span className="mt-1 block text-[12px] text-[color:var(--ink-3)]">Builder-side module: built only when a customer asks for it.</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Automatic" value={fmt(auto)} tone="ok" sub="Filled with no one touching them" />
        <KpiCard label="Needs a check" value={fmt(check)} tone="warn" sub="Once per builder, then remembered" />
        <KpiCard label="No home" value={fmt(missing)} tone={missing > 0 ? "hold" : "muted"} sub="Stay in our copy" />
      </div>

      <Section
        title={<>Document: <span className="font-semibold">SWMS-014 Bulk excavation</span></>}
        aside="From the BMS, revision 7"
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="Builder">
          {BUILDERS.map((b) => {
            const on = b.id === builder.id;
            return (
              <Link
                key={b.id}
                href={`/formats?builder=${b.id}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-2",
                  on
                    ? "border-[color:var(--primary)] bg-[color:var(--primary-soft)] text-[color:var(--primary-ink)]"
                    : "border-[color:var(--border-strong)] bg-white text-[color:var(--ink-2)] hover:bg-[color:var(--surface-2)]",
                )}
              >
                {b.name}
              </Link>
            );
          })}
        </div>
        <p className="mt-2 text-[13px] text-[color:var(--ink-3)]">{builder.platform}</p>

        <div className="mt-4">
          <FormatTable rows={builder.rows} />
        </div>

        <form action="/formats" className="mt-5 flex flex-wrap items-center gap-3">
          <input type="hidden" name="builder" value={builder.id} />
          <input type="hidden" name="generated" value="1" />
          <Button type="submit">Generate the pack</Button>
          {generated && (
            <Link
              href={`/formats?builder=${builder.id}`}
              className="text-[13px] font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline focus-visible:underline"
            >
              Clear
            </Link>
          )}
        </form>

        {generated && (
          <div className="card mt-4">
            <h3 className="text-[16px] font-semibold">Pack ready</h3>
            <p className="mt-1.5 text-[14px] text-[color:var(--ink-2)]">{packSummary(builder)}</p>
          </div>
        )}
      </Section>
    </div>
  );
}
