import { PageHeader } from "@/components/app/page-header";
import { allProjects, ledgerFor } from "@/lib/ledger";
import { reviewQueue } from "@/lib/records";
import { claimsFor } from "@/lib/claims";
import { ProjectsTable, type ProjectRow } from "@/components/projects/projects-table";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const [projects, queue] = await Promise.all([allProjects(), reviewQueue()]);

  const rows: ProjectRow[] = await Promise.all(
    projects.map(async (p) => {
      const [ledger, claims] = await Promise.all([ledgerFor(p.id), claimsFor(p.id)]);
      const m = ledger.materials[0] ?? null;
      const readyToClaim = ledger.materials.reduce((s, mm) => s + mm.toClaim * mm.rate, 0);
      const latest = claims[0] ?? null;
      return {
        slug: p.slug,
        name: p.name,
        client: p.client,
        clientPlatform: p.clientPlatform,
        material: m
          ? {
              name: m.name,
              unit: m.unit,
              delivered: m.delivered,
              ordered: m.ordered,
              pct: m.ordered > 0 ? Math.max(0, Math.min(100, Math.round((m.delivered / m.ordered) * 100))) : 0,
            }
          : null,
        needsPerson: queue.filter((r) => r.projectId === p.id).length,
        readyToClaim,
        latestClaim: latest ? { number: latest.number, status: latest.status } : null,
      };
    })
  );

  return (
    <div>
      <PageHeader title="Projects" />
      <ProjectsTable rows={rows} />
    </div>
  );
}
