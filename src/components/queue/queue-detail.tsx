"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { RecordRow, Material, FieldState } from "@/db/schema";
import { findMaterial } from "@/lib/rules";
import { toContractUnits, fmt, fmtDate } from "@/lib/units";
import { approveQueueRecord, sendBackQueueRecord } from "@/app/(office)/queue/actions";

const CHIP_TEXT: Record<FieldState, string> = {
  clear: "Read ok",
  check: "Check",
  unreadable: "Unreadable",
  neutral: "Derived",
};

function approveLabelFor(type: RecordRow["type"], qty: number, unit: string): string {
  switch (type) {
    case "docket": return `Add ${fmt(qty, 2)} ${unit} to the ledger`;
    case "invoice": return "Approve matched loads";
    case "instruction": return "Log it and raise a variation";
    default: return "Pair the loads";
  }
}

export function QueueDetail({ record, materials }: { record: RecordRow; materials: Material[] }) {
  const router = useRouter();
  const [qty, setQty] = useState<number>(record.qty ?? 0);
  const [ticked, setTicked] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const material = record.materialId
    ? materials.find((m) => m.id === record.materialId) ?? null
    : findMaterial(materials, record.materialText);

  const converted = material ? toContractUnits(qty, record.unit, material.unit, material.tPerM3) : null;
  const unitLabel = material?.unit ?? record.unit ?? "units";
  const approveLabel = approveLabelFor(record.type, converted ? converted.qty : qty, unitLabel);

  const quantityFieldIndex = record.fields.findIndex((f) => f.label.toLowerCase() === "quantity");
  const canApprove = ticked && qty > 0 && !pending;

  function onQuantityChange(raw: string) {
    const parsed = parseFloat(raw.replace(/[^0-9.]/g, ""));
    setQty(Number.isFinite(parsed) ? parsed : 0);
  }

  function onApprove() {
    if (!(qty > 0)) { setError("Enter a quantity greater than zero before approving."); return; }
    setError("");
    startTransition(async () => {
      await approveQueueRecord(record.id, qty, record.unit);
      router.push("/queue");
    });
  }

  function onSendBack() {
    setError("");
    startTransition(async () => {
      await sendBackQueueRecord(record.id);
      router.push("/queue");
    });
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[232px_minmax(0,1fr)]">
        {record.imageUrl ? (
          <div className="doc">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={record.imageUrl} alt={record.title || "The docket"} />
            <div className="cap">{record.title}{record.supplier ? `, ${record.supplier}` : ""}</div>
          </div>
        ) : (
          <div className="card self-start !p-4">
            <p className="text-[12px] text-[color:var(--ink2)]">{record.stored || "No photo on file"}</p>
            <p className="mt-1 text-[15px] font-semibold">{record.title || "Untitled record"}</p>
            <dl className="mt-3 grid gap-2 text-[13px]">
              <div className="flex justify-between gap-3"><dt className="text-[color:var(--ink2)]">Supplier</dt><dd>{record.supplier || "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[color:var(--ink2)]">Reference</dt><dd>{record.ref || "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[color:var(--ink2)]">Date</dt><dd>{record.date ? fmtDate(record.date) : "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[color:var(--ink2)]">Handed by</dt><dd className="text-right">{record.handedBy || "-"}</dd></div>
            </dl>
          </div>
        )}

        <div>
          <div className="fields">
            {record.fields.length === 0 && (
              <p className="text-[13px] text-[color:var(--ink2)]">No fields were read for this record.</p>
            )}
            {record.fields.map((f, i) => (
              <div className="field" key={`${record.id}-${i}`}>
                <label htmlFor={`f-${record.id}-${i}`}>{f.label}</label>
                <Input
                  id={`f-${record.id}-${i}`}
                  defaultValue={f.value}
                  placeholder={f.value ? undefined : "left blank on purpose"}
                  onChange={i === quantityFieldIndex ? (e) => onQuantityChange(e.target.value) : undefined}
                />
                <span className={`chip ${f.state}`}>{CHIP_TEXT[f.state]}</span>
              </div>
            ))}
          </div>

          {record.flags.length > 0 && (
            <ul className="flags">
              {record.flags.map((f, i) => (
                <li key={i} className={f.level === "crit" ? "crit" : undefined}>{f.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && <p className="text-[13px] font-medium text-[color:var(--crit-ink)]">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-[color:var(--border)] pt-4">
        <div className="flex flex-1 basis-[260px] items-center gap-2.5">
          <Checkbox id={`tick-${record.id}`} checked={ticked} onCheckedChange={(v) => setTicked(v === true)} disabled={pending} />
          <Label htmlFor={`tick-${record.id}`} className="cursor-pointer text-[15px] font-normal">Checked against the paper</Label>
        </div>
        <Button type="button" onClick={onApprove} disabled={!canApprove}>
          {pending ? "Working…" : approveLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onSendBack} disabled={pending}>
          Send back to site
        </Button>
      </div>
    </div>
  );
}
