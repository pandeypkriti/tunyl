"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PageHeader, FieldGroup } from "@/components/app/page-header";
import { Stepper, type Step } from "@/components/app/stepper";
import { StatusChip, type ChipTone } from "@/components/app/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { RecordRow, Material, Project, FieldState } from "@/db/schema";
import { findMaterial } from "@/lib/rules";
import { toContractUnits, fmt, fmtDate } from "@/lib/units";
import { approveQueueRecord, sendBackQueueRecord, holdQueueRecord } from "@/app/(office)/queue/actions";

const SOURCE_WORDS: Record<RecordRow["source"], string> = {
  photo: "phone photo",
  email: "email",
  feed: "haulier's app",
  whatsapp: "WhatsApp",
  example: "example data",
};

const FIELD_CHIP: Record<FieldState, { tone: ChipTone; label: string }> = {
  clear: { tone: "success", label: "Read ok" },
  check: { tone: "warn", label: "Check" },
  unreadable: { tone: "danger", label: "Unreadable" },
  neutral: { tone: "neutral", label: "Derived" },
};

const UNIT_OPTIONS = ["m³", "t", "loads", "L", "each", ""];

function approveLabelFor(type: RecordRow["type"], convertedQty: number, unit: string): string {
  switch (type) {
    case "docket": return `Add ${fmt(convertedQty, 2)} ${unit} to the ledger`;
    case "invoice": return "Approve matched loads";
    case "instruction": return "Log it and raise a variation";
    default: return "Pair the loads";
  }
}

function stepsFor(record: RecordRow): Step[] {
  const matched = record.status === "rule";
  const waitStep: Step = matched
    ? { label: "Matched by rule", state: "done" }
    : {
        label: "Waiting for a person",
        state: record.status === "held" ? "blocked" : record.status === "waiting" || record.status === "sent_back" ? "current" : "done",
      };
  return [
    { label: "Sent in", state: "done" },
    { label: "Read", state: "done" },
    waitStep,
    { label: "Ticked", state: record.status === "ticked" || record.status === "approved" || record.status === "logged" ? "done" : "todo" },
    { label: "In ledger", state: record.qtyContract != null ? "done" : "todo" },
    { label: "Claimed", state: "todo" },
  ];
}

function fmtWhen(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function finishedLine(record: RecordRow): string {
  if (record.status === "rule") return "Matched by rule";
  const who = record.tickedBy || "the office";
  const when = record.tickedAt ? ` on ${fmtWhen(record.tickedAt)}` : "";
  if (record.status === "sent_back") return `Sent back by ${who}${when}`;
  return `Ticked by ${who}${when}`;
}

/** A label + editable value row, styled to match FieldGroup but with a focus-within ring for its input. */
function EditableRow({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-[color:var(--ink-2)]">{label}</label>
      <div className="flex items-center gap-2 rounded-md border border-[color:var(--border-strong)] bg-white px-3 py-1.5 transition-colors focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--primary-soft)]">
        {children}
      </div>
    </div>
  );
}

export function RecordView({ record, project, materials }: { record: RecordRow; project: Project; materials: Material[] }) {
  const router = useRouter();
  const isEditable = record.status === "waiting" || record.status === "held";

  const [qty, setQty] = useState<number>(record.qty ?? 0);
  const [unit, setUnit] = useState<string>(record.unit || "");
  const [fieldValues, setFieldValues] = useState<string[]>(() => record.fields.map((f) => f.value));
  const [ticked, setTicked] = useState(false);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState("");

  const material = record.materialId
    ? materials.find((m) => m.id === record.materialId) ?? null
    : findMaterial(materials, record.materialText);

  const conv = useMemo(
    () => (material && qty > 0 ? toContractUnits(qty, unit, material.unit, material.tPerM3) : null),
    [material, qty, unit],
  );

  const unitLabel = material?.unit ?? unit ?? "units";
  const approveLabel = approveLabelFor(record.type, conv ? conv.qty : qty, unitLabel);
  const qtyValid = qty > 0;
  const canApprove = isEditable && ticked && qtyValid && !pending;

  function updateField(i: number, value: string) {
    setFieldValues((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }

  function onApprove() {
    if (!qtyValid) return;
    setActionError("");
    startTransition(async () => {
      try {
        await approveQueueRecord(record.id, qty, unit);
        router.push(`/queue?done=${record.id}`);
      } catch {
        setActionError("Could not add this to the ledger. Try again.");
      }
    });
  }
  function onSendBack() {
    setActionError("");
    startTransition(async () => {
      try {
        await sendBackQueueRecord(record.id);
        router.push(`/queue?back=${record.id}`);
      } catch {
        setActionError("Could not send this back. Try again.");
      }
    });
  }
  function onHold() {
    setActionError("");
    startTransition(async () => {
      try {
        await holdQueueRecord(record.id);
        router.push(`/queue?held=${record.id}`);
      } catch {
        setActionError("Could not hold this record. Try again.");
      }
    });
  }

  return (
    <div>
      <PageHeader
        meta={`Sent in by ${record.handedBy || "the site"} · ${record.date ? fmtDate(record.date) : "no date"} · ${SOURCE_WORDS[record.source] ?? record.source}`}
        title={record.title || "Untitled record"}
        description={
          <>
            Filed against{" "}
            <Link href={`/projects/${project.slug}`} className="font-medium text-[color:var(--primary)] hover:underline focus-visible:underline">
              {project.name}
            </Link>
            .
          </>
        }
        actions={
          isEditable ? (
            <div className="inline-flex rounded-lg shadow-[var(--shadow)]">
              <Button
                type="button"
                onClick={onApprove}
                disabled={!canApprove}
                className="rounded-r-none bg-[color:var(--success)] text-white hover:bg-[color:var(--success)]/90 disabled:opacity-50"
              >
                {pending ? "Working…" : approveLabel}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={pending}
                  render={
                    <Button
                      type="button"
                      aria-label="More actions"
                      className="rounded-l-none border-l border-white/30 bg-[color:var(--success)] px-2 text-white hover:bg-[color:var(--success)]/90 disabled:opacity-50"
                    />
                  }
                >
                  <ChevronDown className="size-4" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onSendBack} disabled={pending}>Send back to site</DropdownMenuItem>
                  {record.type === "invoice" && (
                    <DropdownMenuItem onClick={onHold} disabled={pending}>Hold the unmatched loads</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <span className="text-[13px] text-[color:var(--ink-3)]">{finishedLine(record)}</span>
          )
        }
      >
        <Stepper steps={stepsFor(record)} />
      </PageHeader>

      {actionError && <p className="mb-4 text-[13px] font-medium text-[color:var(--danger-ink)]">{actionError}</p>}

      <div className="grid gap-6 min-[1000px]:grid-cols-[380px_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <div className="tag">The paper</div>
          {record.imageUrl ? (
            <div className="doc">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={record.imageUrl} alt={record.title || "The docket"} />
              <div className="cap">{record.title}{record.supplier ? `, ${record.supplier}` : ""}</div>
            </div>
          ) : (
            <div className="card">
              <p className="text-[12px] text-[color:var(--ink-3)]">{record.stored || "No file on record"}</p>
              <p className="mt-1 text-[15px] font-semibold">{record.title || "Untitled record"}</p>
              <dl className="mt-3 grid gap-2 text-[13px]">
                <div className="flex justify-between gap-3"><dt className="text-[color:var(--ink-3)]">Supplier</dt><dd>{record.supplier || "-"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[color:var(--ink-3)]">Reference</dt><dd>{record.ref || "-"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[color:var(--ink-3)]">Date</dt><dd>{record.date ? fmtDate(record.date) : "-"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[color:var(--ink-3)]">Handed by</dt><dd className="text-right">{record.handedBy || "-"}</dd></div>
              </dl>
            </div>
          )}

          {record.flags.length > 0 && (
            <ul className="flags">
              {record.flags.map((f, i) => (
                <li key={i} className={f.level === "crit" ? "crit" : undefined}>{f.text}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid content-start gap-4">
          <div className="tag">What was read</div>
          {record.fields.length === 0 && <p className="text-[13px] text-[color:var(--ink-3)]">No fields were read for this record.</p>}

          {record.fields.map((f, i) => {
            const chip = FIELD_CHIP[f.state];

            if (!isEditable) {
              return (
                <FieldGroup key={i} label={f.label}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={f.value ? undefined : "italic text-[color:var(--ink-3)]"}>{f.value || "Left blank on purpose"}</span>
                    <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
                  </div>
                </FieldGroup>
              );
            }

            if (f.label === "Quantity") {
              return (
                <EditableRow key={i} label={f.label} htmlFor={`qty-${record.id}`}>
                  <Input
                    id={`qty-${record.id}`}
                    type="number"
                    min="0"
                    step="any"
                    value={qty}
                    onChange={(e) => { const v = parseFloat(e.target.value); setQty(Number.isFinite(v) ? v : 0); }}
                    className="h-7 flex-1 border-0 bg-transparent p-0 text-[14px] tabular-nums shadow-none focus-visible:ring-0"
                  />
                  <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
                </EditableRow>
              );
            }

            if (f.label === "Unit") {
              return (
                <EditableRow key={i} label={f.label} htmlFor={`unit-${record.id}`}>
                  <select
                    id={`unit-${record.id}`}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="h-7 w-full flex-1 border-0 bg-transparent p-0 text-[14px] outline-none"
                  >
                    {UNIT_OPTIONS.map((u) => <option key={u || "blank"} value={u}>{u || "blank"}</option>)}
                  </select>
                  <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
                </EditableRow>
              );
            }

            return (
              <EditableRow key={i} label={f.label} htmlFor={`f-${record.id}-${i}`}>
                <Input
                  id={`f-${record.id}-${i}`}
                  value={fieldValues[i] ?? f.value}
                  onChange={(e) => updateField(i, e.target.value)}
                  placeholder={f.value ? undefined : "left blank on purpose"}
                  className="h-7 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                />
                <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
              </EditableRow>
            );
          })}

          {material && conv?.note && (
            <p className="text-[13px] text-[color:var(--ink-3)]">{fmt(qty, 2)} {unit} = {conv.note}</p>
          )}

          {isEditable && !qtyValid && (
            <p className="text-[13px] font-medium text-[color:var(--danger-ink)]">Enter a quantity above zero before approving.</p>
          )}

          {isEditable && (
            <div className="flex items-center gap-2.5 border-t border-[color:var(--border)] pt-4">
              <Checkbox id={`tick-${record.id}`} checked={ticked} onCheckedChange={(v) => setTicked(v === true)} disabled={pending} />
              <Label htmlFor={`tick-${record.id}`} className="cursor-pointer text-[14px] font-normal">Checked against the paper</Label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
