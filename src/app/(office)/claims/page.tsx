import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { ClaimsTable, type ClaimTableRow } from "@/components/claims/claims-table";
import { allClaimsWithProject, isOverdue, scheduleText, paymentText } from "./data";
import { money, todayIso } from "@/lib/units";
import type { Claim } from "@/db/schema";

export const metadata = { title: "Claims" };

function sumTotal(rows: Claim[]): number {
  return rows.reduce((s, c) => s + c.total, 0);
}

export default async function ClaimsPage() {
  const today = todayIso();
  const claims = await allClaimsWithProject();

  const rows: ClaimTableRow[] = claims.map((c) => ({
    id: c.id,
    number: c.number,
    projectName: c.projectName,
    client: c.client,
    total: c.total,
    status: c.status,
    lodgedAt: c.lodgedAt,
    scheduleText: scheduleText(c, today),
    paymentText: paymentText(c, today),
  }));

  const lodged = claims.filter((c) => c.status === "lodged");
  const certified = claims.filter((c) => c.status === "certified");
  const drafts = claims.filter((c) => c.status === "draft");
  const overdue = claims.filter((c) => isOverdue(c, today));

  return (
    <div>
      <PageHeader title="Claims" description="Every claim, where it sits, and what it is waiting on." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Lodged"
          value={money(sumTotal(lodged))}
          sub={`${lodged.length} claim${lodged.length === 1 ? "" : "s"} awaiting a schedule`}
        />
        <KpiCard
          label="Certified, not yet paid"
          value={money(sumTotal(certified))}
          tone="ok"
          sub={`${certified.length} claim${certified.length === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Overdue"
          value={String(overdue.length)}
          tone="hold"
          sub={overdue.length > 0 ? "needs a chaser" : "nothing overdue"}
        />
        <KpiCard
          label="Drafts"
          value={String(drafts.length)}
          tone="muted"
          sub={drafts.length > 0 ? "not yet lodged" : "none right now"}
        />
      </div>

      <div className="mt-6">
        <ClaimsTable rows={rows} />
      </div>
    </div>
  );
}
