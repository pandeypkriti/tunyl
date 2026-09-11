import type { RecordRow } from "@/db/schema";
import { reviewQueue, materialsFor } from "@/lib/records";
import { allProjects } from "@/lib/ledger";
import { QueueList } from "@/components/queue/queue-list";
import { QueueDetail } from "@/components/queue/queue-detail";

export const metadata = { title: "Review queue" };

async function QueueBody({
  records,
  projectName,
  selectedId,
}: {
  records: RecordRow[];
  projectName: (projectId: string) => string;
  selectedId?: string;
}) {
  const selected = records.find((r) => r.id === selectedId) ?? records[0];
  const materials = await materialsFor(selected.projectId);
  return (
    <div className="grid gap-5 md:grid-cols-[272px_minmax(0,1fr)]">
      <QueueList records={records} projectName={projectName} selectedId={selected.id} />
      <QueueDetail key={selected.id} record={selected} materials={materials} />
    </div>
  );
}

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [records, projects] = await Promise.all([reviewQueue(), allProjects()]);
  const projectName = (projectId: string) => projects.find((p) => p.id === projectId)?.name ?? "";

  return (
    <div>
      <h1 className="text-[22px]">Review queue</h1>
      <p className="mt-1.5 text-[color:var(--ink2)]">
        Records that matched the purchase order on every field went straight to the ledger. These are the exceptions, and a person ticks each one.
      </p>

      {records.length === 0 ? (
        <div className="mt-5 rounded-[12px] border border-dashed border-[#C9C4BC] px-5 py-10 text-center text-[color:var(--ink2)]">
          Nothing is waiting. Every docket this week matched by rule.
        </div>
      ) : (
        <div className="mt-5">
          <QueueBody records={records} projectName={projectName} selectedId={id} />
        </div>
      )}
    </div>
  );
}
