"use client";

/**
 * カード比較。
 *
 * ■ 表とカードの切り替え
 *   横スクロールだけに頼ると、スマートフォンで「いま何の項目を見ているか」が分からなくなります。
 *   狭い画面では既定でカード型表示に切り替え、表示形式は利用者が選べるようにしています。
 *
 * ■ 1列目の固定
 *   表形式のときは項目名の列を `position: sticky` で固定し、横スクロール中も行が読める状態を保ちます。
 */
import { useMemo, useState } from "react";
import Link from "next/link";

import { cards as allCards, getCardById } from "@/cardport/data/cards";
import { brandLabels, getIssuer } from "@/cardport/data/issuers";
import type { Card } from "@/cardport/data/types";
import type { Dictionary } from "@/cardport/i18n";
import { formatAnnualFee, formatDate, formatYen } from "@/cardport/i18n/format";
import { pick, pickList } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import { computeScore } from "@/cardport/lib/scoring";
import { routes } from "@/cardport/lib/routes";
import { useCompare, MAX_COMPARE } from "@/cardport/hooks/useCompare";
import { Button, Notice, Panel, cx } from "@/cardport/components/ui/primitives";
import { CardArt } from "@/cardport/components/visual/CardArt";
import { AffiliateCta } from "./AffiliateCta";

type Row = { label: string; render: (card: Card) => string };

export function CompareView({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const { ids, remove, clear, toggle } = useCompare();
  const [mode, setMode] = useState<"table" | "cards">("table");

  const selected = useMemo(
    () => ids.map((id) => getCardById(id)).filter((card): card is Card => Boolean(card)),
    [ids],
  );

  const yes = dictionary.common.yes;
  const no = dictionary.common.no;

  const rows: Row[] = [
    {
      label: dictionary.card.issuer,
      render: (card) => pick(getIssuer(card.issuerId)?.name ?? { ja: "" }, locale),
    },
    { label: dictionary.card.rank, render: (card) => dictionary.rank[card.rank] },
    {
      label: dictionary.card.brands,
      render: (card) => card.brands.map((b) => brandLabels[b]).join(" / "),
    },
    {
      label: dictionary.card.annualFee,
      render: (card) => formatAnnualFee(card.annualFee, locale, dictionary.common.free),
    },
    {
      label: dictionary.card.annualFeeFirstYear,
      render: (card) => formatAnnualFee(card.firstYearFee, locale, dictionary.common.free),
    },
    {
      label: dictionary.card.familyCardFee,
      render: (card) => formatAnnualFee(card.familyCardFee, locale, dictionary.common.free),
    },
    {
      label: dictionary.card.etcFee,
      render: (card) => formatAnnualFee(card.etcFee, locale, dictionary.common.free),
    },
    { label: dictionary.card.baseRate, render: (card) => `${card.baseRate}%` },
    { label: dictionary.card.maxRate, render: (card) => `${card.maxRate}%` },
    { label: dictionary.card.pointName, render: (card) => pick(card.pointName, locale) },
    { label: dictionary.card.pointExpiry, render: (card) => pick(card.pointExpiry, locale) },
    {
      label: dictionary.card.mileTransfer,
      render: (card) => (card.mileRate > 0 ? `${yes}（1pt = ${card.mileRate}mile）` : no),
    },
    {
      label: dictionary.card.travelInsurance,
      render: (card) =>
        card.travelInsuranceOverseas.amount > 0
          ? `${formatYen(card.travelInsuranceOverseas.amount, locale)}（${
              card.travelInsuranceOverseas.condition === "auto"
                ? locale === "ja"
                  ? "自動付帯"
                  : "automatic"
                : locale === "ja"
                  ? "利用付帯"
                  : "usage-based"
            }）`
          : no,
    },
    {
      label: dictionary.card.shoppingInsurance,
      render: (card) =>
        card.shoppingInsurance.amount > 0 ? formatYen(card.shoppingInsurance.amount, locale) : no,
    },
    {
      label: dictionary.card.lounge,
      render: (card) =>
        card.lounges.ja.length > 0 ? pickList(card.lounges, locale).join(" / ") : no,
    },
    { label: dictionary.card.touchPayment, render: (card) => (card.touchPayment ? yes : no) },
    {
      label: dictionary.card.mobilePayment,
      render: (card) => card.mobilePayments.join(" / ") || no,
    },
    {
      label: dictionary.card.electronicMoney,
      render: (card) => card.electronicMoney.join(" / ") || no,
    },
    {
      label: dictionary.card.issueSpeed,
      render: (card) =>
        card.issueDays === 0
          ? locale === "ja"
            ? "即時"
            : "Instant"
          : `${card.issueDays}${dictionary.card.days}`,
    },
    { label: dictionary.card.overseas, render: (card) => `${card.fxFee}%` },
    { label: dictionary.card.eligibility, render: (card) => pick(card.eligibilityNote, locale) },
    { label: dictionary.card.limit, render: (card) => pick(card.limitNote, locale) },
    {
      label: dictionary.card.accounting,
      render: (card) => card.business?.accountingIntegrations.join(" / ") ?? no,
    },
    { label: dictionary.card.score, render: (card) => computeScore(card).toFixed(2) },
    { label: dictionary.common.verifiedAt, render: (card) => formatDate(card.verifiedOn, locale) },
  ];

  if (selected.length === 0) {
    return (
      <Panel className="p-8 text-center">
        <p className="text-mist text-[0.86rem]">
          {locale === "ja"
            ? "比較したいカードを選ぶと、ここに並べて表示します。"
            : "Pick the cards you want and they will line up here."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {allCards.slice(0, 6).map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => toggle(card.id)}
              className="border-line text-mist hover:border-cyan/50 hover:text-ink rounded-full border px-3 py-1.5 text-[0.75rem] transition-colors"
            >
              + {pick(card.name, locale)}
            </button>
          ))}
        </div>
        <Link
          href={routes.cards(locale)}
          className="text-cyan mt-5 inline-block text-[0.8rem] hover:underline"
        >
          {dictionary.nav.cards} →
        </Link>
      </Panel>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-mist text-[0.8rem]">
          {selected.length} / {MAX_COMPARE}
        </p>
        <div className="flex items-center gap-2">
          <div className="border-line flex rounded-full border p-0.5">
            {(["table", "cards"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={cx(
                  "rounded-full px-3 py-1 text-[0.72rem] transition-colors",
                  mode === value ? "bg-cyan/18 text-cyan" : "text-mist hover:text-ink",
                )}
              >
                {value === "table"
                  ? locale === "ja"
                    ? "表"
                    : "Table"
                  : locale === "ja"
                    ? "カード"
                    : "Cards"}
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={clear} className="!px-3 !py-1 text-[0.72rem]">
            {dictionary.common.reset}
          </Button>
        </div>
      </div>

      {/* 表形式：広い画面向け。狭い画面ではカード型を選べます */}
      <div className={cx(mode === "table" ? "block" : "hidden")}>
        <div className="border-line glass overflow-x-auto rounded-2xl border">
          <table className="sticky-col w-full min-w-[46rem] border-collapse text-[0.78rem]">
            <caption className="sr-only">{dictionary.sections.comparison}</caption>
            <thead>
              <tr className="border-line/70 border-b">
                <th scope="col" className="text-dim w-40 p-3 text-start text-[0.7rem] font-normal">
                  &nbsp;
                </th>
                {selected.map((card) => (
                  <th key={card.id} scope="col" className="min-w-52 p-3 text-start align-top">
                    <div className="card3d-scene mb-2 w-28">
                      <CardArt card={card} locale={locale} sheen={false} />
                    </div>
                    <Link
                      href={routes.card(locale, card.slug)}
                      className="hover:text-cyan font-semibold"
                    >
                      {pick(card.name, locale)}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(card.id)}
                      className="text-dim hover:text-danger ms-2 text-[0.7rem]"
                    >
                      ×
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-line/40 border-b last:border-0">
                  <th scope="row" className="text-dim p-3 text-start text-[0.72rem] font-normal">
                    {row.label}
                  </th>
                  {selected.map((card) => (
                    <td key={card.id} className="text-mist p-3 align-top">
                      {row.render(card)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="text-dim p-3 text-start text-[0.72rem] font-normal">
                  &nbsp;
                </th>
                {selected.map((card, index) => (
                  <td key={card.id} className="p-3">
                    <AffiliateCta
                      itemId={card.id}
                      officialUrl={card.officialUrl}
                      affiliateId={card.affiliateId}
                      placement="comparison"
                      locale={locale}
                      label={dictionary.card.official}
                      adLabel={dictionary.affiliate.label}
                      adTitle={dictionary.affiliate.disclosure}
                      position={index + 1}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* カード型：1枚ずつ縦に読める形。狭い画面でも項目名を見失いません */}
      <div className={cx(mode === "cards" ? "grid gap-4 sm:grid-cols-2" : "hidden")}>
        {selected.map((card, index) => (
          <Panel key={card.id} as="article" className="p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="card3d-scene w-24 shrink-0">
                <CardArt card={card} locale={locale} sheen={false} />
              </div>
              <div className="min-w-0">
                <Link
                  href={routes.card(locale, card.slug)}
                  className="hover:text-cyan font-semibold"
                >
                  {pick(card.name, locale)}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(card.id)}
                  className="text-dim hover:text-danger ms-2 text-[0.72rem]"
                >
                  {dictionary.card.compareRemove}
                </button>
              </div>
            </div>
            <dl className="border-line/40 divide-line/30 divide-y border-t">
              {rows.map((row) => (
                <div key={row.label} className="grid grid-cols-[9rem_1fr] gap-2 py-2">
                  <dt className="text-dim text-[0.72rem]">{row.label}</dt>
                  <dd className="text-mist text-[0.76rem]">{row.render(card)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <AffiliateCta
                itemId={card.id}
                officialUrl={card.officialUrl}
                affiliateId={card.affiliateId}
                placement="comparison"
                locale={locale}
                label={dictionary.card.official}
                adLabel={dictionary.affiliate.label}
                adTitle={dictionary.affiliate.disclosure}
                position={index + 1}
              />
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-6">
        <Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>
      </div>
    </div>
  );
}
