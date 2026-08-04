/**
 * カード1枚ぶんの表示（一覧・ランキング・特集で共通）。
 *
 * ■ 表示の優先順位
 *   装飾よりも先に、年会費・還元率・キャンペーン・おすすめ度が読めること。
 *   スマートフォンでは、この4つ＋CTAが折り返しなしで見える幅に収めています。
 */
import Link from "next/link";

import type { Card } from "@/cardport/data/types";
import { getIssuer, brandLabels } from "@/cardport/data/issuers";
import { getCampaignsByCardId, isExpired } from "@/cardport/data/campaigns";
import type { Dictionary } from "@/cardport/i18n";
import { formatAnnualFee, formatDate, formatYen } from "@/cardport/i18n/format";
import { pick } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import { computeScore } from "@/cardport/lib/scoring";
import { routes } from "@/cardport/lib/routes";
import { Badge, Panel, cx } from "@/cardport/components/ui/primitives";
import { CardArt } from "@/cardport/components/visual/CardArt";
import type { Placement } from "@/cardport/lib/affiliate";
import { AffiliateCta } from "./AffiliateCta";
import { CompareToggle } from "./CompareToggle";

export function CardTile({
  card,
  locale,
  dictionary,
  rank,
  placement = "card-list",
  compact = false,
}: {
  card: Card;
  locale: Locale;
  dictionary: Dictionary;
  rank?: number;
  placement?: Placement;
  compact?: boolean;
}) {
  const issuer = getIssuer(card.issuerId);
  const campaign = getCampaignsByCardId(card.id).find((entry) => !isExpired(entry));
  const score = computeScore(card);

  return (
    <Panel as="article" glow className="flex h-full flex-col overflow-hidden p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <div className="w-24 shrink-0 sm:w-32">
          <div className="card3d-scene">
            <CardArt card={card} locale={locale} className="port-float" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {rank ? (
              <span
                className={cx(
                  "numeric inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[0.75rem] font-bold",
                  rank === 1
                    ? "from-gold to-amber text-void bg-gradient-to-br"
                    : rank <= 3
                      ? "bg-cyan/20 text-cyan"
                      : "bg-slate text-mist",
                )}
              >
                {rank}
              </span>
            ) : null}
            <Badge accent="cyan">{dictionary.rank[card.rank]}</Badge>
            {card.annualFee === 0 ? (
              <Badge accent="emerald">{dictionary.filters.annualFeeFree}</Badge>
            ) : null}
          </div>

          <h3 className="mt-2 text-[0.98rem] leading-snug font-semibold">
            <Link
              href={routes.card(locale, card.slug)}
              className="hover:text-cyan transition-colors"
            >
              {pick(card.name, locale)}
            </Link>
          </h3>
          {issuer ? (
            <p className="text-dim mt-0.5 text-[0.72rem]">{pick(issuer.name, locale)}</p>
          ) : null}
        </div>
      </div>

      {/* 数値は横幅いっぱいに置きます。券面の横だと狭い画面で桁が隣とくっつくためです */}
      <dl className="border-line/40 mt-4 grid grid-cols-3 gap-2 border-t pt-3">
        <div>
          <dt className="text-dim text-[0.66rem]">{dictionary.card.annualFee}</dt>
          <dd className="numeric text-ink text-[0.92rem] font-semibold">
            {formatAnnualFee(card.annualFee, locale, dictionary.common.free)}
          </dd>
        </div>
        <div>
          <dt className="text-dim text-[0.66rem]">{dictionary.card.baseRate}</dt>
          <dd className="numeric text-cyan text-[0.92rem] font-semibold">{card.baseRate}%</dd>
        </div>
        <div>
          <dt className="text-dim text-[0.66rem]">{dictionary.card.score}</dt>
          <dd className="numeric text-gold text-[0.92rem] font-semibold">{score.toFixed(2)}</dd>
        </div>
      </dl>

      {!compact ? (
        <>
          <p className="text-mist mt-3 line-clamp-3 text-[0.8rem] leading-relaxed">
            {pick(card.summary, locale)}
          </p>

          {campaign ? (
            <p className="border-amber/35 bg-amber/8 text-amber mt-3 rounded-lg border px-3 py-2 text-[0.74rem] leading-snug">
              <span className="font-semibold">{dictionary.card.campaign}</span>
              {": "}
              {pick(campaign.title, locale)}
              {campaign.maxValue > 0
                ? `（${dictionary.card.upTo} ${formatYen(campaign.maxValue, locale)}）`
                : ""}
              <span className="text-dim ms-1">〜{formatDate(campaign.endsOn, locale)}</span>
            </p>
          ) : null}

          <ul className="text-dim mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem]">
            <li>{card.brands.map((b) => brandLabels[b]).join(" / ")}</li>
            <li>
              {dictionary.card.issueSpeed}:{" "}
              {card.issueDays === 0 ? "即時" : `${card.issueDays}${dictionary.card.days}`}
            </li>
            {card.lounges.ja.length > 0 ? <li>{dictionary.card.lounge}</li> : null}
            {card.mileRate > 0 ? <li>{dictionary.card.mileTransfer}</li> : null}
          </ul>
        </>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <AffiliateCta
          itemId={card.id}
          officialUrl={card.officialUrl}
          affiliateId={card.affiliateId}
          placement={placement}
          locale={locale}
          label={dictionary.card.official}
          adLabel={dictionary.affiliate.label}
          adTitle={dictionary.affiliate.disclosure}
          position={rank ?? 0}
        />
        <Link
          href={routes.card(locale, card.slug)}
          className="border-line text-mist hover:border-cyan/50 hover:text-ink rounded-full border px-3 py-1.5 text-[0.75rem] transition-colors"
        >
          {dictionary.card.detail}
        </Link>
        <CompareToggle
          cardId={card.id}
          addLabel={dictionary.card.compare}
          removeLabel={dictionary.card.compareRemove}
        />
      </div>

      <p className="text-dim mt-3 text-[0.66rem]">
        {dictionary.common.verifiedAt}: {formatDate(card.verifiedOn, locale)}
      </p>
    </Panel>
  );
}
