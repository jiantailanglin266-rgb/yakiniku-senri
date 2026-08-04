<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# このリポジトリの固定要件

以下は**毎回必ず満たすべき条件**です。機能追加やリファクタリングで壊さないでください。

## 1. 多言語切り替え（国旗つき）

- ヘッダーに**言語切り替えUIを常時設置**する（`src/components/i18n/LanguageSwitcher.tsx`）
- 選択肢には**必ず国旗を表示**する。国旗は `public/images/flags/<国コード>.webp`
- 国旗だけにせず、**必ずその言語での言語名を併記**する
  （言語と国は1対1ではないため、旗だけでは誤解を招きます）
- 対応言語は `src/data/languages.ts` で管理。**言語を追加したら国旗も追加**する
- 並び順は訪日客の多い言語順を維持する（アルファベット順にしない）

### 触ってはいけない設計

| 項目                                       | 理由                                                             |
| ------------------------------------------ | ---------------------------------------------------------------- |
| 日本語のときは翻訳スクリプトを読み込まない | 来訪者の大半が日本語話者。常時読み込むと全員が遅くなる           |
| 店名・住所・電話番号の `translate="no"`    | 機械翻訳が数字・固有名詞を書き換えると予約に直結する情報が壊れる |
| 翻訳失敗時に日本語のまま読める設計         | 外部サービス依存の切り分け                                       |
| Cookie を書いてリロードする方式            | セレクト直接操作はハイドレーション中に表示が壊れる               |

## 2. 作業の完了条件

変更のたびに、以下を**すべて**完了させてください。

1. `npm run typecheck` / `npm run lint` / `npm run test` / `npm run format:check` / `npm run build` を通す
2. 本番ビルドで実際に描画して確認する（devサーバーはCSS再生成が遅れることがある）
3. コミット → push → PR作成 → **マージ** → デプロイ結果の確認まで行う
4. 報告時に**GitHubの公開URLを併記**する

## 3. 事実性

- **未確認の情報をサイトに載せない。** 推測値を入れるくらいなら空のままにする
- `AggregateRating` / `Review` / 受賞歴 / メディア掲載は、**実データがない限り出力しない**
  （Googleのポリシー違反・優良誤認のリスク）
- 構造化データは**画面に表示している内容とだけ**一致させる
