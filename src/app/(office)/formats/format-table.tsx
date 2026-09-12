"use client";
// Column defs live in a client component, per the DataTable contract.
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/app/data-table";
import { StatusChip, type ChipTone } from "@/components/app/status-chip";

export type MapStatus = "auto" | "check" | "missing";
export type MapRow = { ourField: string; theirField: string; status: MapStatus; note: string };

function statusChip(s: MapStatus): { tone: ChipTone; text: string } {
  if (s === "auto") return { tone: "success", text: "Auto" };
  if (s === "check") return { tone: "warn", text: "Check once" };
  return { tone: "danger", text: "No home" };
}

const columns: ColumnDef<MapRow, unknown>[] = [
  { accessorKey: "ourField", header: "Our field", cell: ({ row }) => <span className="font-medium text-[color:var(--ink)]">{row.original.ourField}</span> },
  { accessorKey: "theirField", header: "Their field" },
  {
    id: "status",
    header: "Status",
    accessorFn: (r) => statusChip(r.status).text,
    cell: ({ row }) => { const s = statusChip(row.original.status); return <StatusChip tone={s.tone}>{s.text}</StatusChip>; },
  },
  { accessorKey: "note", header: "Note", cell: ({ row }) => <span className="text-[color:var(--ink-3)]">{row.original.note}</span> },
];

export function FormatTable({ rows }: { rows: MapRow[] }) {
  return <DataTable columns={columns} data={rows} searchPlaceholder="Search fields" emptyText="No fields mapped yet." />;
}
