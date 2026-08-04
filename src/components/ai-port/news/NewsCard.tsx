import { ArrowUpRight } from "lucide-react";
import { relativeTime, type NewsItem } from "@/lib/ai-port/news";
import { findVendor } from "@/data/ai-port/feeds";
import { accentText } from "@/data/ai-port/taxonomy";
import { cn } from "@/lib/utils";

/**
 * ニュース1件。
 *
 * ■ 必ず配信元へ送ります
 *   本文を転載せず、見出し・要約の一部・配信元・日時だけを表示し、
 *   クリックすると元記事へ移動します。
 *   自社記事だと誤解されないよう、配信元名を必ず出します。
 */
export function NewsCard({
  item,
  featured = false,
  index,
}: {
  item: NewsItem;
  featured?: boolean;
  index?: number;
}) {
  const vendor = item.vendorIds.map((id) => findVendor(id)).find(Boolean);

  return (
    <article
      className={cn(
        "ai-glass ai-glass-rim ai-scan group relative overflow-hidden rounded-2xl transition-transform duration-500 hover:-translate-y-0.5",
        featured ? "p-6 sm:p-8" : "p-5",
      )}
    >
      <div className="flex items-center gap-2.5">
        {typeof index === "number" ? (
          <span className="font-ai-mono text-ai-dim text-[0.65rem] tracking-[0.14em]">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}

        {vendor ? (
          <span
            className={cn(
              "font-ai-mono text-[0.62rem] tracking-[0.16em] uppercase",
              accentText[vendor.accent],
            )}
          >
            {vendor.name}
          </span>
        ) : null}

        <time
          dateTime={item.isoDate}
          className="text-ai-dim ml-auto shrink-0 text-[0.68rem]"
          // 数字が機械翻訳で書き換わると日時が壊れるため除外します
          translate="no"
        >
          {relativeTime(item.isoDate)}
        </time>
      </div>

      <h3
        className={cn(
          "text-ai-white mt-3 leading-[1.55]",
          featured ? "text-[1.15rem] sm:text-[1.35rem]" : "text-[0.95rem]",
        )}
      >
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group-hover:text-ai-cyan transition-colors duration-300 after:absolute after:inset-0"
        >
          {item.title}
        </a>
      </h3>

      {featured && item.summary ? (
        <p className="text-ai-haze mt-3 line-clamp-3 text-[0.84rem] leading-[1.9]">
          {item.summary}
        </p>
      ) : null}

      <p className="text-ai-dim mt-4 flex items-center gap-1.5 text-[0.7rem]">
        {item.source ? <span className="truncate">{item.source}</span> : <span>配信元サイト</span>}
        <ArrowUpRight
          aria-hidden="true"
          className="size-3 shrink-0 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </p>
    </article>
  );
}

/** 取得できなかったときの表示。空白にせず、理由と次の導線を出します。 */
export function NewsEmptyState({ message }: { message?: string }) {
  return (
    <div className="ai-glass rounded-2xl px-6 py-10 text-center">
      <p className="text-ai-mist text-[0.9rem]">{message ?? "ニュースを取得できませんでした。"}</p>
      <p className="text-ai-dim mt-2.5 text-[0.78rem] leading-[1.9]">
        配信元のRSSに一時的に接続できていない可能性があります。
        <br />
        しばらく時間をおいて再度お試しください。
      </p>
    </div>
  );
}
