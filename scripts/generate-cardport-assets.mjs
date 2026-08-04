/**
 * CARD PORT のプレースホルダー画像（OGP・ファビコン）を生成します。
 *
 *   npm run cardport:assets
 *
 * ■ なぜ生成するのか
 *   OGP画像が無いと、SNSへ共有したときにカードが崩れます。
 *   実画像を用意する前でも共有の見た目を確認できるよう、
 *   ブランドカラーから生成したプレースホルダーを置いています。
 *
 * ■ 差し替え
 *   同名ファイルを上書きするだけで差し替わります。
 *   配色は src/cardport/config/site.ts の palette と揃えてあります。
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "images", "cardport");

const BASE = "#05070f";
const NAVY = "#0b1020";
const CYAN = "#22d3ee";
const VIOLET = "#8b5cf6";
const MAGENTA = "#e548a8";

function ogpSvg({ title, subtitle }) {
  const width = 1200;
  const height = 630;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${NAVY}"/>
      <stop offset="55%" stop-color="${BASE}"/>
      <stop offset="100%" stop-color="#070b16"/>
    </linearGradient>
    <radialGradient id="v" cx="14%" cy="8%" r="60%">
      <stop offset="0%" stop-color="${VIOLET}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="c" cx="88%" cy="18%" r="55%">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="m" cx="70%" cy="104%" r="60%">
      <stop offset="0%" stop-color="${MAGENTA}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${MAGENTA}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="word" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${CYAN}"/>
      <stop offset="55%" stop-color="${VIOLET}"/>
      <stop offset="100%" stop-color="${MAGENTA}"/>
    </linearGradient>
    <linearGradient id="cardface" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="${VIOLET}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#111832"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#78a0ff" stroke-opacity="0.09" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <rect width="${width}" height="${height}" fill="url(#v)"/>
  <rect width="${width}" height="${height}" fill="url(#c)"/>
  <rect width="${width}" height="${height}" fill="url(#m)"/>

  <!-- 浮かぶカード（ISO/IEC 7810 ID-1 の比率） -->
  <g transform="translate(742 190) rotate(-9)">
    <rect width="380" height="240" rx="22" fill="url(#cardface)" opacity="0.95"/>
    <rect x="30" y="98" width="54" height="38" rx="6" fill="#f0dfa8" opacity="0.9"/>
    <text x="30" y="200" font-family="monospace" font-size="20" fill="#ffffff" fill-opacity="0.72" letter-spacing="6">•••• •••• ••••</text>
  </g>
  <g transform="translate(686 300) rotate(6)">
    <rect width="320" height="202" rx="20" fill="#111832" opacity="0.9" stroke="#ffffff" stroke-opacity="0.12"/>
    <rect x="26" y="80" width="46" height="32" rx="5" fill="#f0dfa8" opacity="0.75"/>
  </g>

  <text x="76" y="214" font-family="'Segoe UI',system-ui,sans-serif" font-size="30" letter-spacing="10" fill="${CYAN}" fill-opacity="0.85">NEXT-GEN FINTECH PORTAL</text>
  <text x="76" y="316" font-family="'Segoe UI',system-ui,sans-serif" font-size="78" font-weight="700" fill="url(#word)">${title}</text>
  <text x="76" y="392" font-family="'Segoe UI',system-ui,sans-serif" font-size="30" fill="#b7c2dd">${subtitle}</text>
  <rect x="76" y="440" width="120" height="3" rx="2" fill="url(#word)"/>
  <text x="76" y="512" font-family="'Segoe UI',system-ui,sans-serif" font-size="24" fill="#8492b4">Cards · Points · Miles · Business · Web3</text>
</svg>`);
}

function iconSvg(size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${CYAN}"/>
      <stop offset="55%" stop-color="${VIOLET}"/>
      <stop offset="100%" stop-color="${MAGENTA}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${BASE}"/>
  <rect x="${size * 0.16}" y="${size * 0.3}" width="${size * 0.68}" height="${size * 0.42}" rx="${size * 0.07}" fill="url(#g)"/>
  <rect x="${size * 0.16}" y="${size * 0.42}" width="${size * 0.68}" height="${size * 0.08}" fill="${BASE}" fill-opacity="0.55"/>
</svg>`);
}

const targets = [
  ["ogp-default.png", { title: "CARD PORT", subtitle: "未来の支払いと信用を、ひとつの画面に。" }],
  ["ogp-diagnosis.png", { title: "CARD FINDER", subtitle: "あなたに合うカードを診断する" }],
  ["ogp-ranking.png", { title: "RANKING", subtitle: "評価基準を公開した独自スコア" }],
  ["ogp-business.png", { title: "BUSINESS", subtitle: "法人カード・経費管理を比較する" }],
];

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const [name, options] of targets) {
    const buffer = await sharp(ogpSvg(options)).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(join(outDir, name), buffer);
    console.log(`generated public/images/cardport/${name}`);
  }

  for (const size of [192, 512]) {
    const buffer = await sharp(iconSvg(size)).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(join(outDir, `icon-${size}.png`), buffer);
    console.log(`generated public/images/cardport/icon-${size}.png`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
