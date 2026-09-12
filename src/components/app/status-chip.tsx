import { cn } from "@/lib/utils";

export type ChipTone = "success" | "warn" | "danger" | "info" | "neutral" | "primary";
const tones: Record<ChipTone, string> = {
  success: "bg-[color:var(--success-soft)] text-[color:var(--success-ink)]",
  warn: "bg-[color:var(--warn-soft)] text-[color:var(--warn-ink)]",
  danger: "bg-[color:var(--danger-soft)] text-[color:var(--danger-ink)]",
  info: "bg-[color:var(--info-soft)] text-[color:var(--info-ink)]",
  neutral: "bg-[color:var(--surface-2)] text-[color:var(--ink-2)]",
  primary: "bg-[color:var(--primary-soft)] text-[color:var(--primary-ink)]",
};

export function StatusChip({ tone = "neutral", children, className, dot }: { tone?: ChipTone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium", tones[tone], className)}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Map a record status to a chip. */
export function recordChip(status: string): { tone: ChipTone; label: string } {
  switch (status) {
    case "rule": return { tone: "success", label: "By rule" };
    case "ticked": return { tone: "success", label: "Ticked" };
    case "approved": return { tone: "success", label: "Approved" };
    case "logged": return { tone: "success", label: "Logged" };
    case "waiting": return { tone: "warn", label: "Waiting" };
    case "held": return { tone: "danger", label: "Held" };
    case "sent_back": return { tone: "neutral", label: "Sent back" };
    default: return { tone: "neutral", label: status };
  }
}
export function claimChip(status: string): { tone: ChipTone; label: string } {
  switch (status) {
    case "draft": return { tone: "neutral", label: "Draft" };
    case "lodged": return { tone: "info", label: "Lodged" };
    case "certified": return { tone: "success", label: "Certified" };
    case "paid": return { tone: "success", label: "Paid" };
    default: return { tone: "neutral", label: status };
  }
}
