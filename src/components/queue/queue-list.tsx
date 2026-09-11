import Link from "next/link";
import type { RecordRow } from "@/db/schema";

const TYPE_LABEL: Record<RecordRow["type"], string> = {
  docket: "Docket",
  invoice: "Invoice",
  instruction: "Instruction",
  feed: "Feed",
};

function firstSentence(text: string): string {
  const idx = text.search(/[.!?]\s/);
  return idx === -1 ? text : text.slice(0, idx + 1);
}

function shorten(text: string, max = 64): string {
  const first = firstSentence(text || "");
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

export function chipFor(r: RecordRow): { cls: string; text: string } {
  if (r.status === "held") return { cls: "hold", text: "Held" };
  if (r.type !== "feed") {
    const toCheck = r.fields.filter((f) => f.state === "check" || f.state === "unreadable").length;
    if (toCheck > 0) return { cls: "check", text: `${toCheck} field${toCheck === 1 ? "" : "s"} to check` };
  }
  return { cls: "check", text: shorten(r.why || "Waiting on the office") };
}

export function QueueList({
  records,
  projectName,
  selectedId,
}: {
  records: RecordRow[];
  projectName: (projectId: string) => string;
  selectedId: string;
}) {
  return (
    <div className="grid gap-2 self-start" aria-label="Waiting and held records">
      {records.map((r) => {
        const active = r.id === selectedId;
        const chip = chipFor(r);
        return (
          <Link
            key={r.id}
            href={`/queue?id=${r.id}`}
            aria-current={active ? "true" : undefined}
            className={`block rounded-[12px] border px-3.5 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)] ${
              active
                ? "border-[color:var(--accent-hue)] bg-[color:var(--tint)]"
                : "border-[color:var(--border)] bg-white hover:border-[#C9C4BC]"
            }`}
          >
            <b className="block text-[14px]">{TYPE_LABEL[r.type] ?? r.type}</b>
            <span className="mt-0.5 block text-[13px] text-[color:var(--ink2)]">
              {r.supplier}{r.ref ? `, ${r.ref}` : ""}
            </span>
            <span className="block text-[13px] text-[color:var(--ink2)]">{projectName(r.projectId)}</span>
            <span className={`chip ${chip.cls} mt-2`}>{chip.text}</span>
          </Link>
        );
      })}
    </div>
  );
}
