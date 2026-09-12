"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/app/data-table";
import { StatusChip, claimChip } from "@/components/app/status-chip";
import { Money } from "@/components/app/money";
import { fmtDate } from "@/lib/units";

export type ClaimTableRow = {
  id: string;
  number: number;
  projectName: string;
  client: string;
  total: number;
  status: string;
  lodgedAt: string;
  scheduleText: string;
  paymentText: string;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "lodged", label: "Lodged" },
  { value: "certified", label: "Certified" },
  { value: "paid", label: "Paid" },
];

const columns: ColumnDef<ClaimTableRow, unknown>[] = [
  {
    id: "claim",
    accessorFn: (row) => `${row.number} ${row.projectName}`,
    header: "Claim",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-[color:var(--ink)]">Claim {row.original.number}</div>
        <div className="text-[12px] text-[color:var(--ink-3)]">{row.original.projectName}</div>
      </div>
    ),
  },
  { id: "builder", accessorKey: "client", header: "Builder" },
  {
    id: "amount",
    accessorKey: "total",
    header: "Amount",
    meta: { align: "right" },
    cell: ({ getValue }) => <Money value={getValue() as number} tone="positive" />,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const chip = claimChip(getValue() as string);
      return <StatusChip tone={chip.tone}>{chip.label}</StatusChip>;
    },
  },
  {
    id: "lodged",
    accessorKey: "lodgedAt",
    header: "Lodged",
    cell: ({ getValue }) => {
      const v = getValue() as string;
      return v ? <span>{fmtDate(v)}</span> : <span className="text-[color:var(--ink-3)]">Not yet lodged</span>;
    },
  },
  { id: "schedule", accessorKey: "scheduleText", header: "Payment schedule", enableSorting: false },
  { id: "payment", accessorKey: "paymentText", header: "Payment", enableSorting: false },
];

export function ClaimsTable({ rows }: { rows: ClaimTableRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Search claims or builders"
      filter={{ column: "status", label: "Status", options: STATUS_OPTIONS }}
      rowHref={(r) => `/claims/${r.id}`}
      emptyText="No claims yet."
      initialSort={[{ id: "claim", desc: true }]}
    />
  );
}
