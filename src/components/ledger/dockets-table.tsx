"use client";
// Column defs live in a client component, per the DataTable contract.
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/app/data-table";
import { StatusChip, recordChip } from "@/components/app/status-chip";
import type { RecordRow } from "@/db/schema";
import { fmt, fmtDate } from "@/lib/units";

export type DocketRow = { record: RecordRow; materialName: string; note: string | null };

const columns: ColumnDef<DocketRow, unknown>[] = [
  {
    id: "date",
    header: "Date",
    accessorFn: (r) => r.record.date,
    enableGlobalFilter: false,
    cell: ({ row }) => fmtDate(row.original.record.date),
  },
  {
    id: "docket",
    header: "Docket",
    accessorFn: (r) => r.record.ref || r.record.title,
    cell: ({ row }) => <span className="mono">{row.original.record.ref || row.original.record.title}</span>,
  },
  {
    id: "supplier",
    header: "Supplier",
    accessorFn: (r) => r.record.supplier,
  },
  {
    id: "material",
    header: "Material",
    accessorFn: (r) => r.materialName,
    enableGlobalFilter: false,
  },
  {
    id: "quantity",
    header: "Quantity",
    meta: { align: "right" },
    enableGlobalFilter: false,
    accessorFn: (r) => r.record.qty ?? 0,
    cell: ({ row }) => {
      const r = row.original.record;
      return (
        <div>
          {fmt(r.qty, 2)} {r.unit}
          {row.original.note && <div className="mt-0.5 text-[12px] text-[color:var(--ink-3)]">{row.original.note}</div>}
        </div>
      );
    },
  },
  {
    id: "how",
    header: "How it got in",
    enableGlobalFilter: false,
    accessorFn: (r) => r.record.status,
    cell: ({ row }) => {
      const r = row.original.record;
      const chip = recordChip(r.status);
      return (
        <div>
          <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
          {r.status === "ticked" && r.tickedBy && (
            <div className="mt-1 text-[12px] text-[color:var(--ink-3)]">by {r.tickedBy}</div>
          )}
        </div>
      );
    },
  },
  {
    id: "photo",
    header: "Photo",
    enableGlobalFilter: false,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.record.imageUrl ? (
        <a
          href={row.original.record.imageUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-[color:var(--primary-ink)] underline-offset-2 hover:underline focus-visible:underline"
        >
          Photo
        </a>
      ) : (
        <span className="text-[color:var(--ink-3)]">-</span>
      ),
  },
];

export function DocketsTable({ rows }: { rows: DocketRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Search by docket or supplier"
      emptyText="No dockets have entered the ledger yet."
      initialSort={[{ id: "date", desc: true }]}
      rowHref={(row) => `/queue/${row.record.id}`}
    />
  );
}
