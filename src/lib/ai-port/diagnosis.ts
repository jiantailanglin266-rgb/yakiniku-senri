/**
 * AI診断の採点。
 *
 * UIから切り離した純粋関数にしてあります。
 * 「同じ回答なら必ず同じ結果」を保証したいので、乱数も日時も使いません。
 * （テスト: tests/ai-port-diagnosis.test.ts）
 */

import type { Diagnosis, DiagnosisResult } from "@/data/ai-port/diagnosis";

/** 質問ID → 選択肢ID */
export type Answers = Record<string, string>;

export type Scored = {
  result: DiagnosisResult;
  /** 軸ID → 得点 */
  scores: Record<string, number>;
  /** 1位の得点が全体に占める割合（0〜1）。「傾向の強さ」として表示します。 */
  confidence: number;
  /** 2位の結果（あれば）。「次点」として提示します。 */
  runnerUp?: DiagnosisResult;
};

export function tallyScores(diagnosis: Diagnosis, answers: Answers): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const result of diagnosis.results) scores[result.id] = 0;

  for (const question of diagnosis.questions) {
    const choiceId = answers[question.id];
    if (!choiceId) continue;

    const choice = question.choices.find((candidate) => candidate.id === choiceId);
    if (!choice) continue;

    for (const [axis, points] of Object.entries(choice.scores)) {
      // 結果として定義されていない軸は無視します（データの書き間違いで落とさないため）
      if (axis in scores) scores[axis] += points;
    }
  }

  return scores;
}

/**
 * 採点します。
 * 同点のときは `diagnosis.results` の並び順が先のほうを採用します
 * （毎回同じ結果になるようにするため。ランダムにはしません）。
 */
export function scoreDiagnosis(diagnosis: Diagnosis, answers: Answers): Scored {
  const scores = tallyScores(diagnosis, answers);

  const ordered = diagnosis.results
    .map((result, index) => ({ result, index, value: scores[result.id] ?? 0 }))
    .sort((a, b) => b.value - a.value || a.index - b.index);

  const total = ordered.reduce((sum, row) => sum + row.value, 0);
  const top = ordered[0];

  return {
    result: top.result,
    scores,
    confidence: total > 0 ? top.value / total : 0,
    runnerUp: ordered[1] && ordered[1].value > 0 ? ordered[1].result : undefined,
  };
}

/** 全問に答えたか。 */
export function isComplete(diagnosis: Diagnosis, answers: Answers): boolean {
  return diagnosis.questions.every((question) => Boolean(answers[question.id]));
}

/**
 * 回答をURLに載せるための短い文字列にします（結果の共有用）。
 * 形式: 質問の並び順どおりに選択肢IDを連結（例: "abcaba"）。
 */
export function encodeAnswers(diagnosis: Diagnosis, answers: Answers): string {
  return diagnosis.questions.map((question) => answers[question.id] ?? "-").join("");
}

export function decodeAnswers(diagnosis: Diagnosis, encoded: string): Answers {
  const answers: Answers = {};
  diagnosis.questions.forEach((question, index) => {
    const choiceId = encoded[index];
    if (!choiceId || choiceId === "-") return;
    if (question.choices.some((choice) => choice.id === choiceId)) {
      answers[question.id] = choiceId;
    }
  });
  return answers;
}
