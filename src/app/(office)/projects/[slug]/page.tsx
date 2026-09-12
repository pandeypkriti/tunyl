import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { db } from "@/db";
import { records } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { projectBySlug } from "@/lib/records";
import { ledgerFor } from "@/lib/ledger";
import { claimsFor } from "@/lib/claims";
import { fmt, money, toContractUnits } from "@/lib/units";
import { PageHeader, Section } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { claimChip } from "@/components/app/status-chip";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MaterialsTable } from "@/components/ledger/materials-table";
import { DocketsTable, type DocketRow } from "@/components/ledger/dockets-table";
import { ClaimPanel } from "@/components/ledger/claim-panel";
import { ClaimsHistory } from "@/components/ledger/claims-history";
import { SubmitButton } from "@/components/ledger/submit-button";
import { draftClaimAction, lodgeClaimAction } from "./actions";

// Pulled out of the component body: React's purity lint flags a direct
// Date.now() call during render even though this is a Server Component that
// is meant to reflect "now" on every request.
function sevenDaysAgoMs(): number {
  return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectBySlug(slug);
  return { title: project ? project.name : "Ledger and claims" };
}

export default async function ProjectLedgerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectBySlug(slug);
  if (!project) notFound();

  const [led, claims] = await Promise.all([ledgerFor(project.id), claimsFor(project.id)]);
  const materialMap = new Map(led.materials.map((m) => [m.id, m]));

  const docketRows: DocketRow[] = led.dockets.map((r) => {
    const mat = r.materialId ? materialMap.get(r.materialId) : undefined;
    let note: string | null = null;
    if (mat && r.unit && r.unit !== mat.unit && r.qty != null) {
      note = toContractUnits(r.qty, r.unit, mat.unit, mat.tPerM3).note || null;
    }
    return { record: r, materialName: mat?.name ?? r.materialText, note };
  });

  const previousClaims = claims.filter((c) => c.status !== "draft");

  // KPI: what is ready to claim right now, across every material.
  const readyToClaim = led.materials.reduce((s, m) => s + m.toClaim * m.rate, 0);
  const readyCount = led.materials.filter((m) => m.toClaim > 0).length;

  // KPI: delivered this week. Mixed units can't be summed, so lean on the
  // headline material when there is one, and fall back to a docket count.
  const weekRows = led.dockets.filter((r) => new Date(r.createdAt).getTime() >= sevenDaysAgoMs());
  const headline = led.materials[0] ?? null;
  const weekHeadlineQty = headline
    ? weekRows.filter((r) => r.materialId === headline.id).reduce((s, r) => s + (r.qtyContract ?? 0), 0)
    : 0;
  const deliveredValue = headline ? `${fmt(weekHeadlineQty, 2)} ${headline.unit}` : fmt(weekRows.length);

  // KPI: held invoices on this project only.
  const heldInvoiceRows = await db
    .select()
    .from(records)
    .where(and(eq(records.projectId, project.id), eq(records.type, "invoice"), eq(records.status, "held")));
  const heldSub = heldInvoiceRows.length === 0
    ? "No invoices on hold"
    : (heldInvoiceRows[0].why || "Billed with no docket on file").split(":")[0];

  const latestClaim = claims[0] ?? null;
  const latestChip = latestClaim ? claimChip(latestClaim.status) : null;

  async function draftFormAction() {
    "use server";
    await draftClaimAction(project.id, slug);
  }
  async function lodgeFormAction() {
    "use server";
    const draftId = led.draft?.id;
    if (draftId) await lodgeClaimAction(draftId, slug);
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        meta={`${project.client} · ${project.clientPlatform}`}
        description="Purchase order rates loaded once. Trucks deliver tonnes, contracts measure cubic metres; the factor is set per material and shown on every docket."
        actions={
          <>
            <form action={draftFormAction}>
              <SubmitButton pendingLabel="Drafting…">Draft progress claim</SubmitButton>
            </form>
            {led.draft ? (
              <form action={lodgeFormAction}>
                <SubmitButton pendingLabel="Lodging…" variant="secondary">Lodge claim</SubmitButton>
              </form>
            ) : (
              <Button type="button" variant="secondary" disabled>Lodge claim</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" variant="outline" />}>
                Export <ChevronDown className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<a href={`/api/export/dockets?project=${slug}`} />}>Docket list (CSV)</DropdownMenuItem>
                <DropdownMenuItem render={<a href={`/api/export/xero?project=${slug}`} />}>Xero bill lines (CSV)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ready to claim"
          value={money(readyToClaim)}
          tone="ok"
          sub={readyCount > 0 ? `${readyCount} material${readyCount === 1 ? "" : "s"} unclaimed` : "Nothing unclaimed"}
        />
        <KpiCard
          label="Delivered this week"
          value={deliveredValue}
          sub={`${weekRows.length} docket${weekRows.length === 1 ? "" : "s"}`}
        />
        <KpiCard label="Held invoices" value={fmt(heldInvoiceRows.length)} tone="hold" sub={heldSub} />
        <KpiCard
          label="Latest claim"
          value={latestClaim ? `Claim ${latestClaim.number}` : "No claims yet"}
          sub={latestChip ? latestChip.label : "Nothing lodged yet"}
        />
      </div>

      <Section title="Materials">
        <MaterialsTable materials={led.materials} />
      </Section>

      <Section>
        <ClaimPanel claim={led.draft} lodgeAction={lodgeFormAction} />
      </Section>

      <Section title="Dockets" aside="Matched by rule, or ticked by a named person.">
        <DocketsTable rows={docketRows} />
      </Section>

      <Section title="Previous claims">
        <ClaimsHistory claims={previousClaims} />
      </Section>
    </div>
  );
}
