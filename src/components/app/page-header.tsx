import { cn } from "@/lib/utils";

export function PageHeader({ title, description, meta, actions, children, className }: { title: React.ReactNode; description?: React.ReactNode; meta?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("mb-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {meta && <div className="mb-1 text-[12px] text-[color:var(--ink-3)]">{meta}</div>}
          <h1 className="text-[24px] font-semibold tracking-[-0.01em]">{title}</h1>
          {description && <p className="mt-1 max-w-[70ch] text-[14px] text-[color:var(--ink-2)]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}

export function Section({ title, aside, children, className }: { title?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mt-6", className)}>
      {(title || aside) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-[16px] font-semibold">{title}</h2>}
          {aside && <div className="text-[12px] text-[color:var(--ink-3)]">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** A boxed label + value pair, as on a printed report. */
export function FieldGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="text-[13px] font-medium text-[color:var(--ink-2)]">{label}</div>
      <div className="rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-[14px]">{children}</div>
    </div>
  );
}
