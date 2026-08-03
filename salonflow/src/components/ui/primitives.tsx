import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * UI primitives.
 *
 * Written in the shadcn/ui style — headless Tailwind components owned by this
 * repository rather than pulled from a runtime dependency — so they can be
 * adjusted for the density an operations screen needs without fighting a
 * library's defaults.
 */

// --- Button ----------------------------------------------------------------

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-[--color-accent] text-[--color-accent-ink] hover:bg-[--color-accent-hover]",
        secondary:
          "bg-[--color-surface] text-[--color-ink] border border-[--color-border] hover:bg-[--color-surface-muted]",
        ghost: "text-[--color-ink-muted] hover:bg-[--color-surface-muted] hover:text-[--color-ink]",
        danger: "bg-[--color-danger] text-white hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ComponentPropsWithoutRef<"button">, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

// --- Card ------------------------------------------------------------------

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-[--radius-card] border border-[--color-border] bg-[--color-surface]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[--color-border] px-4 py-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-[--color-ink]">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-[--color-ink-muted]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

// --- Metric tile -----------------------------------------------------------

export function Metric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "text-[--color-ink]",
    positive: "text-[--color-positive]",
    warning: "text-[--color-warning]",
    danger: "text-[--color-danger]",
  }[tone];

  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-[--color-ink-muted]">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-[--color-ink-subtle]">{hint}</p> : null}
    </Card>
  );
}

// --- Badge -----------------------------------------------------------------

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      tone: {
        neutral: "bg-[--color-surface-muted] text-[--color-ink-muted] ring-[--color-border]",
        accent: "bg-[--color-accent-soft] text-[--color-accent] ring-[--color-accent]/30",
        positive: "bg-[--color-positive-soft] text-[--color-positive] ring-[--color-positive]/30",
        warning: "bg-[--color-warning-soft] text-[--color-warning] ring-[--color-warning]/30",
        danger: "bg-[--color-danger-soft] text-[--color-danger] ring-[--color-danger]/30",
        info: "bg-[--color-info-soft] text-[--color-info] ring-[--color-info]/30",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends ComponentPropsWithoutRef<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

// --- Form fields -----------------------------------------------------------

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-xs font-medium text-[--color-ink]"
      >
        {label}
        {required ? (
          <span className="text-[--color-danger]" aria-label="必須">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-[--color-ink-subtle]">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-[--color-danger]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-md border border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-[--color-ink] placeholder:text-[--color-ink-subtle] disabled:opacity-60";

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-20", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentPropsWithoutRef<"select">) {
  return <select className={cn(controlClass, "pr-8", className)} {...props} />;
}

// --- Table -----------------------------------------------------------------

export function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full min-w-max border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-[--color-border] bg-[--color-surface-muted] px-3 py-2 text-left text-xs font-semibold text-[--color-ink-muted]",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return (
    <td
      className={cn("border-b border-[--color-border] px-3 py-2 align-top", className)}
      {...props}
    />
  );
}

// --- Empty state -----------------------------------------------------------

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <p className="text-sm font-medium text-[--color-ink]">{title}</p>
      {description ? (
        <p className="max-w-md text-xs text-[--color-ink-muted]">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

// --- Alert -----------------------------------------------------------------

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "danger" | "positive";
  title?: string;
  children: ReactNode;
}) {
  const toneClass = {
    info: "bg-[--color-info-soft] text-[--color-info] border-[--color-info]/30",
    warning: "bg-[--color-warning-soft] text-[--color-warning] border-[--color-warning]/30",
    danger: "bg-[--color-danger-soft] text-[--color-danger] border-[--color-danger]/30",
    positive: "bg-[--color-positive-soft] text-[--color-positive] border-[--color-positive]/30",
  }[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-md border px-3 py-2 text-sm", toneClass)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-0.5" : undefined}>{children}</div>
    </div>
  );
}

// --- Page header -----------------------------------------------------------

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-[--color-ink]">{title}</h1>
        {description ? (
          <p className="mt-0.5 text-xs text-[--color-ink-muted]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
