import Link from "next/link";
import { db } from "@/db";
import { records, purchaseOrders, claims as claimsTable, type RecordRow, type Claim, type Project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { allProjects } from "@/lib/ledger";
import { fmt, money } from "@/lib/units";
import { PageHeader, Section } from "@/components/app/page-header";
import { recordChip, claimChip, type ChipTone } from "@/components/app/status-chip";
import { DocumentsTable, type DocumentRow, type DocumentTypeLabel } from "@/components/documents/documents-table";

export const metadata = { title: "Documents" };

function recordTypeLabel(t: RecordRow["type"]): DocumentTypeLabel {
  if (t === "docket" || t === "feed") return "Docket";
  if (t === "invoice") return "Supplier invoice";
  return "Site instruction";
}

function recordStatus(r: RecordRow): { tone: ChipTone; label: string } {
  const chip = recordChip(r.status);
  return r.status === "ticked" && r.tickedBy ? { tone: chip.tone, label: `Ticked by ${r.tickedBy}` } : chip;
}

function claimStatus(c: Claim): { tone: ChipTone; label: string } {
  return claimChip(c.status);
}

function claimFed(c: Claim): string {
  return c.status === "draft" ? "From the ledger, not yet lodged" : `${money(c.total)} ex GST`;
}

async function buildRows(project: Project): Promise<DocumentRow[]> {
  const [recs, pos, cls] = await Promise.all([
    db.select().from(records).where(eq(records.projectId, project.id)),
    db.select().from(purchaseOrders).where(eq(purchaseOrders.projectId, project.id)),
    db.select().from(claimsTable).where(eq(claimsTable.projectId, project.id)),
  ]);

  const recRows: DocumentRow[] = recs.map((r) => ({
    id: `r-${r.id}`,
    date: r.date,
    title: r.title,
    typeLabel: recordTypeLabel(r.type),
    from: r.handedBy,
    storedAs: r.stored,
    status: recordStatus(r),
    fedInto: r.fed || (r.status === "waiting" || r.status === "held" ? "Not yet in the ledger" : ""),
    openHref: r.imageUrl || null,
    rowHref: `/queue/${r.id}`,
  }));

  const poRows: DocumentRow[] = pos.map((po) => ({
    id: `po-${po.id}`,
    date: po.date,
    title: `Purchase order ${po.number}`,
    typeLabel: "Purchase order",
    from: `Our office, to ${po.supplier}`,
    storedAs: po.stored,
    status: { tone: "neutral", label: "Open" },
    fedInto: `${fmt(po.qty)} ${po.unit} ordered at ${money(po.rate)}`,
    openHref: null,
  }));

  const claimRows: DocumentRow[] = cls.map((c) => ({
    id: `c-${c.id}`,
    date: c.lodgedAt || c.periodEnd,
    title: `Progress claim ${c.number}`,
    typeLabel: "Progress claim",
    from: `Our contracts administrator, to ${project.client}`,
    storedAs: c.stored,
    status: claimStatus(c),
    fedInto: claimFed(c),
    openHref: null,
    rowHref: `/claims/${c.id}`,
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

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const sp = await searchParams;
  const projects = await allProjects();

  if (!projects.length) {
    return (
      <div>
        <PageHeader title="Documents" description="Every piece of paper, stored once against its project, with what was read from it, who let it in, and what it fed." />
        <p className="text-[14px] text-[color:var(--ink-3)]">No projects are set up yet.</p>
      </div>
    );
  }

  const activeProject = projects.find((p) => p.slug === sp.project) ?? projects[0];
  const rows = await buildRows(activeProject);

  return (
    <div>
      <PageHeader title="Documents" description="Every piece of paper, stored once against its project, with what was read from it, who let it in, and what it fed." />

      <div className="flex flex-wrap gap-1.5">
        {projects.map((p) => (
          <Link
            key={p.slug}
            href={`/documents?project=${p.slug}`}
            aria-current={p.slug === activeProject.slug ? "true" : undefined}
            className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[color:var(--primary)] ${
              p.slug === activeProject.slug
                ? "bg-[color:var(--primary-soft)] text-[color:var(--primary-ink)]"
                : "bg-[color:var(--surface-2)] text-[color:var(--ink-2)] hover:bg-[color:var(--border)]"
            }`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <DocumentsTable rows={rows} />
      </div>

      <Section title="Who hands over each piece of paper">
        <div className="overflow-x-auto rounded-lg border border-[color:var(--border)] bg-white">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">Document</th>
                <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">From</th>
                <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">To</th>
                <th className="border-b border-[color:var(--border)] px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]">How</th>
              </tr>
            </thead>
            <tbody>
              {HANDOVERS.map((h) => (
                <tr key={h.doc} className="border-b border-[color:var(--border)] last:border-b-0">
                  <td className="px-3 py-2.5 font-medium">{h.doc}</td>
                  <td className="px-3 py-2.5">{h.from}</td>
                  <td className="px-3 py-2.5">{h.to}</td>
                  <td className="px-3 py-2.5">{h.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-4 hairline text-[13px] text-[color:var(--ink-2)]">
          <li className="py-2.5"><b className="font-medium text-[color:var(--ink)]">What is kept:</b> the original, the reading, and the decision.</li>
          <li className="py-2.5"><b className="font-medium text-[color:var(--ink)]">Where it lives:</b> against the project, for seven years.</li>
          <li className="py-2.5"><b className="font-medium text-[color:var(--ink)]">Where else it goes:</b> your SharePoint, nightly.</li>
        </ul>
      </Section>
    </div>
  );
}
