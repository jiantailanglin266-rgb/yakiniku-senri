# SPORTS PORT

スポーツ速報・ニュース・配信・データ・Web3 のポータル（多言語）。

公開URL: https://jiantailanglin266-rgb.github.io/sports-port/

## 開発

```bash
npm ci
npm run dev     # http://localhost:3000/ja
```

## 確認

```bash
npm run typecheck && npm run lint && npm run format:check && npm run test && npm run build
```

## GitHub Pages 向けビルド

```bash
GITHUB_PAGES=true \
PAGES_BASE_PATH=/sports-port \
NEXT_PUBLIC_BASE_PATH=/sports-port \
NEXT_PUBLIC_SPORTS_ORIGIN=https://jiantailanglin266-rgb.github.io \
npm run build
```

⚠ `NEXT_PUBLIC_SPORTS_ORIGIN` は**オリジンだけ**です。
リポジトリ名を入れると URL が `/sports-port/sports-port/...` と二重になります。

## 経緯

`jiantailanglin266-rgb/yakiniku-senri` から分離しました（2026-08-05）。
分離前は `/yakiniku-senri/sports-port/<言語>/` で配信していました。
分離に伴い、内部パスの前置き（`routePrefix`）を `/sports-port` から空文字にしています。
