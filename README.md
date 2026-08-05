# CARD PORT

クレジットカードの比較・解説メディア（多言語）。

公開URL: https://jiantailanglin266-rgb.github.io/card-port/

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
PAGES_BASE_PATH=/card-port \
NEXT_PUBLIC_BASE_PATH=/card-port \
NEXT_PUBLIC_CARDPORT_URL=https://jiantailanglin266-rgb.github.io/card-port \
npm run build
```

⚠ `NEXT_PUBLIC_CARDPORT_URL` は**ベースパス込み**です（他の分離サイトと違います）。
`cardportAbsoluteUrl()` が二重化を検出して取り除くため、この形で正しく動きます。

## 掲載データについて

**掲載しているカードはすべて架空です。** 実在するカードの商標・ロゴ・券面意匠は
使用していません。詳細は [AGENTS.md](AGENTS.md) を参照してください。

## 経緯

`jiantailanglin266-rgb/yakiniku-senri` から分離しました（2026-08-05）。
分離前は `/yakiniku-senri/card-port/<言語>/` で配信していました。
