"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
const BLANK_UNIT = "__blank__";

const CONTROL_CLASS =
  "h-11 w-full rounded-lg border-[color:var(--input)] bg-[color:var(--row-alt)] px-3 text-[15px] text-[color:var(--ink)] " +
  "hover:border-[color:var(--ink2)] placeholder:italic placeholder:text-[#8A8F96] " +
  "focus-visible:border-[color:var(--accent-hue)] focus-visible:bg-[color:var(--surface)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--tint)]";

function chipLabel(state: FieldState): string {
  if (state === "clear") return "read ok";
  if (state === "check") return "check";
  if (state === "unreadable") return "unreadable";
  return "not applicable";
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
      <div className="fields">
        {fields.map((f) => {
          const id = fieldId(f.label);
          return (
            <div className="field" key={f.label}>
              <label htmlFor={id}>{f.label}</label>
              {f.label === "Unit" ? (
                <Select
                  value={UNIT_VALUES.includes(f.value) ? f.value : BLANK_UNIT}
                  onValueChange={(v) => onChange(f.label, !v || v === BLANK_UNIT ? "" : v)}
                  disabled={disabled}
                >
                  <SelectTrigger id={id} className={CONTROL_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_VALUES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                    <SelectItem value={BLANK_UNIT}>(blank)</SelectItem>
                  </SelectContent>
                </Select>
              ) : f.label === "Material" ? (
                <Input
                  id={id}
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
                  className={CONTROL_CLASS}
                  type="date"
                  value={f.value}
                  disabled={disabled}
                  onChange={(e) => onChange(f.label, e.target.value)}
                />
              ) : (
                <Input
                  id={id}
                  className={CONTROL_CLASS}
                  type="text"
                  value={f.value}
                  placeholder={f.value ? undefined : "left blank on purpose"}
                  disabled={disabled}
                  onChange={(e) => onChange(f.label, e.target.value)}
                />
              )}
              <span className={`chip ${f.state}`}>{chipLabel(f.state)}</span>
            </div>
          );
        })}
      </div>
      <datalist id="tunyl-materials">
        {materialNames.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      {flags.length > 0 && (
        <ul className="flags">
          {flags.map((fl, i) => (
            <li key={i} className={fl.level === "crit" ? "crit" : undefined}>
              {fl.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
