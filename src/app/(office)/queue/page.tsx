import { reviewQueue, recordById } from "@/lib/records";
import { allProjects } from "@/lib/ledger";
import { db } from "@/db";
import { records } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { QueueTable, type QueueRow } from "@/components/queue/queue-table";
import { Notice, type NoticeKind } from "@/components/queue/notice";

export const metadata = { title: "Review queue" };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** How many of these were matched by rule in the last 7 days. Kept out of the component body,
 * which React's compiler treats as render and wants free of clock reads. */
function countSince(rows: { createdAt: Date }[], windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  return rows.filter((r) => r.createdAt.getTime() >= cutoff).length;
}

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; back?: string; held?: string }>;
}) {
  const { done, back, held } = await searchParams;

  const [queue, projects, ruleRows] = await Promise.all([
    reviewQueue(),
    allProjects(),
    db.select().from(records).where(eq(records.status, "rule")),
  ]);

  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const rows: QueueRow[] = queue.map((r) => ({ ...r, projectName: projectName.get(r.projectId) ?? "" }));

  const waiting = queue.filter((r) => r.status === "waiting").length;
  const heldCount = queue.filter((r) => r.status === "held").length;
  const ruleThisWeek = countSince(ruleRows, WEEK_MS);

  const noticeId = done || back || held;
  const noticeKind: NoticeKind | null = done ? "done" : back ? "back" : held ? "held" : null;
  const noticeRecord = noticeId ? await recordById(noticeId) : null;

  return (
    <div>
      <PageHeader
        title="Review queue"
        description="The exceptions. Everything else this week matched a purchase order and went straight to the ledger."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Waiting" value={String(waiting)} tone="warn" />
          <KpiCard label="Held" value={String(heldCount)} tone="hold" />
          <KpiCard label="Matched by rule this week" value={String(ruleThisWeek)} tone="ok" />
        </div>
      </PageHeader>

      {noticeRecord && noticeKind && <Notice kind={noticeKind} record={noticeRecord} />}

      <QueueTable records={rows} />
    </div>
  );
}
