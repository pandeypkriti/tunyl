import { notFound } from "next/navigation";
import { projectBySlug } from "@/lib/records";
import { ledgerFor } from "@/lib/ledger";
import { claimsFor } from "@/lib/claims";
import { fmt } from "@/lib/units";
import { MaterialsTable } from "@/components/ledger/materials-table";
import { DocketsTable, type DocketRow } from "@/components/ledger/dockets-table";
import { ClaimPanel } from "@/components/ledger/claim-panel";
import { ClaimsHistory } from "@/components/ledger/claims-history";

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
    const converted = r.qtyContract != null && mat && r.unit !== mat.unit ? `${fmt(r.qtyContract, 2)} ${mat.unit}` : null;
    return { record: r, materialName: mat?.name ?? r.materialText, converted };
  });

  const previousClaims = claims.filter((c) => c.status !== "draft");

  return (
    <div>
      <h1 className="text-[22px]">{project.name}</h1>
      <p className="mt-1.5 text-[color:var(--ink2)]">
        {project.client}{project.clientPlatform ? `, ${project.clientPlatform}` : ""}. Purchase order rates loaded once.
      </p>

      <div className="mt-5">
        <MaterialsTable materials={led.materials} />
        <p className="swipe">Swipe the table sideways.</p>
        <p className="mt-3 text-[13px] text-[color:var(--ink2)]">
          Trucks deliver tonnes. Contracts measure cubic metres. The conversion factor is set once per material on the purchase order and shown on every docket, never hidden.
        </p>

        <ClaimPanel projectId={project.id} slug={project.slug} initialDraft={led.draft} />
      </div>

      <div className="mt-10">
        <h2 className="text-[22px]">The dockets behind these numbers</h2>
        <p className="mt-1.5 text-[color:var(--ink2)]">Newest first. Matched by rule, or ticked by a named person.</p>
        <div className="mt-3">
          <DocketsTable rows={docketRows} />
        </div>
        <p className="swipe">Swipe the table sideways.</p>
      </div>

      <div className="mt-10">
        <h2 className="text-[22px]">Previous claims</h2>
        <div className="mt-3">
          <ClaimsHistory claims={previousClaims} />
        </div>
        <p className="swipe">Swipe the table sideways.</p>
      </div>
    </div>
  );
}
