/**
 * 診断のスコアリング。
 *
 * 選択肢ごとの加点を合計し、最高得点の結果を返します。
 * 同点の場合は results 配列の並び順（＝編集部が意図した優先順）を採用します。
 */
import type { Diagnosis, DiagnosisResult } from "../types";

export type Answers = Record<string, string>;

export function scoreDiagnosis(diagnosis: Diagnosis, answers: Answers): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const result of diagnosis.results) scores[result.id] = 0;

  for (const question of diagnosis.questions) {
    const chosen = answers[question.id];
    if (!chosen) continue;
    const option = question.options.find((item) => item.id === chosen);
    if (!option) continue;
    for (const [resultId, weight] of Object.entries(option.weights)) {
      if (resultId in scores) scores[resultId] += weight;
    }
  }
  return scores;
}

export function pickResult(diagnosis: Diagnosis, answers: Answers): DiagnosisResult {
  const scores = scoreDiagnosis(diagnosis, answers);
  let best = diagnosis.results[0];
  let bestScore = -1;
  for (const result of diagnosis.results) {
    const score = scores[result.id] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = result;
    }
  }
  return best;
}
