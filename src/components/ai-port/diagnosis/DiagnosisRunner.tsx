"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { Diagnosis } from "@/data/ai-port/diagnosis";
import { findTool } from "@/data/ai-port/tools";
import { aiPortPath } from "@/data/ai-port/site";
import { accentClass } from "@/data/ai-port/taxonomy";
import { isComplete, scoreDiagnosis, type Answers } from "@/lib/ai-port/diagnosis";
import { GlassCard, GhostLink, PrimaryLink } from "@/components/ai-port/ui/Primitives";
import { ToolCard } from "@/components/ai-port/tools/ToolCard";
import { cn } from "@/lib/utils";

/**
 * AI診断の実行部分。
 *
 * ■ 回答はサーバーへ送りません
 *   採点はすべてブラウザ内で完結します（純粋関数：lib/ai-port/diagnosis.ts）。
 *   個人の仕事の状況を答えてもらう内容なので、送信しない設計にしています。
 *   その旨は画面にも明記します（黙って送らないことを、黙っていない）。
 *
 * ■ 結果ページは別URLにしない
 *   結果は回答内容に依存するため、URLを分けると
 *   中身のないページが検索エンジンにインデックスされてしまいます。
 *   同じURL内で結果を表示し、共有はテキストのコピーで行います。
 */
export function DiagnosisRunner({ diagnosis }: { diagnosis: Diagnosis }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = diagnosis.questions[index];
  const progress = Math.round((Object.keys(answers).length / diagnosis.questions.length) * 100);

  const scored = useMemo(
    () => (finished ? scoreDiagnosis(diagnosis, answers) : null),
    [finished, diagnosis, answers],
  );

  const choose = (choiceId: string) => {
    const next = { ...answers, [question.id]: choiceId };
    setAnswers(next);

    if (index + 1 < diagnosis.questions.length) {
      setIndex(index + 1);
      return;
    }
    if (isComplete(diagnosis, next)) setFinished(true);
  };

  const restart = () => {
    setAnswers({});
    setIndex(0);
    setFinished(false);
  };

  if (scored) {
    const { result, runnerUp, confidence } = scored;
    const tools = result.toolSlugs.map((slug) => findTool(slug)).filter(Boolean);

    return (
      <div>
        <GlassCard className="relative overflow-hidden p-7 sm:p-10">
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-gradient-to-br opacity-20 blur-3xl",
              accentClass[result.accent],
            )}
          />

          <p className="font-ai-mono text-ai-haze relative text-[0.62rem] tracking-[0.24em] uppercase">
            診断結果
          </p>

          <h2 className="relative mt-4 text-[1.5rem] leading-[1.35] sm:text-[1.9rem]">
            <span
              className={cn(
                "bg-gradient-to-r bg-clip-text text-transparent",
                accentClass[result.accent],
              )}
            >
              {result.title}
            </span>
          </h2>

          <p className="text-ai-white relative mt-3 text-[1rem] leading-[1.8]">{result.catch}</p>
          <p className="text-ai-mist relative mt-5 text-[0.88rem] leading-[2]">
            {result.description}
          </p>

          <div className="relative mt-6 flex flex-wrap items-center gap-4">
            <div className="min-w-[12rem] flex-1">
              <p className="text-ai-dim text-[0.7rem]">
                傾向の強さ
                <span className="ml-2" translate="no">
                  {Math.round(confidence * 100)}%
                </span>
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r", accentClass[result.accent])}
                  style={{ width: `${Math.round(confidence * 100)}%` }}
                />
              </div>
            </div>

            {runnerUp ? (
              <p className="text-ai-dim text-[0.74rem]">
                次点：<span className="text-ai-mist">{runnerUp.title}</span>
              </p>
            ) : null}
          </div>
        </GlassCard>

        <section className="mt-10">
          <h3 className="text-ai-white text-[1.1rem]">次にやること</h3>
          <ol className="mt-5 grid gap-3">
            {result.actions.map((action, actionIndex) => (
              <li key={action}>
                <GlassCard className="flex gap-4 p-5">
                  <span
                    className="font-ai-display from-ai-cyan to-ai-violet shrink-0 bg-gradient-to-br bg-clip-text text-[1.2rem] leading-none font-bold text-transparent"
                    translate="no"
                  >
                    {actionIndex + 1}
                  </span>
                  <p className="text-ai-mist text-[0.87rem] leading-[1.95]">{action}</p>
                </GlassCard>
              </li>
            ))}
          </ol>
        </section>

        {tools.length > 0 ? (
          <section className="mt-12">
            <h3 className="text-ai-white text-[1.1rem]">検討したいツール</h3>
            <p className="text-ai-haze mt-2 text-[0.82rem]">
              料金は変動するため掲載していません。詳細と最新の料金は各公式サイトでご確認ください。
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool!.slug}>
                  <ToolCard tool={tool!} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-12 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={restart}
            className="text-ai-mist hover:text-ai-cyan inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-[0.85rem] transition-colors hover:border-white/30"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            もう一度診断する
          </button>
          <PrimaryLink href={aiPortPath("/diagnosis")}>他の診断を見る</PrimaryLink>
          <GhostLink href={aiPortPath("/chat")}>AIチャットで相談する</GhostLink>
        </div>

        <p className="text-ai-dim mt-8 rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3 text-[0.72rem] leading-[1.9]">
          この診断は編集部が設計した簡易的な指標です。結果は選択肢の傾向を整理したもので、
          成果や収益を保証するものではありません。回答内容はブラウザ内でのみ処理し、サーバーへは送信していません。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-ai-dim font-ai-mono text-[0.68rem] tracking-[0.14em]" translate="no">
          Q{index + 1} / {diagnosis.questions.length}
        </p>
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex(index - 1)}
            className="text-ai-haze hover:text-ai-cyan inline-flex items-center gap-1.5 text-[0.76rem] transition-colors"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            前の質問へ
          </button>
        ) : null}
      </div>

      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-white/8"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="診断の進捗"
      >
        <div
          className="from-ai-cyan via-ai-blue to-ai-violet h-full rounded-full bg-gradient-to-r transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <GlassCard className="mt-8 p-7 sm:p-9">
        <h2 className="text-ai-white text-[1.15rem] leading-[1.6] sm:text-[1.3rem]">
          {question.text}
        </h2>
        {question.help ? (
          <p className="text-ai-haze mt-3 text-[0.8rem] leading-[1.9]">{question.help}</p>
        ) : null}

        <ul className="mt-7 grid gap-2.5">
          {question.choices.map((choice) => {
            const selected = answers[question.id] === choice.id;
            return (
              <li key={choice.id}>
                <button
                  type="button"
                  onClick={() => choose(choice.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-xl border px-5 py-4 text-left text-[0.88rem] leading-[1.7] transition-all duration-300",
                    selected
                      ? "border-ai-cyan/55 bg-ai-cyan/10 text-ai-white"
                      : "text-ai-mist hover:border-ai-cyan/35 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "font-ai-mono grid size-6 shrink-0 place-items-center rounded-full border text-[0.62rem]",
                      selected ? "border-ai-cyan text-ai-cyan" : "text-ai-dim border-white/20",
                    )}
                  >
                    {choice.id.toUpperCase()}
                  </span>
                  {choice.label}
                </button>
              </li>
            );
          })}
        </ul>
      </GlassCard>

      <p className="text-ai-dim mt-6 text-[0.74rem] leading-[1.9]">
        回答はブラウザ内でのみ処理し、サーバーへは送信していません。
        <Link
          href={aiPortPath("/about")}
          className="text-ai-mist ml-1.5 underline underline-offset-4"
        >
          運営方針
        </Link>
      </p>
    </div>
  );
}
