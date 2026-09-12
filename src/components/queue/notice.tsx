import Link from "next/link";
import { CheckCircle2, Undo2, PauseCircle } from "lucide-react";
import type { RecordRow } from "@/db/schema";

export type NoticeKind = "done" | "back" | "held";

const TYPE_LABEL: Record<RecordRow["type"], string> = {
  docket: "Docket",
  invoice: "Tax invoice",
  instruction: "Site instruction",
  feed: "Haulage docket",
};

const DONE_PHRASE: Record<RecordRow["type"], string> = {
  docket: "added to the ledger",
  feed: "paired and added to the ledger",
  invoice: "approved",
  instruction: "logged, variation raised",
};

const ICON = { done: CheckCircle2, back: Undo2, held: PauseCircle };
const TONE_CLASS: Record<NoticeKind, string> = {
  done: "bg-[color:var(--success-soft)] text-[color:var(--success-ink)]",
  back: "bg-[color:var(--surface-2)] text-[color:var(--ink-2)]",
  held: "bg-[color:var(--danger-soft)] text-[color:var(--danger-ink)]",
};

/** The one-line notice on /queue after leaving a record: approved, sent back, or held. */
export function Notice({ kind, record }: { kind: NoticeKind; record: RecordRow }) {
  const Icon = ICON[kind];
  const label = `${TYPE_LABEL[record.type]} ${record.ref || record.title}`;
  const phrase = kind === "done" ? DONE_PHRASE[record.type] : kind === "back" ? "sent back to site" : "held back for the unmatched loads";
  return (
    <div role="status" className={`mb-5 flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] ${TONE_CLASS[kind]}`}>
      <Icon className="size-4 flex-none" aria-hidden />
      <p>
        <Link href={`/queue/${record.id}`} className="font-medium underline-offset-2 hover:underline focus-visible:underline">
          {label}
        </Link>{" "}
        {phrase}.
      </p>
    </div>
  );
}
