"use client";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/app/data-table";
import { StatusChip, claimChip } from "@/components/app/status-chip";
import { Money, Qty } from "@/components/app/money";

export type ProjectRow = {
  slug: string;
  name: string;
  client: string;
  clientPlatform: string;
  material: { name: string; unit: string; delivered: number; ordered: number; pct: number } | null;
  needsPerson: number;
  readyToClaim: number;
  latestClaim: { number: number; status: string } | null;
};

const columns: ColumnDef<ProjectRow, unknown>[] = [
  {
    id: "project",
    accessorKey: "name",
    header: "Project",
    cell: ({ row }) => (
      <Link
        href={`/projects/${row.original.slug}`}
        onClick={(e) => e.stopPropagation()}
        className="font-medium text-[color:var(--ink)] hover:underline focus-visible:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "client",
    accessorFn: (row) => (row.clientPlatform ? `${row.client}, ${row.clientPlatform}` : row.client),
    header: "Client and platform",
  },
  {
    id: "delivered",
    accessorFn: (row) => row.material?.pct ?? -1,
    header: "Delivered against ordered",
    cell: ({ row }) => {
      const m = row.original.material;
      if (!m) return <span className="text-[color:var(--ink-3)]">No materials on this project</span>;
      return (
        <div className="min-w-[160px]">
          <div className="text-[12px] text-[color:var(--ink-3)]">
            <Qty value={m.delivered} /> of <Qty value={m.ordered} unit={m.unit} />
          </div>
          <div className="bar mt-1.5" aria-hidden="true"><i style={{ width: `${m.pct}%` }} /></div>
        </div>
      );
    },
  },
  {
    id: "needsPerson",
    accessorKey: "needsPerson",
    header: "Needs a person",
    cell: ({ getValue }) => {
      const n = getValue() as number;
      return n > 0 ? <StatusChip tone="warn">{n}</StatusChip> : <StatusChip tone="neutral">0</StatusChip>;
    },
  },
  {
    id: "readyToClaim",
    accessorKey: "readyToClaim",
    header: "Ready to claim",
    meta: { align: "right" },
    cell: ({ getValue }) => <Money value={getValue() as number} tone="positive" />,
  },
  {
    id: "latestClaim",
    accessorFn: (row) => row.latestClaim?.number ?? -1,
    header: "Latest claim",
    cell: ({ row }) => {
      const c = row.original.latestClaim;
      if (!c) return <span className="text-[color:var(--ink-3)]">No claims yet</span>;
      const chip = claimChip(c.status);
      return (
        <div className="flex items-center gap-2">
          <span>Claim {c.number}</span>
          <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
        </div>
      );
    },
  },
];

export function ProjectsTable({ rows }: { rows: ProjectRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Search projects or clients"
      rowHref={(r) => `/projects/${r.slug}`}
      emptyText="No projects are set up yet."
      initialSort={[{ id: "project", desc: false }]}
    />
  );
}
