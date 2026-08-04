/**
 * 執筆者・監修者。
 *
 * ⚠ 実在しない資格・経歴は書きません。
 *   現時点では編集部という組織名義のみを置いています。
 *   実際の担当者が決まったら、確認できる範囲の経歴だけをここへ追加してください。
 *   （Article / NewsArticle の author はこの内容とだけ一致させます）
 */

import type { Author } from "@/portal/lib/types";

export const authors: Author[] = [
  {
    id: "editorial",
    name: { ja: "CRYPTO PORT 編集部", en: "CRYPTO PORT Editorial" },
    role: { ja: "編集・執筆", en: "Editorial" },
    bio: {
      ja: "仮想通貨・Web3.0に関する情報を、一次情報にあたって整理しています。価格や手数料など変動する情報は、掲載時点の確認日を明示しています。",
      en: "We organise crypto and Web3 information by working from primary sources. For anything that changes — prices, fees — we publish the date it was checked.",
    },
    credentials: { ja: [], en: [] },
  },
];

export const authorById = new Map(authors.map((author) => [author.id, author]));

export function getAuthor(id: string): Author | undefined {
  return authorById.get(id);
}
