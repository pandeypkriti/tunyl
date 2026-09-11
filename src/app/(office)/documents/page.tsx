import Link from "next/link";
import { db } from "@/db";
import { records, purchaseOrders, claims as claimsTable, type RecordRow, type Claim, type Project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { allProjects } from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import { fmt, fmtDate, money } from "@/lib/units";

export const metadata = { title: "Documents" };

const TYPE_FILTERS = ["All", "Docket", "Supplier invoice", "Site instruction", "Purchase order", "Progress claim"] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

type Row = {
  key: string;
  date: string;
  title: string;
  typeLabel: Exclude<TypeFilter, "All">;
  from: string;
  storedAs: string;
  chip: { cls: string; text: string };
  fedInto: string;
  openHref: string | null;
};

function recordTypeLabel(t: RecordRow["type"]): Row["typeLabel"] {
  if (t === "docket" || t === "feed") return "Docket";
  if (t === "invoice") return "Supplier invoice";
  return "Site instruction";
}

function recordChip(r: RecordRow): Row["chip"] {
  switch (r.status) {
    case "rule": return { cls: "clear", text: "By rule" };
    case "ticked": return { cls: "clear", text: r.tickedBy ? `Ticked by ${r.tickedBy}` : "Ticked" };
    case "waiting": return { cls: "check", text: "Waiting" };
    case "held": return { cls: "hold", text: "Held" };
    case "sent_back": return { cls: "neutral", text: "Sent back" };
    case "approved": return { cls: "clear", text: "Approved" };
    case "logged": return { cls: "clear", text: "Logged" };
    default: return { cls: "neutral", text: r.status };
  }
}

function claimChip(c: Claim): Row["chip"] {
  switch (c.status) {
    case "draft": return { cls: "neutral", text: "Draft" };
    case "lodged": return { cls: "check", text: `Lodged ${fmtDate(c.lodgedAt)}` };
    case "certified": return { cls: "clear", text: `Certified ${fmtDate(c.scheduleReceived || c.lodgedAt)}` };
    case "paid": return { cls: "clear", text: "Paid" };
    default: return { cls: "neutral", text: c.status };
  }
}

function claimFed(c: Claim): string {
  return c.status === "draft" ? "From the ledger, not yet lodged" : `${money(c.total)} ex GST`;
}

async function buildRows(project: Project): Promise<Row[]> {
  const [recs, pos, cls] = await Promise.all([
    db.select().from(records).where(eq(records.projectId, project.id)),
    db.select().from(purchaseOrders).where(eq(purchaseOrders.projectId, project.id)),
    db.select().from(claimsTable).where(eq(claimsTable.projectId, project.id)),
  ]);

  const recRows: Row[] = recs.map((r) => ({
    key: `r-${r.id}`,
    date: r.date,
    title: r.title,
    typeLabel: recordTypeLabel(r.type),
    from: r.handedBy,
    storedAs: r.stored,
    chip: recordChip(r),
    fedInto: r.fed || (r.status === "waiting" || r.status === "held" ? "Not yet in the ledger" : ""),
    openHref: r.imageUrl || null,
  }));

  const poRows: Row[] = pos.map((po) => ({
    key: `po-${po.id}`,
    date: po.date,
    title: `Purchase order ${po.number}`,
    typeLabel: "Purchase order",
    from: `Our office, to ${po.supplier}`,
    storedAs: po.stored,
    chip: { cls: "neutral", text: "Open" },
    fedInto: `${fmt(po.qty)} ${po.unit} ordered at ${money(po.rate)}`,
    openHref: null,
  }));

  const claimRows: Row[] = cls.map((c) => ({
    key: `c-${c.id}`,
    date: c.lodgedAt || c.periodEnd,
    title: `Progress claim ${c.number}`,
    typeLabel: "Progress claim",
    from: `Our contracts administrator, to ${project.client}`,
    storedAs: c.stored,
    chip: claimChip(c),
    fedInto: claimFed(c),
    openHref: null,
  }));

  return [...recRows, ...poRows, ...claimRows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

const HANDOVERS: Array<{ doc: string; from: string; to: string; how: string }> = [
  { doc: "Docket", from: "Supplier or haulier's driver", to: "Your site supervisor at the gate", how: "Photographed, or sent by their app" },
  { doc: "Supplier invoice", from: "Supplier's accounts", to: "Your accounts inbox", how: "Forwarded to the project inbox" },
  { doc: "Site instruction", from: "Builder's site engineer", to: "Your foreman", how: "Forwarded email" },
  { doc: "Purchase order", from: "Your office", to: "The supplier", how: "Read from Xero" },
  { doc: "Progress claim", from: "Your contracts administrator", to: "The builder's project manager", how: "Sent in their format" },
];

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ project?: string; type?: string }> }) {
  const sp = await searchParams;
  const projects = await allProjects();

  if (!projects.length) {
    return (
      <div>
        <h1 className="text-[22px]">Documents</h1>
        <p className="mt-2 text-[color:var(--ink2)]">No projects are set up yet.</p>
      </div>
    );
  }

  const activeProject = projects.find((p) => p.slug === sp.project) ?? projects[0];
  const activeType: TypeFilter = (TYPE_FILTERS as readonly string[]).includes(sp.type ?? "") ? (sp.type as TypeFilter) : "All";

  const rows = await buildRows(activeProject);
  const needPerson = rows.filter((r) => r.chip.cls === "check" || r.chip.cls === "hold").length;
  const visibleRows = activeType === "All" ? rows : rows.filter((r) => r.typeLabel === activeType);

  return (
    <div>
      <h1 className="text-[22px]">Documents</h1>
      <p className="mt-1.5 text-[color:var(--ink2)]">Every docket, invoice, instruction, order and claim on this project, in one register.</p>

      <form action="/documents" className="mt-5 flex flex-wrap items-end gap-2.5">
        {activeType !== "All" && <input type="hidden" name="type" value={activeType} />}
        <label className="grid gap-1 text-[13px] font-medium text-[color:var(--ink2)]">
          Project
          <select
            name="project"
            defaultValue={activeProject.slug}
            className="h-9 w-full min-w-[240px] rounded-xl border border-[color:var(--input)] bg-[color:var(--row-alt)] px-3 text-[14px] text-[color:var(--ink)] transition-colors outline-none hover:border-[color:var(--ink2)] focus-visible:border-[color:var(--ring)]"
          >
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary" size="sm">Go</Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((t) => (
          <Link
            key={t}
            href={`/documents?project=${activeProject.slug}${t === "All" ? "" : `&type=${encodeURIComponent(t)}`}`}
            aria-current={t === activeType ? "true" : undefined}
            className={`chip transition-opacity hover:opacity-75 focus-visible:opacity-75 ${t === activeType ? "clear" : "neutral"}`}
          >
            {t}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-[13px] text-[color:var(--ink2)]">
        {rows.length} {rows.length === 1 ? "document" : "documents"} on this project, {needPerson} need{needPerson === 1 ? "s" : ""} a person.
      </p>

      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Document</th>
              <th>From</th>
              <th>Stored as</th>
              <th>Status</th>
              <th>Fed into</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr><td colSpan={7} className="text-[color:var(--ink2)]">No documents of this type on this project.</td></tr>
            )}
            {visibleRows.map((r) => (
              <tr key={r.key}>
                <td>{fmtDate(r.date)}</td>
                <td>
                  {r.title}
                  <span className="sub">{r.typeLabel}</span>
                </td>
                <td>{r.from}</td>
                <td>{r.storedAs}</td>
                <td><span className={`chip ${r.chip.cls}`}>{r.chip.text}</span></td>
                <td>{r.fedInto || <span className="text-[color:var(--ink2)]">Nothing yet</span>}</td>
                <td>
                  {r.openHref ? (
                    <a
                      href={r.openHref}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[color:var(--tint-ink)] underline-offset-2 hover:underline focus-visible:underline"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-[color:var(--ink2)]">No file</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="swipe">Swipe the table sideways.</p>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <div className="card">
          <h3 className="text-[15px]">What is kept: the original, the reading, the decision</h3>
          <p className="mt-1.5 text-[14px] text-[color:var(--ink2)]">The photo or PDF as it arrived, the fields a model or a person read from it, and the decision that let it into the ledger or held it back.</p>
        </div>
        <div className="card">
          <h3 className="text-[15px]">Where it lives: against the project, for seven years</h3>
          <p className="mt-1.5 text-[14px] text-[color:var(--ink2)]">Every record stays filed against the project it belongs to, kept for seven years to match retention requirements for construction records.</p>
        </div>
        <div className="card">
          <h3 className="text-[15px]">Where else it goes: your SharePoint, nightly</h3>
          <p className="mt-1.5 text-[14px] text-[color:var(--ink2)]">A copy of everything lodged today is synced to your SharePoint overnight, so the office has a second copy outside this app.</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-[18px]">Who hands over each piece of paper</h2>
        <div className="tbl">
          <table>
            <thead>
              <tr><th>Document</th><th>From</th><th>To</th><th>How</th></tr>
            </thead>
            <tbody>
              {HANDOVERS.map((h) => (
                <tr key={h.doc}>
                  <td>{h.doc}</td>
                  <td>{h.from}</td>
                  <td>{h.to}</td>
                  <td>{h.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="swipe">Swipe the table sideways.</p>
      </div>
    </div>
  );
}
