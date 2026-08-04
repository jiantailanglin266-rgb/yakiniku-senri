/**
 * 診断の採点。
 *
 * 選択肢ごとの加点を合算し、最も点数の高い結果プロフィールを返します。
 * 同点の場合は、質問票に定義された順（＝より一般的な結果が先）を優先します。
 */

import type { Diagnosis, DiagnosisResult } from "./types";

export type Answers = Record<string, string>;

export type ScoredResult = {
  result: DiagnosisResult;
  score: number;
  /** 全体に占める割合（0–100）。結果画面で確信度の目安として出します */
  share: number;
};

export function scoreDiagnosis(diagnosis: Diagnosis, answers: Answers): ScoredResult[] {
  const totals = new Map<string, number>();
  for (const result of diagnosis.results) totals.set(result.id, 0);

  for (const question of diagnosis.questions) {
    const chosenId = answers[question.id];
    if (!chosenId) continue;
    const option = question.options.find((entry) => entry.id === chosenId);
    if (!option) continue;
    for (const [resultId, points] of Object.entries(option.scores)) {
      if (!totals.has(resultId)) continue;
      totals.set(resultId, (totals.get(resultId) ?? 0) + points);
    }
  }

  const sum = Array.from(totals.values()).reduce((acc, value) => acc + value, 0);

  return diagnosis.results
    .map((result, index) => ({
      result,
      score: totals.get(result.id) ?? 0,
      share: sum > 0 ? Math.round(((totals.get(result.id) ?? 0) / sum) * 100) : 0,
      index,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ result, score, share }) => ({ result, score, share }));
}

/** 回答が揃っているか */
export function isComplete(diagnosis: Diagnosis, answers: Answers): boolean {
  return diagnosis.questions.every((question) => Boolean(answers[question.id]));
}

/**
 * 結果をURLに載せるための短い符号。
 * 「質問の並び順にそって選択肢のindexを並べる」だけの単純な方式です。
 * 共有リンクから同じ結果を再現でき、サーバーに回答を保存せずに済みます。
 */
export function encodeAnswers(diagnosis: Diagnosis, answers: Answers): string {
  return diagnosis.questions
    .map((question) => {
      const index = question.options.findIndex((option) => option.id === answers[question.id]);
      return index < 0 ? "-" : String(index);
    })
    .join("");
}

export function decodeAnswers(diagnosis: Diagnosis, code: string): Answers {
  const answers: Answers = {};
  diagnosis.questions.forEach((question, position) => {
    const char = code[position];
    if (!char || char === "-") return;
    const option = question.options[Number(char)];
    if (option) answers[question.id] = option.id;
  });
  return answers;
}
