import Link from "next/link";
import { localePath } from "@/portal/i18n/config";
import { formatDateTime, t } from "@/portal/lib/format";
import { newsCategories } from "@/portal/data/news";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { NewsArticle } from "@/portal/lib/types";
import { Badge, GlassCard } from "@/portal/components/ui/primitives";

const labelTone: Record<string, "rose" | "amber" | "cyan" | "violet" | "magenta"> = {
  breaking: "rose",
  important: "amber",
  regulation: "violet",
  listing: "cyan",
  hack: "rose",
  volatility: "amber",
  impact: "magenta",
};

export function NewsLabels({ labels, dict }: { labels: NewsArticle["labels"]; dict: Dictionary }) {
  if (labels.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <li key={label}>
          <Badge tone={labelTone[label] ?? "neutral"}>{dict.news.labels[label]}</Badge>
        </li>
      ))}
    </ul>
  );
}

export function NewsCard({
  article,
  duplicates = 0,
  locale,
  dict,
  compact = false,
}: {
  article: NewsArticle;
  /** 同じ話題を扱う他記事の件数 */
  duplicates?: number;
  locale: string;
  dict: Dictionary;
  compact?: boolean;
}) {
  const category = newsCategories.find((entry) => entry.id === article.category);

  return (
    <GlassCard as="article" className={compact ? "p-4" : "p-5"}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {category ? <Badge tone="cyan">{t(category.label, locale)}</Badge> : null}
          <NewsLabels labels={article.labels} dict={dict} />
        </div>

        <h3 className={compact ? "text-sm leading-snug font-semibold" : "text-base font-semibold"}>
          <Link
            href={localePath(locale, `/news/${article.slug}`)}
            className="transition-colors hover:text-white"
          >
            {t(article.title, locale)}
          </Link>
        </h3>

        {!compact ? (
          <p className="line-clamp-2 text-sm text-(--color-ink-soft)">
            {t(article.summary, locale)}
          </p>
        ) : null}

        {/* 情報元と公開日時は必ず出します。二次情報であることを隠さないためです */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--color-ink-dim)">
          <span>{article.outlet}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt, locale)}</time>
          <span aria-hidden="true">·</span>
          <span>
            {article.readingMinutes} {dict.common.minutes}
          </span>
          {duplicates > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-(--color-cyan-soft)">
                {dict.news.similar} +{duplicates}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}
