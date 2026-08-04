"use client";

/**
 * 診断の実行UI。
 *
 * ■ 収集しない情報
 *   氏名・住所・電話番号・年収の具体額は尋ねません。
 *   回答はブラウザ内だけで処理し、サーバーへ送信しません。
 *
 * ■ 共有
 *   回答を短い文字列にしてURLへ載せ、同じ結果を再現できるようにしています。
 *   個人を特定できる情報は含まれません。
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { Diagnosis } from "@/cardport/data/types";
import type { Dictionary } from "@/cardport/i18n";
import { formatNumber } from "@/cardport/i18n/format";
import { pick } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import {
  decodeAnswers,
  encodeAnswers,
  estimateAnnualPoints,
  runDiagnosis,
  type Answers,
} from "@/cardport/lib/diagnosis-engine";
import { routes } from "@/cardport/lib/routes";
import { Badge, Button, Notice, Panel, cx } from "@/cardport/components/ui/primitives";
import { CardTile } from "@/cardport/components/cards/CardTile";

export function DiagnosisRunner({
  diagnosis,
  locale,
  dictionary,
}: {
  diagnosis: Diagnosis;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [ownAnswers, setAnswers] = useState<Answers>({});
  const [ownStep, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  /** 共有リンクを開いたあと「もう一度診断する」を押したか */
  const [dismissedShared, setDismissedShared] = useState(false);

  /**
   * 共有リンク（?a=...）から回答を復元します。
   *
   * 状態へコピーせず、その場で復号して表示に使います。
   * URL は React の外にある入力なので、effect で state へ同期するより
   * 「読んで描画する」ほうが素直で、余分な再描画も起きません。
   */
  const searchParams = useSearchParams();
  const sharedCode = dismissedShared ? null : searchParams.get("a");

  const total = diagnosis.questions.length;
  const answers = useMemo(
    () => (sharedCode ? decodeAnswers(diagnosis, sharedCode) : ownAnswers),
    [sharedCode, diagnosis, ownAnswers],
  );
  const step = sharedCode ? total : ownStep;
  const finished = step >= total;
  const question = finished ? undefined : diagnosis.questions[step];

  const results = useMemo(
    () => (finished ? runDiagnosis(diagnosis, answers, 3) : []),
    [finished, diagnosis, answers],
  );

  const choose = (questionId: string, optionId: string) => {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setStep((current) => current + 1);
  };

  const restart = () => {
    setDismissedShared(true);
    setAnswers({});
    setStep(0);
    setCopied(false);
  };

  const shareUrl = () => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("a", encodeAnswers(diagnosis, answers));
    return url.toString();
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // クリップボードが使えない環境では何もしません（URLはアドレスバーから取得できます）
    }
  };

  if (!finished && question) {
    return (
      <Panel glow className="p-5 sm:p-7">
        <div className="mb-5">
          <div className="text-dim mb-2 flex items-center justify-between text-[0.74rem]">
            <span>
              {dictionary.diagnosis.question} {step + 1} {dictionary.diagnosis.of} {total}
            </span>
            <span className="numeric">{Math.round((step / total) * 100)}%</span>
          </div>
          <div className="bg-slate/70 h-1 overflow-hidden rounded-full">
            <div
              className="from-cyan to-violet h-full rounded-full bg-gradient-to-r transition-all duration-500"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>
        </div>

        <h3 className="text-[1.05rem] leading-snug font-semibold sm:text-[1.2rem]">
          {pick(question.label, locale)}
        </h3>
        {question.help ? (
          <p className="text-dim mt-2 text-[0.76rem] leading-relaxed">
            {pick(question.help, locale)}
          </p>
        ) : null}

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {question.options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => choose(question.id, option.id)}
                className="glass hover:border-cyan/60 hover:bg-cyan/8 w-full rounded-xl px-4 py-3.5 text-start text-[0.86rem] transition-all"
              >
                {pick(option.label, locale)}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center gap-3">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((current) => current - 1)}>
              ← {dictionary.diagnosis.back}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            onClick={() => setStep((current) => current + 1)}
            className="ms-auto"
          >
            {dictionary.diagnosis.skip} →
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <div>
      <Panel glow className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge accent={diagnosis.accent}>{dictionary.diagnosis.result}</Badge>
            <h3 className="mt-2 text-[1.15rem] font-semibold">{pick(diagnosis.title, locale)}</h3>
            <p className="text-mist mt-1 text-[0.82rem]">{dictionary.diagnosis.resultLead}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyShare}>
              {copied ? dictionary.common.copied : dictionary.diagnosis.shareResult}
            </Button>
            <Button variant="ghost" onClick={restart}>
              {dictionary.diagnosis.restart}
            </Button>
          </div>
        </div>
      </Panel>

      <ul className="mt-5 grid gap-4 lg:grid-cols-3">
        {results.map((result, index) => (
          <li key={result.card.id} className="flex flex-col gap-3">
            <div
              className={cx(
                "glass flex items-center justify-between rounded-xl px-4 py-2.5",
                index === 0 && "glow-border",
              )}
            >
              <span className="text-dim text-[0.74rem]">{dictionary.diagnosis.matchScore}</span>
              <span className="numeric text-cyan text-[1.15rem] font-bold">{result.match}%</span>
            </div>

            <CardTile
              card={result.card}
              locale={locale}
              dictionary={dictionary}
              rank={index + 1}
              placement="diagnosis-result"
            />

            <Panel className="p-4">
              <p className="text-dim mb-2 text-[0.72rem]">{dictionary.diagnosis.reason}</p>
              <ul className="text-mist space-y-1 text-[0.76rem]">
                {result.reasons.length > 0 ? (
                  result.reasons.map((reason) => (
                    <li key={reason.ja} className="flex gap-1.5">
                      <span className="text-cyan">・</span>
                      {pick(reason, locale)}
                    </li>
                  ))
                ) : (
                  <li className="text-dim">
                    {locale === "ja"
                      ? "回答から強く一致する条件は見つかりませんでした。条件を変えて再度お試しください。"
                      : "No strong match was found from your answers. Try adjusting them."}
                  </li>
                )}
              </ul>
              <p className="border-line/50 text-dim mt-3 border-t pt-3 text-[0.72rem]">
                {dictionary.diagnosis.estimatedPoints}（
                {locale === "ja" ? "月5万円利用の場合" : "at ¥50,000/month"}）:{" "}
                <span className="numeric text-emerald">
                  {formatNumber(estimateAnnualPoints(result.card, 50000), locale)}
                </span>
              </p>
            </Panel>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-3">
        <Notice tone="warn">{dictionary.diagnosis.disclaimer}</Notice>
        <div className="flex flex-wrap gap-3">
          <Link href={routes.compare(locale)} className="text-cyan text-[0.82rem] hover:underline">
            {dictionary.sections.comparison} →
          </Link>
          <Link
            href={routes.simulatorIndex(locale)}
            className="text-cyan text-[0.82rem] hover:underline"
          >
            {dictionary.nav.simulators} →
          </Link>
          <Link href={routes.cards(locale)} className="text-cyan text-[0.82rem] hover:underline">
            {dictionary.nav.cards} →
          </Link>
        </div>
      </div>
    </div>
  );
}
