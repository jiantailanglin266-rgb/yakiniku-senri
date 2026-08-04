/**
 * 汎用の表示部品。
 *
 * ここに置くのは「どのページでも同じ意味で使えるもの」だけです。
 * 競技固有の表示は components/match / components/standings 側にあります。
 */
import Link from "next/link";
import type { ReactNode } from "react";
import type { DataStamp, LocalizedText } from "../../types";
import { formatDateTime, formatRefreshInterval } from "../../lib/format";
import { getDictionary } from "../../i18n";
import { href } from "../../lib/url";

/* ------------------------------------------------------------------
   JSON-LD
   ------------------------------------------------------------------ */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // 構造化データは静的に生成した値のみを流し込みます（ユーザー入力は通しません）
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/* ------------------------------------------------------------------
   セクション見出し
   ------------------------------------------------------------------ */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4" id={id}>
      <div className="min-w-0">
        {eyebrow ? <p className="sp-eyebrow mb-2">{eyebrow}</p> : null}
        <h2 className="text-ink text-2xl font-bold sm:text-3xl">{title}</h2>
        {description ? <p className="text-ink-dim mt-2 max-w-2xl text-sm">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------
   データの出所と取得時刻
   「いつのデータか」を隠さないための共通表示です。
   ------------------------------------------------------------------ */
export function StampLine({ stamp, locale }: { stamp: DataStamp; locale: string }) {
  const dict = getDictionary(locale);
  const provenanceLabel: Record<DataStamp["provenance"], string> = {
    official: locale === "ja" ? "公式発表" : "Official",
    api: locale === "ja" ? "提携API" : "Partner API",
    editorial: locale === "ja" ? "編集部" : "Editorial",
    mock: locale === "ja" ? "デモデータ" : "Demo data",
  };

  return (
    <p className="sp-mono text-ink-faint mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem]">
      <span className="border-edge text-ink-dim rounded-sm border px-1.5 py-0.5">
        {provenanceLabel[stamp.provenance]}
      </span>
      <span>
        {dict.fetchedAt}:{" "}
        <time dateTime={stamp.fetchedAt}>{formatDateTime(stamp.fetchedAt, locale)}</time>
      </span>
      {stamp.refreshIntervalSec > 0 ? (
        <span>
          {dict.refreshInterval}: {formatRefreshInterval(stamp.refreshIntervalSec, locale)}
        </span>
      ) : null}
      <span>
        {dict.source}: {stamp.source}
      </span>
    </p>
  );
}

/** 取得に失敗したときの表示。古い値を最新として出さないための受け皿です。 */
export function DataUnavailable({ locale }: { locale: string }) {
  const dict = getDictionary(locale);
  return (
    <div className="sp-solid text-ink-dim border-dashed p-6 text-sm" role="status">
      {dict.dataUnavailable}
    </div>
  );
}

/* ------------------------------------------------------------------
   チームエンブレム
   権利物のロゴは使わず、チームカラーとイニシャルから生成します。
   ------------------------------------------------------------------ */
export function Crest({
  initials,
  primary,
  secondary,
  shape = "shield",
  size = 40,
  label,
}: {
  initials: string;
  primary: string;
  secondary: string;
  shape?: "shield" | "circle" | "hex";
  size?: number;
  label?: string;
}) {
  const id = `crest-${initials}-${shape}`;
  const paths: Record<string, string> = {
    shield: "M32 4 L58 12 V32 C58 46 46 56 32 60 C18 56 6 46 6 32 V12 Z",
    circle: "M32 4 A28 28 0 1 1 31.9 4 Z",
    hex: "M32 3 L57 17 V47 L32 61 L7 47 V17 Z",
  };

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="shrink-0"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
      </defs>
      <path d={paths[shape]} fill={`url(#${id})`} opacity="0.92" />
      <path d={paths[shape]} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fill="#0b1020"
        style={{ paintOrder: "stroke" }}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="0.6"
      >
        {initials}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------
   ラベル・バッジ
   ------------------------------------------------------------------ */
export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "live" | "accent" | "caution" | "success";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-edge text-ink-dim",
    live: "border-live/60 bg-live/15 text-live",
    accent: "border-cyan/50 bg-cyan/10 text-cyan",
    caution: "border-caution/50 bg-caution/10 text-caution",
    success: "border-neon/50 bg-neon/10 text-neon",
  };
  return (
    <span
      className={`sp-mono inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[0.625rem] tracking-wider uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** 試合中を示す点滅ドット。prefers-reduced-motion では点滅しません。 */
export function LiveDot() {
  return (
    <span
      aria-hidden="true"
      className="sp-anim-live bg-live inline-block size-1.5 rounded-full align-middle"
    />
  );
}

/* ------------------------------------------------------------------
   ボタン / リンク
   ------------------------------------------------------------------ */
export function ActionLink({
  to,
  locale,
  children,
  variant = "primary",
  className = "",
}: {
  to: string;
  locale: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "quiet";
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-linear-to-r from-cyan to-indigo text-void font-semibold hover:from-cyan hover:to-magenta shadow-[0_0_1.5rem_-0.5rem_var(--color-cyan)]",
    ghost: "border border-edge text-ink hover:border-cyan/60 hover:text-cyan",
    quiet: "text-ink-dim hover:text-cyan",
  };
  return (
    <Link
      href={href(locale, to)}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

/**
 * 外部リンク（アフィリエイト対応）。
 *
 * 広告リンクには rel="sponsored nofollow" と「PR」表記を必ず付けます。
 * data-* 属性は、配置別のクリック計測を後から差し込むためのフックです。
 */
export function OutboundLink({
  url,
  children,
  sponsored = false,
  campaign,
  placement,
  locale,
  className = "",
}: {
  url: string;
  children: ReactNode;
  sponsored?: boolean;
  campaign?: string;
  placement?: string;
  locale: string;
  className?: string;
}) {
  const dict = getDictionary(locale);
  return (
    <a
      href={url}
      target="_blank"
      rel={sponsored ? "sponsored nofollow noopener noreferrer" : "noopener noreferrer"}
      data-affiliate={sponsored ? "true" : undefined}
      data-campaign={campaign}
      data-placement={placement}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${className}`}
    >
      {children}
      {sponsored ? (
        <span className="sp-mono border-caution/50 text-caution rounded-sm border px-1 text-[0.5625rem]">
          {dict.adLabel}
        </span>
      ) : null}
    </a>
  );
}

/* ------------------------------------------------------------------
   パンくず
   ------------------------------------------------------------------ */
export function Breadcrumbs({
  locale,
  trail,
}: {
  locale: string;
  trail: { label: string; path: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="text-ink-faint flex flex-wrap items-center gap-1 text-xs">
        {trail.map((item, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="text-ink-dim">
                  {item.label}
                </span>
              ) : (
                <Link href={href(locale, item.path)} className="hover:text-cyan transition-colors">
                  {item.label}
                </Link>
              )}
              {last ? null : <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------
   FAQ
   ------------------------------------------------------------------ */
export function FaqList({
  items,
  locale,
  t,
}: {
  items: { id: string; question: LocalizedText; answer: LocalizedText }[];
  locale: string;
  t: (value: LocalizedText | undefined) => string;
}) {
  void locale;
  return (
    <div className="divide-edge border-edge divide-y overflow-hidden rounded-2xl border">
      {items.map((item) => (
        <details key={item.id} id={item.id} className="group bg-panel/60">
          <summary className="text-ink hover:text-cyan cursor-pointer list-none px-5 py-4 text-sm font-semibold transition-colors">
            <span className="text-cyan mr-2">Q.</span>
            {t(item.question)}
          </summary>
          <div className="text-ink-soft px-5 pb-5 text-sm leading-relaxed">{t(item.answer)}</div>
        </details>
      ))}
    </div>
  );
}
