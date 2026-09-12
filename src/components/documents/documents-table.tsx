"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/app/data-table";
import { StatusChip, type ChipTone } from "@/components/app/status-chip";
import { fmtDate } from "@/lib/units";

export type DocumentTypeLabel = "Docket" | "Supplier invoice" | "Site instruction" | "Purchase order" | "Progress claim";

export type DocumentRow = {
  id: string;
  date: string;
  title: string;
  typeLabel: DocumentTypeLabel;
  from: string;
  storedAs: string;
  status: { tone: ChipTone; label: string };
  fedInto: string;
  openHref: string | null;
  rowHref?: string;
};

const TYPE_OPTIONS: Array<{ value: DocumentTypeLabel; label: DocumentTypeLabel }> = [
  { value: "Docket", label: "Docket" },
  { value: "Supplier invoice", label: "Supplier invoice" },
  { value: "Site instruction", label: "Site instruction" },
  { value: "Purchase order", label: "Purchase order" },
  { value: "Progress claim", label: "Progress claim" },
];

const columns: ColumnDef<DocumentRow, unknown>[] = [
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => <span>{fmtDate(getValue() as string)}</span>,
  },
  {
    id: "document",
    // The value used for search and the type filter; the cell renders the title separately.
    accessorFn: (row) => `${row.typeLabel} ${row.title} ${row.from}`,
    header: "Document",
    cell: ({ row }) => (
      <div>
        <div className="text-[14px]">{row.original.title}</div>
        <div className="text-[12px] text-[color:var(--ink-3)]">{row.original.typeLabel}</div>
      </div>
    ),
  },
  { id: "from", accessorKey: "from", header: "From" },
  { id: "storedAs", accessorKey: "storedAs", header: "Stored as" },
  {
    id: "status",
    accessorFn: (row) => row.status.label,
    header: "Status",
    cell: ({ row }) => <StatusChip tone={row.original.status.tone}>{row.original.status.label}</StatusChip>,
  },
  {
    id: "fedInto",
    accessorKey: "fedInto",
    header: "Fed into",
    cell: ({ getValue }) => {
      const v = getValue() as string;
      return v ? <span>{v}</span> : <span className="text-[color:var(--ink-3)]">Nothing yet</span>;
    },
  },
  {
    id: "open",
    header: "Open",
    enableSorting: false,
    cell: ({ row }) => {
      const href = row.original.openHref;
      return href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-[color:var(--primary)] hover:underline focus-visible:underline"
        >
          Open
        </a>
      ) : (
        <span className="text-[color:var(--ink-3)]">No file</span>
      );
    },
  },
];

export function DocumentsTable({ rows }: { rows: DocumentRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Search documents"
      filter={{ column: "document", label: "Type", options: TYPE_OPTIONS }}
      rowHref={(r) => r.rowHref}
      emptyText="No documents of this type on this project."
      initialSort={[{ id: "date", desc: true }]}
    />
  );
}
