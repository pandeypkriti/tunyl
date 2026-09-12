"use client";
// Column defs live in a client component, per the DataTable contract.
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/app/data-table";
import { StatusChip, type ChipTone } from "@/components/app/status-chip";
import { fmt } from "@/lib/units";
import type { LedgerMaterial } from "@/lib/ledger";

const GAP_TONE: Record<LedgerMaterial["gap"]["kind"], ChipTone> = {
  hold: "danger",
  ok: "success",
  none: "neutral",
  done: "neutral",
};

const columns: ColumnDef<LedgerMaterial, unknown>[] = [
  {
    accessorKey: "name",
    header: "Material",
    cell: ({ row }) => <span className="font-medium text-[color:var(--ink)]">{row.original.name}</span>,
  },
  { accessorKey: "unit", header: "Unit" },
  { accessorKey: "ordered", header: "Ordered", meta: { align: "right" }, cell: ({ row }) => fmt(row.original.ordered) },
  { accessorKey: "delivered", header: "Delivered", meta: { align: "right" }, cell: ({ row }) => fmt(row.original.delivered, 2) },
  { accessorKey: "invoiced", header: "Invoiced", meta: { align: "right" }, cell: ({ row }) => fmt(row.original.invoiced, 2) },
  { accessorKey: "claimed", header: "Claimed", meta: { align: "right" }, cell: ({ row }) => fmt(row.original.claimed, 2) },
  {
    id: "gap",
    header: "Gap",
    accessorFn: (m) => m.gap.text,
    cell: ({ row }) => {
      const gap = row.original.gap;
      return <StatusChip tone={GAP_TONE[gap.kind]}>{gap.text}</StatusChip>;
    },
  },
];

export function MaterialsTable({ materials }: { materials: LedgerMaterial[] }) {
  return (
    <DataTable
      columns={columns}
      data={materials}
      searchPlaceholder="Search materials"
      emptyText="No materials on this project yet."
    />
  );
}
