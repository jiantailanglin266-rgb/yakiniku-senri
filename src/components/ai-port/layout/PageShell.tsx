import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { aiPortPath } from "@/data/ai-port/site";
import { GradientText } from "@/components/ai-port/ui/Primitives";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; path: string };

/**
 * 下層ページ共通のヘッダー。
 *
 * パンくずは画面表示と構造化データ（BreadcrumbList）で必ず同じ内容にします。
 * 表示していない階層を構造化データにだけ書くのはポリシー違反です。
 */
export function PageHero({
  eyebrow,
  title,
  highlight,
  description,
  crumbs,
  children,
  visual,
}: {
  eyebrow: string;
  title: string;
  /** タイトルのうち、グラデーションにする部分 */
  highlight?: string;
  description?: string;
  crumbs: Crumb[];
  children?: React.ReactNode;
  /**
   * 見出しの背景ビジュアル（<AiMediaBackdrop /> を想定）。
   * ライセンス確認済みの画像が無いときは装飾に落ちるため、
   * 渡しても渡さなくてもレイアウトは変わりません。
   */
  visual?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-white/8">
      {visual}

      <div
        aria-hidden="true"
        className="from-ai-violet/12 pointer-events-none absolute -top-32 right-[8%] size-80 rounded-full bg-gradient-to-br to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-[88rem] px-5 pt-12 pb-14 sm:px-8 lg:pt-16 lg:pb-16">
        <Breadcrumbs crumbs={crumbs} />

        <p className="font-ai-mono text-ai-haze mt-6 flex items-center gap-2.5 text-[0.66rem] tracking-[0.26em] uppercase">
          <span
            aria-hidden="true"
            className="from-ai-cyan h-px w-8 bg-gradient-to-r to-transparent"
          />
          {eyebrow}
        </p>

        <h1 className="mt-4 max-w-4xl text-[1.85rem] leading-[1.3] sm:text-[2.4rem]">
          {title}
          {highlight ? (
            <>
              {" "}
              <GradientText>{highlight}</GradientText>
            </>
          ) : null}
        </h1>

        {description ? (
          <p className="text-ai-mist mt-5 max-w-3xl text-[0.9rem] leading-[2]">{description}</p>
        ) : null}

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </header>
  );
}

export function Breadcrumbs({ crumbs, className }: { crumbs: Crumb[]; className?: string }) {
  return (
    <nav aria-label="パンくずリスト" className={className}>
      <ol className="text-ai-dim flex flex-wrap items-center gap-1.5 text-[0.72rem]">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight aria-hidden="true" className="size-3 shrink-0" /> : null}
              {last ? (
                <span aria-current="page" className="text-ai-mist">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={aiPortPath(crumb.path)}
                  className="hover:text-ai-cyan transition-colors"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** 下層ページの本文枠。 */
export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-[88rem] px-5 py-14 sm:px-8 lg:py-16", className)}>
      {children}
    </div>
  );
}

/** 内部リンクの回遊枠。全下層ページの末尾に置きます（内部リンク最適化）。 */
export function RelatedLinks({
  items,
  title = "あわせて読む",
}: {
  items: { href: string; label: string; description?: string }[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16 border-t border-white/8 pt-10">
      <h2 className="font-ai-mono text-ai-dim text-[0.62rem] tracking-[0.24em] uppercase">
        {title}
      </h2>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="ai-glass ai-glass-rim group block h-full rounded-xl p-4 transition-transform duration-500 hover:-translate-y-0.5"
            >
              <span className="text-ai-white group-hover:text-ai-cyan block text-[0.88rem] transition-colors">
                {item.label}
              </span>
              {item.description ? (
                <span className="text-ai-haze mt-1.5 block text-[0.75rem] leading-[1.75]">
                  {item.description}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
