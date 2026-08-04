import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";
import {
  SECTION_BANNER_ASPECT,
  SECTION_BANNER_SIZE,
  sectionBanner,
} from "@/data/ai-port/section-banners";
import { accentClass, accentText, type Accent } from "@/data/ai-port/taxonomy";

/* ------------------------------------------------------------
   文字
   ------------------------------------------------------------ */

/** グラデーションの見出し文字。`flow` はページに1つまでにしてください（動きが散ります）。 */
export function GradientText({
  children,
  className,
  flow = false,
}: {
  children: React.ReactNode;
  className?: string;
  flow?: boolean;
}) {
  return (
    <span className={cn("ai-gradient-text", flow && "ai-gradient-flow", className)}>
      {children}
    </span>
  );
}

/** 小見出しの上に置く英字ラベル。 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-ai-mono text-ai-haze flex items-center gap-2.5 text-[0.68rem] tracking-[0.28em] uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="from-ai-cyan h-px w-8 bg-gradient-to-r to-transparent" />
      {children}
    </p>
  );
}

/* ------------------------------------------------------------
   セクション見出し
   ------------------------------------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  /**
   * 見出しを画像に差し替えるときのキー（public/images/ai-port/sections/<キー>.jpg）。
   *
   * ⚠ 画像には見出しと説明文が焼き込まれています。
   *   翻訳・クローラー・読み上げのために、文字側は sr-only で残します。
   *   画像が無ければ、従来どおりの文字の見出しに戻ります。
   */
  banner,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
  banner?: string;
}) {
  const bannerSrc = banner ? sectionBanner(banner) : null;

  if (bannerSrc) {
    return (
      <div className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-5", className)}>
        <div className="min-w-0 flex-1">
          {/*
            画面には画像だけを出しますが、文字は機械に読めるよう残します。
            画像側は装飾（alt=""）なので、読み上げが二重になりません。
          */}
          <span className="sr-only">
            <span>{eyebrow}</span>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </span>

          <Image
            src={withBasePath(bannerSrc)}
            alt=""
            width={SECTION_BANNER_SIZE.width}
            height={SECTION_BANNER_SIZE.height}
            sizes="(min-width: 1024px) 62rem, 100vw"
            className={cn("h-auto w-full rounded-2xl object-cover", SECTION_BANNER_ASPECT)}
          />
        </div>

        {action ? (
          <Link
            href={action.href}
            className="group text-ai-mist hover:text-ai-cyan inline-flex shrink-0 items-center gap-2 text-[0.82rem] transition-colors"
          >
            {action.label}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-500 group-hover:translate-x-1"
            />
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-5", className)}>
      <div className="max-w-2xl min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-4 text-[1.55rem] leading-[1.3] sm:text-[2rem]">{title}</h2>
        {description ? (
          <p className="text-ai-haze mt-3.5 text-[0.9rem] leading-[1.9]">{description}</p>
        ) : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="group text-ai-mist hover:text-ai-cyan inline-flex shrink-0 items-center gap-2 text-[0.82rem] transition-colors"
        >
          {action.label}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-500 group-hover:translate-x-1"
          />
        </Link>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------
   面
   ------------------------------------------------------------ */

export function GlassCard({
  children,
  className,
  /** 縁を虹色に光らせる（hover時） */
  rim = true,
  /** 光が走る演出 */
  scan = false,
}: {
  children: React.ReactNode;
  className?: string;
  rim?: boolean;
  scan?: boolean;
}) {
  return (
    <div
      className={cn(
        "ai-glass relative rounded-2xl",
        rim && "ai-glass-rim",
        scan && "ai-scan",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------
   小さな部品
   ------------------------------------------------------------ */

export function Badge({
  children,
  accent = "cyan",
  className,
}: {
  children: React.ReactNode;
  accent?: Accent;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-ai-mono inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[0.63rem] tracking-[0.12em] uppercase",
        accentText[accent],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 「PR」表示。対価を受け取っている枠には必ず出します（ステマ規制対応）。 */
export function SponsoredBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-ai-mono text-ai-amber inline-flex items-center rounded-sm border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[0.6rem] tracking-[0.16em]",
        className,
      )}
      title="広告・アフィリエイトを含むリンクです"
    >
      PR
    </span>
  );
}

/** 未確認の項目。空欄にせず「未確認」と明示します（推測で埋めないため）。 */
export function Unknown({ className }: { className?: string }) {
  return (
    <span className={cn("text-ai-dim text-[0.75rem]", className)} title="編集部で未確認の項目です">
      未確認
    </span>
  );
}

export function Pill({
  children,
  active = false,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-[0.78rem] transition-colors duration-300",
        active
          ? "border-ai-cyan/50 bg-ai-cyan/12 text-ai-cyan"
          : "text-ai-haze hover:text-ai-mist border-white/10 bg-white/[0.03] hover:border-white/25",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------
   ボタン
   ------------------------------------------------------------ */

const buttonBase =
  "group relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.85rem] font-medium transition-all duration-500 focus-visible:outline-2";

export function PrimaryLink({
  href,
  children,
  className,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="from-ai-cyan via-ai-blue to-ai-violet absolute inset-0 rounded-full bg-gradient-to-r opacity-90 transition-opacity duration-500 group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="from-ai-cyan to-ai-violet absolute inset-0 rounded-full bg-gradient-to-r opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-70"
      />
      <span className="relative flex items-center gap-2 text-[#04060f]">
        {children}
        {external ? (
          <ArrowUpRight aria-hidden="true" className="size-4" />
        ) : (
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-500 group-hover:translate-x-0.5"
          />
        )}
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonBase, className)}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(buttonBase, className)}>
      {content}
    </Link>
  );
}

export function GhostLink({
  href,
  children,
  className,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const classes = cn(
    buttonBase,
    "border border-white/15 bg-white/[0.04] text-ai-mist backdrop-blur-sm hover:border-ai-cyan/45 hover:text-ai-white",
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-500 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/* ------------------------------------------------------------
   数値・指標
   ------------------------------------------------------------ */

/** ⚠ 実測値だけを渡してください。推測の数字を並べないこと。 */
export function StatTile({
  label,
  value,
  suffix,
  accent = "cyan",
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: Accent;
}) {
  return (
    <div className="ai-neo rounded-xl px-5 py-4">
      <p
        className={cn(
          "font-ai-display bg-gradient-to-r bg-clip-text text-[1.6rem] leading-none font-semibold text-transparent",
          accentClass[accent],
        )}
      >
        {value}
        {suffix ? <span className="ml-0.5 text-[0.9rem]">{suffix}</span> : null}
      </p>
      <p className="text-ai-haze mt-2 text-[0.72rem] tracking-[0.06em]">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------
   注記
   ------------------------------------------------------------ */

/** 事実性についての注記。価格・提供状況を扱うページの下部に必ず置きます。 */
export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ai-dim mt-8 rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3 text-[0.72rem] leading-[1.9]">
      {children}
    </p>
  );
}
