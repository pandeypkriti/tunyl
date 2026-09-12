"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/app/data-table";
import { StatusChip, recordChip } from "@/components/app/status-chip";
import { fmtDate } from "@/lib/units";
import type { RecordRow } from "@/db/schema";

export type QueueRow = RecordRow & { projectName: string };

const TYPE_LABEL: Record<RecordRow["type"], string> = {
  docket: "Docket",
  invoice: "Supplier invoice",
  instruction: "Site instruction",
  feed: "Haulage feed",
};

/** The first clause of a sentence: up to the first "so"-qualifier, colon detail, or full stop. */
function firstClause(text: string): string {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";
  const sentenceEnd = trimmed.search(/[.!?](\s|$)/);
  let clause = sentenceEnd === -1 ? trimmed : trimmed.slice(0, sentenceEnd + 1);
  clause = clause.replace(/[.!?]+$/, "").trim();
  clause = clause.split(/,\s*so\b/i)[0];
  const colon = clause.indexOf(":");
  if (colon > 12) clause = clause.slice(0, colon);
  return clause.trim();
}

function truncate(text: string, max = 72): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** record.why, shortened to one clause. Held records get a "Held:" lead-in. */
export function reasonFor(r: Pick<RecordRow, "why" | "status">): string {
  const clause = firstClause(r.why);
  if (!clause) return r.status === "held" ? "Held for review" : "Waiting for a person";
  if (r.status === "held") {
    const lower = clause.charAt(0).toLowerCase() + clause.slice(1);
    return truncate(lower.startsWith("held") ? clause : `Held: ${lower}`);
  }
  return truncate(clause);
}

const columns: ColumnDef<QueueRow, unknown>[] = [
  {
    id: "document",
    header: "Document",
    accessorKey: "title",
    cell: ({ row }) => (
      <div>
        <div className="text-[14px] font-medium text-[color:var(--ink)]">{row.original.title || "Untitled record"}</div>
        {row.original.supplier && <div className="mt-0.5 truncate text-[12px] text-[color:var(--ink-3)]">{row.original.supplier}</div>}
      </div>
    ),
  },
  {
    id: "type",
    header: "Type",
    accessorFn: (r) => TYPE_LABEL[r.type] ?? r.type,
    cell: ({ getValue }) => <span className="text-[13px] text-[color:var(--ink-2)]">{getValue() as string}</span>,
  },
  {
    id: "project",
    header: "Project",
    accessorKey: "projectName",
    cell: ({ getValue }) => <span className="text-[13px] text-[color:var(--ink-2)]">{getValue() as string}</span>,
  },
  {
    id: "reason",
    header: "Reason",
    accessorFn: (r) => reasonFor(r),
    enableSorting: false,
    cell: ({ getValue }) => <span className="text-[13px] text-[color:var(--ink-2)]">{getValue() as string}</span>,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const chip = recordChip(row.original.status);
      return <StatusChip tone={chip.tone}>{chip.label}</StatusChip>;
    },
  },
  {
    id: "date",
    header: "Sent in",
    accessorKey: "date",
    meta: { align: "right" },
    cell: ({ getValue }) => <span className="mono text-[12px] text-[color:var(--ink-3)]">{fmtDate(getValue() as string)}</span>,
  },
];

export function QueueTable({ records }: { records: QueueRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={records}
      searchPlaceholder="Search the queue"
      filter={{ column: "status", label: "Status", options: [{ value: "waiting", label: "Waiting" }, { value: "held", label: "Held" }] }}
      rowHref={(r) => `/queue/${r.id}`}
      emptyText="Nothing is waiting. Every docket this week matched by rule."
      initialSort={[{ id: "date", desc: true }]}
    />
  );
}
