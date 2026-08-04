"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Diagnosis } from "../../types";
import { getDictionary, text } from "../../i18n";
import { pickResult, type Answers } from "../../lib/diagnosis";
import { href } from "../../lib/url";
import { getSport } from "../../data/sports";
import { getLeague } from "../../data/leagues";
import { getTeam } from "../../data/teams";
import { getPlayer } from "../../data/players";
import { getStreaming } from "../../data/streaming";
import { getVideo } from "../../data/videos";

/**
 * 診断の実行UI。
 *
 * 結果は URL クエリではなく画面内の状態で保持します。
 * 診断結果ページを検索結果に出すつもりはないため（内容が利用者ごとに変わるため）、
 * 共有はテキストのコピーで行う設計にしています。
 */
export function DiagnosisRunner({ diagnosis, locale }: { diagnosis: Diagnosis; locale: string }) {
  const dict = getDictionary(locale);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const total = diagnosis.questions.length;
  const question = diagnosis.questions[step];
  const result = useMemo(
    () => (done ? pickResult(diagnosis, answers) : null),
    [done, diagnosis, answers],
  );

  const choose = (optionId: string) => {
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    if (step + 1 >= total) {
      setDone(true);
    } else {
      setStep(step + 1);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setDone(false);
  };

  if (done && result) {
    const related = [
      ...result.sportIds.map((id) => {
        const sport = getSport(id);
        return sport
          ? { label: `${sport.glyph} ${text(sport.name, locale)}`, path: `/sports/${sport.slug}` }
          : null;
      }),
      ...result.leagueIds.map((id) => {
        const league = getLeague(id);
        return league
          ? { label: text(league.name, locale), path: `/leagues/${league.slug}` }
          : null;
      }),
      ...result.teamIds.map((id) => {
        const team = getTeam(id);
        return team ? { label: text(team.name, locale), path: `/teams/${team.slug}` } : null;
      }),
      ...result.playerIds.map((id) => {
        const player = getPlayer(id);
        return player
          ? { label: text(player.name, locale), path: `/players/${player.slug}` }
          : null;
      }),
      ...result.videoIds.map((id) => {
        const video = getVideo(id);
        return video ? { label: text(video.title, locale), path: `/videos/${video.slug}` } : null;
      }),
    ].filter((item): item is { label: string; path: string } => Boolean(item));

    const services = result.streamingIds
      .map((id) => getStreaming(id))
      .filter((service): service is NonNullable<typeof service> => Boolean(service));

    return (
      <div className="sp-solid overflow-hidden">
        <div
          className="border-edge border-b px-6 py-8 text-center"
          style={{
            background: `radial-gradient(60% 100% at 50% 0%, ${result.accent}26, transparent 70%)`,
          }}
        >
          <p className="sp-eyebrow mb-2">{dict.yourResult}</p>
          <h2 className="text-ink text-2xl font-extrabold sm:text-3xl">
            {text(result.title, locale)}
          </h2>
          <p className="text-ink-soft mx-auto mt-3 max-w-xl text-sm leading-relaxed">
            {text(result.description, locale)}
          </p>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="sp-eyebrow mb-2">{dict.whyThisResult}</h3>
            <ul className="space-y-1.5">
              {result.reasons.map((reason, index) => (
                <li key={index} className="text-ink-soft flex gap-2 text-sm">
                  <span aria-hidden="true" style={{ color: result.accent }}>
                    ▍
                  </span>
                  {text(reason, locale)}
                </li>
              ))}
            </ul>
          </section>

          {related.length > 0 ? (
            <section>
              <h3 className="sp-eyebrow mb-2">{dict.relatedNews}</h3>
              <ul className="flex flex-wrap gap-1.5">
                {related.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={href(locale, item.path)}
                      className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan inline-block rounded-lg border px-3 py-1.5 text-xs transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {services.length > 0 ? (
            <section>
              <h3 className="sp-eyebrow mb-2">{dict.whereToWatch}</h3>
              <ul className="space-y-1.5">
                {services.map((service) => (
                  <li key={service.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <Link
                      href={href(locale, "/streaming")}
                      className="text-ink-soft hover:text-cyan transition-colors"
                    >
                      {service.name}
                    </Link>
                    <span className="sp-mono text-ink-faint">
                      {dict.verifiedAt}: {service.verifiedAt}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="border-caution/40 bg-caution/10 text-caution rounded-lg border p-3 text-[0.6875rem] leading-relaxed">
            {diagnosis.disclaimer ? text(diagnosis.disclaimer, locale) : dict.diagnosisNote}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={restart}
              className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-4 py-2 text-sm transition-colors"
            >
              {dict.retake}
            </button>
            <Link
              href={href(locale, "/diagnosis")}
              className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-4 py-2 text-sm transition-colors"
            >
              {dict.sectionDiagnosis}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-solid p-6">
      <div className="mb-5">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="sp-eyebrow">
            {dict.question} {step + 1} / {total}
          </p>
          <p className="sp-mono text-ink-faint text-[0.6875rem]">
            {Math.round(((step + 1) / total) * 100)}%
          </p>
        </div>
        <div className="bg-edge h-1 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${((step + 1) / total) * 100}%`,
              background: "linear-gradient(90deg, var(--color-cyan), var(--color-magenta))",
            }}
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-ink mb-4 text-lg font-bold">{text(question.text, locale)}</legend>
        <div className="grid gap-2">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option.id)}
              className="border-edge text-ink-soft hover:border-cyan/60 hover:bg-cyan/5 hover:text-ink rounded-xl border px-4 py-3 text-left text-sm transition-colors"
            >
              {text(option.label, locale)}
            </button>
          ))}
        </div>
      </fieldset>

      {step > 0 ? (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="text-ink-faint hover:text-cyan mt-4 text-xs transition-colors"
        >
          ← {dict.back}
        </button>
      ) : null}
    </div>
  );
}
