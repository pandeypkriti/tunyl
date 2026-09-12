"use client";
// Column defs live in a client component, per the DataTable contract.
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/app/data-table";
import { StatusChip, type ChipTone } from "@/components/app/status-chip";
import { fmtDate } from "@/lib/units";
import type { Wait } from "@/db/schema";

export type WaitRow = Wait & { day: number; chaserHref: string };

function statusFor(day: number, kpi: number): { tone: ChipTone; text: string } {
  if (day > kpi) {
    const over = day - kpi;
    return { tone: "danger", text: `Overdue ${over} day${over === 1 ? "" : "s"}` };
  }
  if (day === kpi) return { tone: "warn", text: "Due today" };
  return { tone: "success", text: "On track" };
}

const columns: ColumnDef<WaitRow, unknown>[] = [
  {
    accessorKey: "what",
    header: "Waiting for",
    cell: ({ row }) => <span className="font-medium text-[color:var(--ink)]">{row.original.what}</span>,
  },
  { accessorKey: "fromParty", header: "From" },
  {
    id: "job",
    header: "Job",
    accessorFn: (r) => r.job,
    cell: ({ row }) => (
      <div>
        {row.original.job}
        <div className="mt-0.5 text-[12px] text-[color:var(--ink-3)]">{row.original.jobNo}, asked {fmtDate(row.original.askedOn)}</div>
      </div>
    ),
  },
  {
    accessorKey: "kpiDays",
    header: "KPI",
    meta: { align: "right" },
    cell: ({ row }) => `${row.original.kpiDays} days`,
  },
  { accessorKey: "day", header: "Day", meta: { align: "right" } },
  {
    id: "status",
    header: "Status",
    accessorFn: (r) => statusFor(r.day, r.kpiDays).text,
    cell: ({ row }) => {
      const s = statusFor(row.original.day, row.original.kpiDays);
      return <StatusChip tone={s.tone}>{s.text}</StatusChip>;
    },
  },
  {
    id: "chaser",
    header: "",
    cell: ({ row }) => (
      <a
        href={row.original.chaserHref}
        className="font-medium text-[color:var(--primary-ink)] underline-offset-2 hover:underline focus-visible:underline"
      >
        Draft chaser
      </a>
    ),
  },
];

export function WaitsTable({ rows }: { rows: WaitRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Search what's waiting"
      emptyText="Nothing is being waited on right now."
      initialSort={[{ id: "day", desc: true }]}
    />
  );
}
