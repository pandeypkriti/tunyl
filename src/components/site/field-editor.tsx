"use client";

import { Input } from "@/components/ui/input";
import { FieldGroup } from "@/components/app/page-header";
import { StatusChip, type ChipTone } from "@/components/app/status-chip";
import { cn } from "@/lib/utils";
import type { ReadField, Flag, FieldState } from "@/db/schema";

// Same order and labels as FIELD_LABELS in src/lib/reader.ts. Kept as plain
// data here (not imported from reader.ts) so this client bundle never pulls
// in the reader's server-only provider code.
export const FIELD_LABEL_LIST = [
  "Supplier",
  "Docket number",
  "Date",
  "Material",
  "Quantity",
  "Unit",
  "Truck or rego",
  "Delivered to",
  "Received by",
  "Purchase order",
] as const;

export function blankFields(): ReadField[] {
  return FIELD_LABEL_LIST.map((label) => ({ label, value: "", state: "unreadable" as const }));
}

const UNIT_VALUES = ["m³", "t", "loads", "L", "each"];

// The input sits inside the FieldGroup's own bordered box, so it carries no
// border or background of its own; only the focus ring shows it is active.
const CONTROL_CLASS =
  "h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] text-[color:var(--ink)] shadow-none " +
  "placeholder:italic placeholder:text-[#98A2B3] focus-visible:ring-0 disabled:opacity-60 disabled:cursor-not-allowed";

const SELECT_CLASS =
  "h-7 min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[14px] text-[color:var(--ink)] outline-none " +
  "focus-visible:ring-0 disabled:opacity-60 disabled:cursor-not-allowed";

function chipFor(state: FieldState): { tone: ChipTone; label: string } {
  if (state === "clear") return { tone: "success", label: "read ok" };
  if (state === "check") return { tone: "warn", label: "check" };
  if (state === "unreadable") return { tone: "danger", label: "unreadable" };
  return { tone: "neutral", label: "not applicable" };
}

function fieldId(label: string): string {
  return "f-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function FieldEditor({
  fields,
  flags,
  materialNames,
  disabled,
  onChange,
}: {
  fields: ReadField[];
  flags: Flag[];
  materialNames: string[];
  disabled?: boolean;
  onChange: (label: string, value: string) => void;
}) {
  return (
    <div>
      <div className="grid gap-3">
        {fields.map((f) => {
          const id = fieldId(f.label);
          const chip = chipFor(f.state);
          return (
            <FieldGroup key={f.label} label={f.label}>
              <div className="flex items-center gap-2">
                {f.label === "Unit" ? (
                  <select
                    id={id}
                    aria-label={f.label}
                    className={SELECT_CLASS}
                    value={UNIT_VALUES.includes(f.value) ? f.value : ""}
                    onChange={(e) => onChange(f.label, e.target.value)}
                    disabled={disabled}
                  >
                    {UNIT_VALUES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="">(blank)</option>
                  </select>
                ) : f.label === "Material" ? (
                  <Input
                    id={id}
                    aria-label={f.label}
                    className={CONTROL_CLASS}
                    list="tunyl-materials"
                    value={f.value}
                    placeholder={f.value ? undefined : "left blank on purpose"}
                    disabled={disabled}
                    onChange={(e) => onChange(f.label, e.target.value)}
                  />
                ) : f.label === "Quantity" ? (
                  <Input
                    id={id}
                    aria-label={f.label}
                    className={CONTROL_CLASS}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={f.value}
                    disabled={disabled}
                    onChange={(e) => onChange(f.label, e.target.value)}
                  />
                ) : f.label === "Date" ? (
                  <Input
                    id={id}
                    aria-label={f.label}
                    className={CONTROL_CLASS}
                    type="date"
                    value={f.value}
                    disabled={disabled}
                    onChange={(e) => onChange(f.label, e.target.value)}
                  />
                ) : (
                  <Input
                    id={id}
                    aria-label={f.label}
                    className={CONTROL_CLASS}
                    type="text"
                    value={f.value}
                    placeholder={f.value ? undefined : "left blank on purpose"}
                    disabled={disabled}
                    onChange={(e) => onChange(f.label, e.target.value)}
                  />
                )}
                <StatusChip tone={chip.tone} className="shrink-0">{chip.label}</StatusChip>
              </div>
            </FieldGroup>
          );
        })}
      </div>
      <datalist id="tunyl-materials">
        {materialNames.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      {flags.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {flags.map((fl, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-[13px]",
                fl.level === "crit"
                  ? "bg-[color:var(--danger-soft)] text-[color:var(--danger-ink)]"
                  : "bg-[color:var(--warn-soft)] text-[color:var(--warn-ink)]",
              )}
            >
              <span aria-hidden className="mt-1.5 size-1.5 flex-none rounded-full bg-current" />
              {fl.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
