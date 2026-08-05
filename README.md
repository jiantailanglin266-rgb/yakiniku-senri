# AI PORT

AIニュース・AIツール・AIエージェント・Web3 のポータルメディア。

公開URL: https://jiantailanglin266-rgb.github.io/ai-port/

## 開発

```bash
npm ci
npm run dev     # http://localhost:3000/
```

ローカルではベースパスを付けません。`/news` `/tools` のようにルート直下で開きます。

## 確認

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

## GitHub Pages 向けビルド

環境変数を4つとも渡してください。理由は [AGENTS.md](AGENTS.md) §4 にあります。

```bash
GITHUB_PAGES=true \
PAGES_BASE_PATH=/ai-port \
NEXT_PUBLIC_BASE_PATH=/ai-port \
NEXT_PUBLIC_AI_PORT_URL=https://jiantailanglin266-rgb.github.io \
npm run build
```

## 経緯

`jiantailanglin266-rgb/yakiniku-senri` から分離しました（2026-08-04）。
分離前は焼肉 千里 のリポジトリに同居し、`/yakiniku-senri/ai-port/` で配信していました。
