# CRYPTO PORT

仮想通貨の情報ポータル（多言語）。

公開URL: https://jiantailanglin266-rgb.github.io/crypto-port/

## 開発

```bash
npm ci
npm run dev
```

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
PAGES_BASE_PATH=/crypto-port \
NEXT_PUBLIC_BASE_PATH=/crypto-port \
NEXT_PUBLIC_PORTAL_URL=https://jiantailanglin266-rgb.github.io \
npm run build
```

## 経緯

`jiantailanglin266-rgb/yakiniku-senri` から分離しました（2026-08-05）。
分離前は焼肉 千里・AI PORT・CARD PORT・SPORTS PORT と同居し、
`/yakiniku-senri/<言語>/` で配信していました。
