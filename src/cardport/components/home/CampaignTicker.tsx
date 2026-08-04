/**
 * キャンペーンティッカー。
 *
 * ■ 表示の決まり
 *   キャンペーン名だけを流すと「無条件でもらえる」ように読めてしまいます。
 *   獲得可能額・期限・対象者を必ず同じ行に並べ、詳細で条件全文へ飛ばします。
 *
 * ■ アニメーション
 *   CSS のマーキーです。ホバー・フォーカスで停止し、`prefers-reduced-motion` では動きません。
 */
import Link from "next/link";

import { campaigns, isExpired, sortCampaigns } from "@/cardport/data/campaigns";
import { getCardById } from "@/cardport/data/cards";
import type { Dictionary } from "@/cardport/i18n";
import { formatDate, formatYen } from "@/cardport/i18n/format";
import { pick } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";

export function CampaignTicker({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const list = sortCampaigns(campaigns).slice(0, 8);
  if (list.length === 0) return null;

  const items = list.map((campaign) => {
    const card = getCardById(campaign.cardId);
    return (
      <Link
        key={campaign.id}
        href={routes.campaigns(locale)}
        className="hover:text-cyan flex shrink-0 items-center gap-2.5 px-5 py-2.5 text-[0.76rem] transition-colors"
      >
        <span
          className="bg-magenta inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        {card ? <span className="text-ink font-medium">{pick(card.name, locale)}</span> : null}
        <span className="text-mist">{pick(campaign.title, locale)}</span>
        {campaign.maxValue > 0 ? (
          <span className="numeric text-amber">
            {dictionary.card.upTo} {formatYen(campaign.maxValue, locale)}
          </span>
        ) : null}
        <span className="text-dim">
          {isExpired(campaign)
            ? dictionary.affiliate.expired
            : `〜${formatDate(campaign.endsOn, locale)}`}
        </span>
        <span className="text-dim">|</span>
        <span className="text-dim">{pick(campaign.target, locale)}</span>
      </Link>
    );
  });

  return (
    <section
      aria-label={dictionary.sections.campaignTicker}
      className="border-line/60 bg-navy/60 relative overflow-hidden border-y backdrop-blur"
    >
      <div className="flex items-center">
        <p className="border-line/60 text-magenta hidden shrink-0 border-e px-4 py-2.5 font-mono text-[0.66rem] tracking-[0.2em] uppercase sm:block">
          {dictionary.sections.campaignTicker}
        </p>
        <div className="hide-scrollbar relative flex-1 overflow-hidden">
          <div className="port-marquee" style={{ ["--port-marquee-duration" as string]: "56s" }}>
            <div className="flex">{items}</div>
            {/* 途切れずに流すため同じ列を2つ並べます（読み上げは1つ目だけで足ります） */}
            <div className="flex" aria-hidden="true">
              {items}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
