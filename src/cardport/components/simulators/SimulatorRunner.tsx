"use client";

/**
 * シミュレーター。
 *
 * ■ 前提を必ず出す
 *   数字だけを出すと、読者は自分の状況に当てはめられません。
 *   計算式と前提条件を、結果と同じ画面に常に表示します。
 *
 * ■ 基本還元率で計算する
 *   条件付きの最大還元率で計算すると、達成できない前提の期待値になります。
 */
import { useMemo, useState } from "react";
import Link from "next/link";

import { cards as allCards } from "@/cardport/data/cards";
import { spendCategories } from "@/cardport/data/simulators";
import type { Card, Simulator } from "@/cardport/data/types";
import type { Dictionary } from "@/cardport/i18n";
import { formatNumber, formatYen } from "@/cardport/i18n/format";
import { pick, pickList } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import {
  breakEvenSpend,
  exchangeOptions,
  simulateAnnual,
  simulateFxFee,
  simulateMiles,
  simulateMultiCard,
  simulateTravelBenefit,
  totalMonthlySpend,
  type SpendInput,
} from "@/cardport/lib/simulator-engine";
import { routes } from "@/cardport/lib/routes";
import { Notice, Panel, StatBlock, cx } from "@/cardport/components/ui/primitives";
import { CountUp } from "@/cardport/components/visual/CountUp";

const initialSpend: SpendInput = Object.fromEntries(
  spendCategories.map((category) => [category.id, category.defaultValue]),
);

export function SimulatorRunner({
  simulator,
  locale,
  dictionary,
}: {
  simulator: Simulator;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [spend, setSpend] = useState<SpendInput>(initialSpend);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    allCards.slice(0, 3).map((card) => card.id),
  );
  const [loungeVisits, setLoungeVisits] = useState(3);
  const [trips, setTrips] = useState(2);
  const [overseasSpend, setOverseasSpend] = useState(300000);
  const [points, setPoints] = useState(20000);
  const [exchangeId, setExchangeId] = useState<string>(exchangeOptions[0].id);

  const selected = useMemo(
    () => allCards.filter((card) => selectedIds.includes(card.id)),
    [selectedIds],
  );
  const monthly = totalMonthlySpend(spend);
  const annualSpend = monthly * 12;

  const toggleCard = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id].slice(-4),
    );

  const needsSpendInput = [
    "annual-points",
    "card-compare",
    "business-expense",
    "switch-benefit",
    "multi-card",
  ].includes(simulator.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <Panel as="aside" className="h-fit p-5 lg:sticky lg:top-24">
        <h3 className="mb-4 text-[0.92rem] font-semibold">{dictionary.simulator.input}</h3>

        {needsSpendInput ? (
          <div className="space-y-3">
            {spendCategories.map((category) => (
              <div key={category.id} className="flex items-center gap-3">
                <label htmlFor={`spend-${category.id}`} className="text-dim flex-1 text-[0.74rem]">
                  {pick(category.label, locale)}
                </label>
                <input
                  id={`spend-${category.id}`}
                  type="number"
                  min={0}
                  step={1000}
                  value={spend[category.id] ?? 0}
                  onChange={(event) =>
                    setSpend((current) => ({
                      ...current,
                      [category.id]: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                  className="numeric border-line bg-navy/70 text-ink focus:border-cyan w-28 rounded-lg border px-2 py-1.5 text-end text-[0.78rem] outline-none"
                />
              </div>
            ))}
            <p className="border-line/50 text-mist mt-3 flex justify-between border-t pt-3 text-[0.8rem]">
              <span>{dictionary.simulator.monthlySpend}</span>
              <span className="numeric text-cyan font-semibold">{formatYen(monthly, locale)}</span>
            </p>
          </div>
        ) : null}

        {simulator.id === "travel-benefit" ? (
          <div className="space-y-4">
            <NumberField
              id="lounge-visits"
              label={locale === "ja" ? "年間のラウンジ利用回数" : "Lounge visits per year"}
              value={loungeVisits}
              onChange={setLoungeVisits}
            />
            <NumberField
              id="trips"
              label={locale === "ja" ? "年間の旅行回数" : "Trips per year"}
              value={trips}
              onChange={setTrips}
            />
          </div>
        ) : null}

        {simulator.id === "fx-fee" ? (
          <NumberField
            id="overseas"
            label={locale === "ja" ? "年間の海外利用額（円）" : "Annual overseas spend (JPY)"}
            value={overseasSpend}
            step={10000}
            onChange={setOverseasSpend}
          />
        ) : null}

        {simulator.id === "point-exchange" ? (
          <div className="space-y-4">
            <NumberField
              id="points"
              label={locale === "ja" ? "保有ポイント" : "Points held"}
              value={points}
              step={1000}
              onChange={setPoints}
            />
            <div>
              <label htmlFor="exchange" className="text-dim mb-1.5 block text-[0.74rem]">
                {locale === "ja" ? "交換先" : "Redemption"}
              </label>
              <select
                id="exchange"
                value={exchangeId}
                onChange={(event) => setExchangeId(event.target.value)}
                className="border-line bg-navy/70 text-ink focus:border-cyan w-full rounded-lg border px-2.5 py-2 text-[0.78rem] outline-none"
              >
                {exchangeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {pick(option.label, locale)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {simulator.id !== "point-exchange" && simulator.id !== "fx-fee" ? null : null}

        <div className="border-line/50 mt-5 border-t pt-4">
          <p className="text-dim mb-2 text-[0.74rem]">
            {locale === "ja" ? "対象カード（最大4枚）" : "Cards to compare (up to 4)"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => toggleCard(card.id)}
                aria-pressed={selectedIds.includes(card.id)}
                className={cx(
                  "rounded-full border px-2.5 py-1 text-[0.7rem] transition-colors",
                  selectedIds.includes(card.id)
                    ? "border-cyan/60 bg-cyan/15 text-cyan"
                    : "border-line text-dim hover:text-ink",
                )}
              >
                {pick(card.name, locale)}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel glow className="p-5 sm:p-6">
          <h3 className="mb-4 text-[0.95rem] font-semibold">{dictionary.simulator.result}</h3>
          <ResultBody
            simulator={simulator}
            locale={locale}
            dictionary={dictionary}
            cards={selected}
            spend={spend}
            annualSpend={annualSpend}
            loungeVisits={loungeVisits}
            trips={trips}
            overseasSpend={overseasSpend}
            points={points}
            exchangeRate={exchangeOptions.find((option) => option.id === exchangeId)?.rate ?? 1}
          />
        </Panel>

        <Panel className="p-5">
          <h3 className="mb-3 text-[0.88rem] font-semibold">{dictionary.simulator.method}</h3>
          <p className="numeric text-cyan bg-navy/60 border-line rounded-lg border px-3 py-2 text-[0.8rem]">
            {pick(simulator.method, locale)}
          </p>
          <h4 className="text-dim mt-4 mb-2 text-[0.78rem]">{dictionary.simulator.assumptions}</h4>
          <ul className="text-mist space-y-1.5 text-[0.76rem]">
            {pickList(simulator.assumptions, locale).map((line) => (
              <li key={line} className="flex gap-1.5">
                <span className="text-dim">・</span>
                {line}
              </li>
            ))}
          </ul>
        </Panel>

        <Notice tone="warn">{dictionary.simulator.disclaimer}</Notice>

        <div className="flex flex-wrap gap-3">
          <Link href={routes.compare(locale)} className="text-cyan text-[0.82rem] hover:underline">
            {dictionary.sections.comparison} →
          </Link>
          <Link
            href={routes.diagnosisIndex(locale)}
            className="text-cyan text-[0.82rem] hover:underline"
          >
            {dictionary.nav.diagnosis} →
          </Link>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  step = 1,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-dim mb-1.5 block text-[0.74rem]">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className="numeric border-line bg-navy/70 text-ink focus:border-cyan w-full rounded-lg border px-3 py-2 text-[0.82rem] outline-none"
      />
    </div>
  );
}

function ResultBody({
  simulator,
  locale,
  dictionary,
  cards,
  spend,
  annualSpend,
  loungeVisits,
  trips,
  overseasSpend,
  points,
  exchangeRate,
}: {
  simulator: Simulator;
  locale: Locale;
  dictionary: Dictionary;
  cards: Card[];
  spend: SpendInput;
  annualSpend: number;
  loungeVisits: number;
  trips: number;
  overseasSpend: number;
  points: number;
  exchangeRate: number;
}) {
  const yen = (value: number) => formatYen(value, locale);

  if (cards.length === 0) {
    return (
      <p className="text-mist text-[0.84rem]">
        {locale === "ja" ? "対象カードを1枚以上選んでください。" : "Select at least one card."}
      </p>
    );
  }

  if (simulator.id === "point-exchange") {
    return (
      <div>
        <StatBlock
          label={dictionary.simulator.result}
          value={yen(Math.round(points * exchangeRate))}
          accent="gold"
          note={`${formatNumber(points, locale)} pt × ${exchangeRate}`}
        />
        <ul className="mt-5 space-y-2">
          {exchangeOptions.map((option) => (
            <li
              key={option.id}
              className="border-line/40 flex justify-between border-b py-2 text-[0.8rem]"
            >
              <span className="text-mist">{pick(option.label, locale)}</span>
              <span className="numeric text-ink">{yen(Math.round(points * option.rate))}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (simulator.id === "fx-fee") {
    return (
      <ul className="space-y-2">
        {[...cards]
          .sort((a, b) => a.fxFee - b.fxFee)
          .map((card) => (
            <li
              key={card.id}
              className="border-line/40 flex items-center justify-between border-b py-2.5"
            >
              <span className="text-mist text-[0.82rem]">{pick(card.name, locale)}</span>
              <span className="flex items-baseline gap-3">
                <span className="numeric text-dim text-[0.74rem]">{card.fxFee}%</span>
                <span className="numeric text-danger text-[0.95rem] font-semibold">
                  {yen(simulateFxFee(card, overseasSpend))}
                </span>
              </span>
            </li>
          ))}
      </ul>
    );
  }

  if (simulator.id === "travel-benefit") {
    return (
      <ul className="space-y-3">
        {cards.map((card) => {
          const result = simulateTravelBenefit(card, loungeVisits, trips);
          return (
            <li key={card.id} className="border-line/40 border-b pb-3">
              <p className="text-ink mb-2 text-[0.85rem] font-medium">{pick(card.name, locale)}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBlock
                  label={dictionary.card.lounge}
                  value={yen(result.loungeValue)}
                  accent="cyan"
                />
                <StatBlock
                  label={dictionary.card.travelInsurance}
                  value={yen(result.insuranceValue)}
                  accent="violet"
                />
                <StatBlock
                  label={dictionary.card.annualFee}
                  value={yen(result.annualFee)}
                  accent="gold"
                />
                <StatBlock
                  label={dictionary.simulator.netValue}
                  value={yen(result.netValue)}
                  accent={result.netValue >= 0 ? "emerald" : "magenta"}
                />
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  if (simulator.id === "fee-breakeven") {
    return (
      <ul className="space-y-2">
        {cards.map((card) => {
          const required = breakEvenSpend(card);
          return (
            <li
              key={card.id}
              className="border-line/40 flex items-center justify-between border-b py-2.5"
            >
              <span className="text-mist text-[0.82rem]">{pick(card.name, locale)}</span>
              <span className="numeric text-ink text-[0.95rem] font-semibold">
                {card.annualFee === 0
                  ? dictionary.common.free
                  : Number.isFinite(required)
                    ? yen(required)
                    : "—"}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (simulator.id === "mile") {
    return (
      <ul className="space-y-2">
        {cards.map((card) => (
          <li
            key={card.id}
            className="border-line/40 flex items-center justify-between border-b py-2.5"
          >
            <span className="text-mist text-[0.82rem]">{pick(card.name, locale)}</span>
            <span className="numeric text-electric text-[0.95rem] font-semibold">
              {card.mileRate > 0
                ? `${formatNumber(simulateMiles(card, annualSpend), locale)} mile`
                : dictionary.common.no}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (simulator.id === "multi-card") {
    const result = simulateMultiCard(cards, spend);
    return (
      <div>
        <div className="grid grid-cols-3 gap-4">
          <StatBlock
            label={dictionary.simulator.annualPoints}
            value={formatNumber(result.totalPoints, locale)}
            accent="cyan"
          />
          <StatBlock label={dictionary.card.annualFee} value={yen(result.totalFee)} accent="gold" />
          <StatBlock
            label={dictionary.simulator.netValue}
            value={yen(result.netValue)}
            accent={result.netValue >= 0 ? "emerald" : "magenta"}
          />
        </div>
        <ul className="mt-5 space-y-1.5">
          {result.assignments.map((assignment) => {
            const category = spendCategories.find((entry) => entry.id === assignment.categoryId);
            return (
              <li
                key={assignment.categoryId}
                className="border-line/40 flex items-center justify-between border-b py-2 text-[0.78rem]"
              >
                <span className="text-dim">
                  {category ? pick(category.label, locale) : assignment.categoryId}
                </span>
                <span className="text-mist">{pick(assignment.card.name, locale)}</span>
                <span className="numeric text-cyan">
                  {formatNumber(assignment.annualPoints, locale)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // annual-points / card-compare / business-expense / switch-benefit
  const rows = cards.map((card) => ({ card, result: simulateAnnual(card, spend) }));
  const best = [...rows].sort((a, b) => b.result.netValue - a.result.netValue)[0];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBlock
          label={dictionary.simulator.monthlySpend}
          value={yen(annualSpend / 12)}
          accent="cyan"
        />
        <StatBlock
          label={locale === "ja" ? "年間利用額" : "Annual spend"}
          value={yen(annualSpend)}
          accent="electric"
        />
        <div>
          <p className="text-dim text-[0.7rem]">{dictionary.simulator.annualPoints}</p>
          <p className="numeric text-emerald mt-0.5 text-[1.35rem] font-semibold sm:text-[1.6rem]">
            <CountUp
              value={best.result.annualPoints}
              format={(value) => formatNumber(Math.round(value), locale)}
            />
          </p>
        </div>
        <StatBlock
          label={dictionary.simulator.netValue}
          value={yen(best.result.netValue)}
          accent={best.result.netValue >= 0 ? "emerald" : "magenta"}
          note={pick(best.card.name, locale)}
        />
      </div>

      <table className="mt-6 w-full text-[0.78rem]">
        <caption className="sr-only">{dictionary.simulator.result}</caption>
        <thead>
          <tr className="border-line/60 text-dim border-b text-[0.72rem]">
            <th scope="col" className="py-2 text-start font-normal">
              {dictionary.nav.cards}
            </th>
            <th scope="col" className="py-2 text-end font-normal">
              {dictionary.card.baseRate}
            </th>
            <th scope="col" className="py-2 text-end font-normal">
              {dictionary.simulator.annualPoints}
            </th>
            <th scope="col" className="py-2 text-end font-normal">
              {dictionary.card.annualFee}
            </th>
            <th scope="col" className="py-2 text-end font-normal">
              {dictionary.simulator.netValue}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows
            .sort((a, b) => b.result.netValue - a.result.netValue)
            .map(({ card, result }) => (
              <tr key={card.id} className="border-line/30 border-b">
                <td className="text-mist py-2.5">{pick(card.name, locale)}</td>
                <td className="numeric text-dim py-2.5 text-end">{card.baseRate}%</td>
                <td className="numeric text-cyan py-2.5 text-end">
                  {formatNumber(result.annualPoints, locale)}
                </td>
                <td className="numeric text-dim py-2.5 text-end">{yen(result.annualFee)}</td>
                <td
                  className={cx(
                    "numeric py-2.5 text-end font-semibold",
                    result.netValue >= 0 ? "text-emerald" : "text-danger",
                  )}
                >
                  {yen(result.netValue)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
