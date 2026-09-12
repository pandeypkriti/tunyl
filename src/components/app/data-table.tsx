"use client";
"use no memo";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

/**
 * Sortable, searchable table on TanStack Table. Pass `rowHref` to make rows open a record.
 * Right-align numbers with meta: { align: "right" } on the column def.
 */
export function DataTable<T>({ columns, data, searchPlaceholder = "Search", filter, rowHref, emptyText = "Nothing to show.", initialSort, toolbar, dense }: {
  columns: ColumnDef<T, unknown>[]; data: T[]; searchPlaceholder?: string;
  filter?: { column: string; label: string; options: FilterOption[] };
  rowHref?: (row: T) => string | undefined; emptyText?: string; initialSort?: SortingState; toolbar?: React.ReactNode; dense?: boolean;
}) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>(initialSort ?? []);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [filterValue, setFilterValue] = React.useState("");
  const columnFilters = React.useMemo(() => (filter && filterValue ? [{ id: filter.column, value: filterValue }] : []), [filter, filterValue]);
  const cols = React.useMemo(() => columns.map((c) => ((c.meta as { align?: string } | undefined)?.align === "right" && !c.sortingFn ? { ...c, sortingFn: "basic" as const } : c)), [columns]);
  const table = useReactTable({
    data, columns: cols, state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter, autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
  });
  const rows = table.getRowModel().rows;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[color:var(--ink-3)]" aria-hidden />
          <input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder}
            className="h-9 w-[240px] max-w-full rounded-md border border-[color:var(--border-strong)] bg-white pl-8 pr-3 text-[13px] outline-none placeholder:text-[#98A2B3] focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary-soft)]" />
        </label>
        {filter && (
          <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)} aria-label={filter.label}
            className="h-9 rounded-md border border-[color:var(--border-strong)] bg-white px-2.5 text-[13px] outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary-soft)]">
            <option value="">{filter.label}: all</option>
            {filter.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        <div className="ml-auto flex items-center gap-2 text-[12px] text-[color:var(--ink-3)]">{toolbar}<span>{rows.length} {rows.length === 1 ? "row" : "rows"}</span></div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[color:var(--border)] bg-white">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const align = (h.column.columnDef.meta as { align?: string } | undefined)?.align;
                  const sortable = h.column.getCanSort();
                  const dir = h.column.getIsSorted();
                  return (
                    <th key={h.id} className={cn("sticky top-0 border-b border-[color:var(--border)] bg-white px-3 py-2.5 text-left text-[12px] font-medium text-[color:var(--ink-3)]", align === "right" && "text-right")}>
                      {h.isPlaceholder ? null : sortable ? (
                        <button type="button" onClick={h.column.getToggleSortingHandler()} className={cn("inline-flex items-center gap-1 rounded hover:text-[color:var(--ink)] focus-visible:outline-2", align === "right" && "flex-row-reverse")}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === "asc" ? <ArrowUp className="size-3" /> : dir === "desc" ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-50" />}
                        </button>
                      ) : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-[13px] text-[color:var(--ink-3)]">{emptyText}</td></tr>}
            {rows.map((r) => {
              const href = rowHref?.(r.original);
              return (
                <tr key={r.id} onClick={href ? () => router.push(href) : undefined} tabIndex={href ? 0 : undefined} onKeyDown={href ? (e) => { if (e.key === "Enter") router.push(href); } : undefined}
                  className={cn("border-b border-[color:var(--border)] last:border-b-0", href && "cursor-pointer hover:bg-[color:var(--surface-2)] focus-visible:bg-[color:var(--surface-2)] focus-visible:outline-none")}>
                  {r.getVisibleCells().map((c) => {
                    const align = (c.column.columnDef.meta as { align?: string } | undefined)?.align;
                    return <td key={c.id} className={cn("px-3 align-middle", dense ? "py-1.5" : "py-2.5", align === "right" && "text-right tabular-nums")}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
