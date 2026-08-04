import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 共通の見た目パーツ。
 * ここに集約しているのは、装飾の実装が散らばると
 * 「同じガラスカードなのに微妙に違う」状態になりやすいためです。
 */

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export { cx };

/* ---------------------------------------------------------------- カード */

export function GlassCard({
  as: Tag = "div",
  className,
  glow = true,
  children,
  ...rest
}: {
  as?: "div" | "article" | "section" | "li";
  className?: string;
  /** hover で縁が光るか。一覧に並ぶカードでは有効、静的な箱では無効にします */
  glow?: boolean;
  children: ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cx(
        "glass relative rounded-2xl",
        glow && "edge-glow transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------- 見出し */

export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  action,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  id?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h2 id={id} className="text-2xl sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {lead ? <p className="mt-3 text-sm text-(--color-ink-soft) sm:text-base">{lead}</p> : null}
        <div className="rule-gradient mt-5 w-40" />
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/* ---------------------------------------------------------------- ボタン */

type ButtonTone = "primary" | "ghost" | "outline";

const buttonTone: Record<ButtonTone, string> = {
  primary:
    "bg-linear-to-r from-(--color-cyan) via-(--color-blue) to-(--color-violet) text-(--color-void) font-semibold shadow-[0_10px_40px_-12px_var(--color-blue)] hover:brightness-110",
  outline:
    "glass text-(--color-ink) hover:border-(--color-hairline-strong) hover:text-white edge-glow",
  ghost: "text-(--color-ink-soft) hover:text-(--color-ink)",
};

export function NeonLink({
  href,
  tone = "primary",
  className,
  children,
  ...rest
}: {
  href: string;
  tone?: ButtonTone;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm transition-all duration-300",
        buttonTone[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function NeonButton({
  tone = "primary",
  className,
  children,
  ...rest
}: {
  tone?: ButtonTone;
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        buttonTone[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ 記号 */

const badgeTone: Record<string, string> = {
  neutral: "border-(--color-hairline) text-(--color-ink-soft)",
  cyan: "border-(--color-cyan)/40 text-(--color-cyan-soft) bg-(--color-cyan)/8",
  violet: "border-(--color-violet)/40 text-(--color-violet) bg-(--color-violet)/10",
  magenta: "border-(--color-magenta)/40 text-(--color-magenta) bg-(--color-magenta)/10",
  emerald: "border-(--color-emerald)/40 text-(--color-emerald) bg-(--color-emerald)/10",
  amber: "border-(--color-amber)/45 text-(--color-amber) bg-(--color-amber)/10",
  rose: "border-(--color-down)/45 text-(--color-down) bg-(--color-down)/10",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof badgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.6875rem] leading-5 font-medium whitespace-nowrap",
        badgeTone[tone] ?? badgeTone.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ 対応/非対応 */

/**
 * 三値の表示。
 * 「情報なし」を「非対応」と描き分けます。
 * 未確認を✕にすると、事実と異なる比較になってしまうためです。
 */
export function SupportMark({
  value,
  labels,
}: {
  value: "yes" | "no" | "partial" | "unknown";
  labels: { yes: string; no: string; partial: string; unknown: string };
}) {
  const map = {
    yes: { symbol: "○", tone: "text-(--color-emerald)", label: labels.yes },
    partial: { symbol: "△", tone: "text-(--color-amber)", label: labels.partial },
    no: { symbol: "✕", tone: "text-(--color-ink-dim)", label: labels.no },
    unknown: { symbol: "—", tone: "text-(--color-ink-dim)", label: labels.unknown },
  } as const;
  const entry = map[value];
  return (
    <span className={cx("inline-flex items-center gap-1.5", entry.tone)}>
      <span aria-hidden="true" className="text-base leading-none">
        {entry.symbol}
      </span>
      <span className="sr-only">{entry.label}</span>
    </span>
  );
}

/* -------------------------------------------------------------- 統計タイル */

export function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "up" | "down" | "flat";
}) {
  return (
    <div className="glass rounded-xl px-4 py-3">
      <p className="text-[0.6875rem] tracking-wide text-(--color-ink-dim) uppercase">{label}</p>
      <p
        className={cx(
          "tabular mt-1 font-mono text-lg font-semibold sm:text-xl",
          tone === "up" && "trend-up",
          tone === "down" && "trend-down",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-(--color-ink-soft)">{sub}</p> : null}
    </div>
  );
}

/* --------------------------------------------------------------- 注意書き */

export function NoticeBox({
  tone = "amber",
  title,
  className,
  children,
}: {
  tone?: "amber" | "rose" | "cyan";
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  const border = {
    amber: "border-(--color-amber)/35 bg-(--color-amber)/6",
    rose: "border-(--color-down)/35 bg-(--color-down)/6",
    cyan: "border-(--color-cyan)/35 bg-(--color-cyan)/6",
  }[tone];

  return (
    <div className={cx("rounded-xl border px-4 py-3 text-sm sm:px-5 sm:py-4", border, className)}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="text-(--color-ink-soft)">{children}</div>
    </div>
  );
}

/* --------------------------------------------------------------- 空の状態 */

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass rounded-2xl px-6 py-12 text-center text-sm text-(--color-ink-soft)">
      {message}
    </div>
  );
}
