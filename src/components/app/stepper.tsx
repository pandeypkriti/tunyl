import { Check, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepState = "done" | "current" | "todo" | "blocked";
export type Step = { label: string; state: StepState; hint?: string };

const tone: Record<StepState, string> = {
  done: "border-[color:var(--success)] bg-[color:var(--success-soft)] text-[color:var(--success-ink)]",
  current: "border-[color:var(--warn)] bg-[color:var(--warn-soft)] text-[color:var(--warn-ink)]",
  todo: "border-[color:var(--border)] bg-white text-[color:var(--ink-3)]",
  blocked: "border-[color:var(--danger)] bg-[color:var(--danger-soft)] text-[color:var(--danger-ink)]",
};

/** Where a docket or a claim sits in its lifecycle. Green done, amber now, grey next, red blocked. */
export function Stepper({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-y-2", className)} aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center">
          <span title={s.hint} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium", tone[s.state])} aria-current={s.state === "current" ? "step" : undefined}>
            {s.state === "done" && <Check className="size-3.5" aria-hidden />}
            {s.state === "current" && <Clock className="size-3.5" aria-hidden />}
            {s.state === "blocked" && <AlertCircle className="size-3.5" aria-hidden />}
            {s.label}
          </span>
          {i < steps.length - 1 && <span aria-hidden className={cn("mx-1 h-px w-5 sm:w-8", s.state === "done" ? "bg-[color:var(--success)]" : "bg-[color:var(--border-strong)]")} />}
        </li>
      ))}
    </ol>
  );
}
