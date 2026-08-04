"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { localePath } from "@/portal/i18n/config";
import {
  decodeAnswers,
  encodeAnswers,
  isComplete,
  scoreDiagnosis,
  type Answers,
} from "@/portal/lib/diagnosis";
import { t, tList } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { Diagnosis, Exchange, Tool, Wallet } from "@/portal/lib/types";
import type { LearnArticle } from "@/portal/lib/types";
import { GlassCard, NeonButton, NeonLink, NoticeBox } from "@/portal/components/ui/primitives";

/** 未回答を表す共有の空オブジェクト（参照を固定するため） */
const NO_ANSWERS: Answers = {};

/**
 * 診断の実行画面。
 *
 * ■ 結果の表現
 *   「この銘柄を買うべき」とは書きません。
 *   条件に近い選択肢と、その理由・注意点を並べるだけにとどめます。
 *
 * ■ 共有
 *   回答を短い符号にしてURLに載せます（サーバーに保存しません）。
 *   共有先では同じ結果が再現されます。
 */
export function DiagnosisRunner({
  diagnosis,
  locale,
  dict,
  catalog,
  initialAnswers,
}: {
  diagnosis: Diagnosis;
  locale: string;
  dict: Dictionary;
  /** 結果から誘導する先の実データ */
  catalog: {
    exchanges: Exchange[];
    wallets: Wallet[];
    tools: Tool[];
    learn: LearnArticle[];
  };
  initialAnswers?: Answers;
}) {
  /**
   * 共有リンク（?a=...）から回答を復元します。
   *
   * サーバー側で `searchParams` を読むとページが動的扱いになり静的書き出しができないため、
   * クライアント側の `useSearchParams` から読みます。
   * 一度でも自分で回答したら、そちらを優先します。
   */
  const sharedCode = useSearchParams().get("a");
  const sharedAnswers = useMemo(() => {
    if (initialAnswers) return initialAnswers;
    if (!sharedCode) return null;
    const restored = decodeAnswers(diagnosis, sharedCode);
    return isComplete(diagnosis, restored) ? restored : null;
  }, [diagnosis, sharedCode, initialAnswers]);

  const [own, setOwn] = useState<{ answers: Answers; step: number } | null>(null);

  // 参照を固定するため定数を使います（毎回 `{}` を作ると useMemo が効きません）
  const answers = own?.answers ?? sharedAnswers ?? NO_ANSWERS;
  const step = own?.step ?? (sharedAnswers ? diagnosis.questions.length : 0);

  function setStep(update: number | ((previous: number) => number)) {
    setOwn((current) => {
      const base = current ?? {
        answers: sharedAnswers ?? {},
        step: sharedAnswers ? diagnosis.questions.length : 0,
      };
      return { ...base, step: typeof update === "function" ? update(base.step) : update };
    });
  }

  const finished = step >= diagnosis.questions.length && isComplete(diagnosis, answers);
  const scored = useMemo(
    () => (finished ? scoreDiagnosis(diagnosis, answers) : []),
    [finished, diagnosis, answers],
  );

  function choose(questionId: string, optionId: string) {
    setOwn((current) => {
      const base = current ?? {
        answers: sharedAnswers ?? {},
        step: sharedAnswers ? diagnosis.questions.length : 0,
      };
      return {
        answers: { ...base.answers, [questionId]: optionId },
        step: base.step + 1,
      };
    });
  }

  function restart() {
    setOwn({ answers: {}, step: 0 });
  }

  if (!finished) {
    const question = diagnosis.questions[Math.min(step, diagnosis.questions.length - 1)];
    const progress = ((step + 1) / diagnosis.questions.length) * 100;

    return (
      <GlassCard className="p-6 sm:p-8" glow={false}>
        <div className="mb-6">
          <p className="mb-2 font-mono text-xs text-(--color-ink-dim)">
            {dict.diagnosis.question} {step + 1} {dict.diagnosis.of} {diagnosis.questions.length}
          </p>
          <div
            className="h-1 overflow-hidden rounded-full bg-white/8"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={diagnosis.questions.length}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-(--color-cyan) to-(--color-violet) transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <fieldset>
          <legend className="mb-5 text-lg font-semibold sm:text-xl">
            {t(question.label, locale)}
          </legend>
          {question.help ? (
            <p className="mb-4 text-sm text-(--color-ink-soft)">{t(question.help, locale)}</p>
          ) : null}

          <ul className="grid gap-2.5">
            {question.options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => choose(question.id, option.id)}
                  className="glass edge-glow w-full rounded-xl px-4 py-3.5 text-start text-sm transition-transform hover:-translate-y-0.5"
                >
                  {t(option.label, locale)}
                </button>
              </li>
            ))}
          </ul>
        </fieldset>

        {step > 0 ? (
          <NeonButton tone="ghost" className="mt-6 px-0" onClick={() => setStep((s) => s - 1)}>
            ← {dict.diagnosis.prev}
          </NeonButton>
        ) : null}
      </GlassCard>
    );
  }

  const [top, ...others] = scored;
  const result = top.result;
  const shareCode = encodeAnswers(diagnosis, answers);
  const sharePath = `${localePath(locale, `/diagnosis/${diagnosis.slug}`)}?a=${shareCode}`;

  const exchanges = catalog.exchanges.filter((entry) => result.exchangeIds?.includes(entry.id));
  const wallets = catalog.wallets.filter((entry) => result.walletIds?.includes(entry.id));
  const tools = catalog.tools.filter((entry) => result.toolIds?.includes(entry.id));
  const learn = catalog.learn.filter((entry) => result.learnIds?.includes(entry.id));

  return (
    <div className="grid gap-6">
      <GlassCard className="p-6 sm:p-8" glow={false}>
        <p className="eyebrow mb-2">{dict.diagnosis.result}</p>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          <span className="text-gradient">{t(result.title, locale)}</span>
        </h2>
        <p className="mt-3 text-sm text-(--color-ink-soft) sm:text-base">
          {t(result.description, locale)}
        </p>

        <h3 className="mt-6 mb-2 text-sm font-semibold">{dict.diagnosis.reason}</h3>
        <ul className="grid gap-1.5 text-sm text-(--color-ink-soft)">
          {tList(result.reasons, locale).map((reason) => (
            <li key={reason} className="flex gap-2">
              <span aria-hidden="true" className="text-(--color-cyan)">
                ▸
              </span>
              {reason}
            </li>
          ))}
        </ul>

        {others.length > 0 ? (
          <dl className="mt-6 flex flex-wrap gap-x-5 gap-y-1 border-t border-(--color-hairline) pt-4 text-xs text-(--color-ink-dim)">
            {scored.map((entry) => (
              <div key={entry.result.id} className="flex gap-1.5">
                <dt>{t(entry.result.title, locale)}</dt>
                <dd className="tabular font-mono">{entry.share}%</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </GlassCard>

      {tList(result.cautions, locale).length > 0 ? (
        <NoticeBox tone="amber" title={dict.learn.caution}>
          <ul className="grid gap-1.5">
            {tList(result.cautions, locale).map((caution) => (
              <li key={caution}>{caution}</li>
            ))}
          </ul>
        </NoticeBox>
      ) : null}

      {exchanges.length > 0 ? (
        <section>
          <h3 className="mb-3 text-lg font-semibold">{dict.nav.exchanges}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {exchanges.map((exchange) => (
              <li key={exchange.id}>
                <GlassCard className="p-4">
                  <Link href={localePath(locale, `/exchanges/${exchange.slug}`)}>
                    <p className="font-semibold">{exchange.name}</p>
                    <p className="mt-1 text-xs text-(--color-ink-soft)">
                      {t(exchange.summary, locale)}
                    </p>
                  </Link>
                </GlassCard>
              </li>
            ))}
          </ul>
          <NeonLink href={localePath(locale, "/exchanges")} tone="outline" className="mt-4">
            {dict.diagnosis.seeComparison}
          </NeonLink>
        </section>
      ) : null}

      {wallets.length > 0 ? (
        <section>
          <h3 className="mb-3 text-lg font-semibold">{dict.nav.wallets}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {wallets.map((wallet) => (
              <li key={wallet.id}>
                <GlassCard className="p-4">
                  <Link href={localePath(locale, `/wallets/${wallet.slug}`)}>
                    <p className="font-semibold">{wallet.name}</p>
                    <p className="mt-1 text-xs text-(--color-ink-soft)">
                      {t(wallet.summary, locale)}
                    </p>
                  </Link>
                </GlassCard>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tools.length > 0 ? (
        <section>
          <h3 className="mb-3 text-lg font-semibold">{dict.nav.tools}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tools.map((tool) => (
              <li key={tool.id}>
                <GlassCard className="p-4">
                  <Link href={localePath(locale, `/tools/${tool.slug}`)}>
                    <p className="font-semibold">{tool.name}</p>
                    <p className="mt-1 text-xs text-(--color-ink-soft)">
                      {t(tool.summary, locale)}
                    </p>
                  </Link>
                </GlassCard>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {learn.length > 0 ? (
        <section>
          <h3 className="mb-3 text-lg font-semibold">{dict.learn.nextSteps}</h3>
          <ul className="grid gap-2">
            {learn.map((article) => (
              <li key={article.id}>
                <Link
                  href={localePath(locale, `/learn/${article.slug}`)}
                  className="glass block rounded-xl px-4 py-3 text-sm transition-colors hover:text-white"
                >
                  {t(article.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <NoticeBox tone="cyan">{dict.diagnosis.disclaimer}</NoticeBox>

      <div className="flex flex-wrap gap-3">
        <NeonButton tone="outline" onClick={restart}>
          {dict.diagnosis.restart}
        </NeonButton>
        <NeonLink href={sharePath} tone="ghost">
          {dict.diagnosis.share}
        </NeonLink>
      </div>
    </div>
  );
}
