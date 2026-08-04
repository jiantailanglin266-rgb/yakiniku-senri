/**
 * 執筆者・監修者（架空）。
 *
 * ⚠ 実在しない資格・受賞歴・所属は書きません。
 *   本番運用では、実在の執筆者と、その人が実際に保有する資格のみを記載してください。
 *   資格が無いなら「無い」ままにするほうが、金融メディアとしては誠実です。
 */
import type { Author } from "./types";

export const authors: Author[] = [
  {
    id: "editorial",
    name: { ja: "CARD PORT 編集部", en: "CARD PORT editorial team" },
    role: { ja: "編集", en: "Editorial" },
    bio: {
      ja: "カード会社の公式発表と利用規約を一次情報として確認し、記事化しています。掲載時点で確認できた内容のみを書き、推測は書きません。",
      en: "We work from issuers' own announcements and terms, and publish only what we could verify at the time. We do not publish guesses.",
    },
    credentials: { ja: [], en: [] },
    isSupervisor: false,
  },
  {
    id: "author-hayama",
    name: { ja: "葉山 透（架空）", en: "Toru Hayama (fictional)" },
    role: { ja: "ライター／決済・ポイント担当", en: "Writer — payments and rewards" },
    bio: {
      ja: "キャッシュレス決済とポイント経済圏を担当。還元率の計算根拠を必ず記事内に示す方針で執筆しています。",
      en: "Covers cashless payments and points ecosystems, always showing the arithmetic behind a reward figure.",
    },
    credentials: { ja: [], en: [] },
    isSupervisor: false,
  },
  {
    id: "author-mizuki",
    name: { ja: "水城 遥（架空）", en: "Haruka Mizuki (fictional)" },
    role: { ja: "ライター／法人カード・経理担当", en: "Writer — business cards and accounting" },
    bio: {
      ja: "法人カードと経費精算まわりを担当。制度の話は必ず一次資料に当たってから書いています。",
      en: "Covers business cards and expense workflows, checking primary sources before writing about any rule.",
    },
    credentials: { ja: [], en: [] },
    isSupervisor: false,
  },
  {
    id: "supervisor-kanzaki",
    name: { ja: "神崎 理恵（架空）", en: "Rie Kanzaki (fictional)" },
    role: { ja: "監修／消費者向け金融", en: "Supervisor — consumer finance" },
    bio: {
      ja: "記事の記述が利用規約と矛盾していないか、断定を避けるべき箇所で断定していないかを確認しています。",
      en: "Checks that our wording matches the issuers' terms and that we avoid asserting what cannot be asserted.",
    },
    credentials: {
      ja: ["※ 架空の人物のため、保有資格は記載していません"],
      en: ["Fictional persona — no credentials are listed"],
    },
    isSupervisor: true,
  },
];

const authorMap = new Map(authors.map((author) => [author.id, author]));

export function getAuthor(id: string) {
  return authorMap.get(id);
}

export const supervisors = authors.filter((author) => author.isSupervisor);
