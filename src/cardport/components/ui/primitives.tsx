/**
 * 汎用UIプリミティブ。
 *
 * 装飾（ガラス・発光・グラデーション）を持つのはここだけにして、
 * 各セクションが独自の装飾を作らないようにしています。
 * 装飾が増えるほど、金額や還元率の可読性は落ちるためです。
 */
import Link from "next/link";
import type { ReactNode } from "react";

export type Accent = "cyan" | "violet" | "magenta" | "emerald" | "gold" | "electric";

export const accentClass: Record<Accent, string> = {
  cyan: "text-cyan",
  violet: "text-violet",
  magenta: "text-magenta",
  emerald: "text-emerald",
  gold: "text-gold",
  electric: "text-electric",
};

export const accentBgClass: Record<Accent, string> = {
  cyan: "bg-cyan/12 border-cyan/35",
  violet: "bg-violet/12 border-violet/35",
  magenta: "bg-magenta/12 border-magenta/35",
  emerald: "bg-emerald/12 border-emerald/35",
  gold: "bg-gold/12 border-gold/35",
  electric: "bg-electric/12 border-electric/35",
};

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/** ページ内の1セクション。左右の余白と最大幅をここで統一します */
export function Section({
  children,
  className,
  id,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx("relative mx-auto w-full max-w-[88rem] px-4 py-14 sm:px-6 sm:py-20", className)}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  accent = "cyan",
  action,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  id?: string;
  accent?: Accent;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p
            className={cx(
              "mb-2 font-mono text-[0.68rem] tracking-[0.24em] uppercase",
              accentClass[accent],
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2 id={id} className="text-ink text-[1.45rem] leading-tight sm:text-[2rem]">
          {title}
        </h2>
        {lead ? <p className="text-mist mt-3 text-[0.9rem] leading-relaxed">{lead}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/** ガラスパネル。中身の文字は必ず --color-ink / --color-mist で置きます */
export function Panel({
  children,
  className,
  glow = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  as?: "div" | "article" | "li" | "aside";
}) {
  return (
    <Tag className={cx("glass port-shadow rounded-2xl", glow && "glow-border", className)}>
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  accent = "cyan",
  className,
}: {
  children: ReactNode;
  accent?: Accent;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.68rem] leading-5 font-medium",
        accentBgClass[accent],
        accentClass[accent],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * 広告ラベル。
 * 提携リンクを含む箇所に必ず表示します。装飾で目立たなくしないでください。
 */
export function AdLabel({ label, title }: { label: string; title: string }) {
  return (
    <span
      title={title}
      className="border-amber/45 bg-amber/12 text-amber inline-flex shrink-0 items-center rounded border px-1.5 py-px text-[0.62rem] font-semibold tracking-[0.14em]"
    >
      {label}
    </span>
  );
}

type ButtonVariant = "primary" | "ghost" | "outline" | "gold";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-cyan to-electric text-void font-semibold hover:brightness-110 shadow-[0_10px_30px_-12px_rgba(34,211,238,0.8)]",
  gold: "bg-gradient-to-r from-gold to-amber text-void font-semibold hover:brightness-110",
  outline: "glass text-ink hover:border-cyan/60",
  ghost: "text-mist hover:text-ink",
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[0.85rem] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50";

export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
  external = false,
  rel,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  external?: boolean;
  rel?: string;
} & Record<string, unknown>) {
  const classes = cx(buttonBase, buttonVariants[variant], className);
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel={rel ?? "noopener noreferrer"}
        className={classes}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  onClick,
  variant = "outline",
  className,
  type = "button",
  disabled,
  ariaPressed,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaPressed?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ariaPressed}
      aria-label={ariaLabel}
      className={cx(buttonBase, buttonVariants[variant], className)}
    >
      {children}
    </button>
  );
}

/** 数値を強調して見せる欄。ラベルと単位を必ず添えます */
export function StatBlock({
  label,
  value,
  unit,
  accent = "cyan",
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: Accent;
  note?: string;
}) {
  return (
    <div>
      <p className="text-dim text-[0.7rem] tracking-wide">{label}</p>
      <p className="mt-0.5 flex items-baseline gap-1">
        <span
          className={cx(
            "numeric text-[1.35rem] font-semibold sm:text-[1.6rem]",
            accentClass[accent],
          )}
        >
          {value}
        </span>
        {unit ? <span className="text-mist text-[0.72rem]">{unit}</span> : null}
      </p>
      {note ? <p className="text-dim mt-0.5 text-[0.66rem] leading-snug">{note}</p> : null}
    </div>
  );
}

/** 0〜5 のスコアバー */
export function ScoreBar({ score, label }: { score: number; label: string }) {
  const percent = Math.max(0, Math.min(100, (score / 5) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-dim w-28 shrink-0 text-[0.72rem]">{label}</span>
      <span className="bg-slate/70 relative h-1.5 flex-1 overflow-hidden rounded-full">
        <span
          className="from-cyan to-violet absolute inset-y-0 left-0 rounded-full bg-gradient-to-r"
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="numeric text-mist w-8 shrink-0 text-right text-[0.72rem]">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

/** 注意書き。法務上の必須表示に使います。装飾を最小限にして必ず読める形にします */
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warn" | "danger";
}) {
  const tones = {
    info: "border-line bg-navy/70 text-mist",
    warn: "border-amber/40 bg-amber/8 text-amber",
    danger: "border-danger/45 bg-danger/8 text-danger",
  } as const;
  return (
    <p className={cx("rounded-xl border px-4 py-3 text-[0.78rem] leading-relaxed", tones[tone])}>
      {children}
    </p>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // 構造化データは自前で組み立てた値のみを渡します（外部入力は入りません）
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
