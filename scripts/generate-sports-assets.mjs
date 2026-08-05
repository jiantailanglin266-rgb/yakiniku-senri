/**
 * SPORTS PORT の静的画像を生成します。
 *
 *   npm run sports:assets
 *
 * OGP 画像は権利物を使わず、ブランドカラーから自前で描き起こします。
 * 動的生成（next/og）を使わないのは、2,000ページ超の静的書き出しでの
 * ビルド時間を抑えるためです。ブランド変更時はこのスクリプトを再実行してください。
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "images", "sports");

const VOID = "#04060f";
const ABYSS = "#070b1a";
const CYAN = "#22d3ee";
const INDIGO = "#6366f1";
const MAGENTA = "#d946ef";

const name = process.env.NEXT_PUBLIC_SPORTS_SITE_NAME || "SPORTS PORT";
const tagline = "世界中の熱狂を、リアルタイムで。";

function ogpSvg(width, height) {
  const grid = [];
  for (let x = 0; x <= width; x += 60) {
    grid.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${CYAN}" stroke-opacity="0.07"/>`,
    );
  }
  for (let y = 0; y <= height; y += 60) {
    grid.push(
      `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${CYAN}" stroke-opacity="0.07"/>`,
    );
  }

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${VOID}"/>
      <stop offset="55%" stop-color="${ABYSS}"/>
      <stop offset="100%" stop-color="${VOID}"/>
    </linearGradient>
    <radialGradient id="glowA" cx="12%" cy="0%" r="70%">
      <stop offset="0%" stop-color="${INDIGO}" stop-opacity="0.45"/>
      <stop offset="70%" stop-color="${INDIGO}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="88%" cy="10%" r="65%">
      <stop offset="0%" stop-color="${MAGENTA}" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="${MAGENTA}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowC" cx="50%" cy="110%" r="70%">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="${CYAN}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${CYAN}"/>
      <stop offset="50%" stop-color="${INDIGO}"/>
      <stop offset="100%" stop-color="${MAGENTA}"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <g>${grid.join("")}</g>
  <rect width="${width}" height="${height}" fill="url(#glowA)"/>
  <rect width="${width}" height="${height}" fill="url(#glowB)"/>
  <rect width="${width}" height="${height}" fill="url(#glowC)"/>

  <g transform="translate(${width / 2}, ${height * 0.52})">
    <ellipse rx="360" ry="96" fill="none" stroke="${CYAN}" stroke-opacity="0.22"/>
    <ellipse rx="290" ry="76" fill="none" stroke="${INDIGO}" stroke-opacity="0.2"/>
    <ellipse rx="220" ry="58" fill="none" stroke="${MAGENTA}" stroke-opacity="0.16"/>
  </g>

  <text x="${width / 2}" y="${height * 0.46}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="800"
        letter-spacing="6" fill="url(#ink)">${name}</text>

  <text x="${width / 2}" y="${height * 0.6}" text-anchor="middle"
        font-family="Hiragino Sans, Noto Sans JP, sans-serif" font-size="34"
        fill="#cbd5e1" opacity="0.9">${tagline}</text>

  <rect x="${width / 2 - 120}" y="${height * 0.66}" width="240" height="2" fill="url(#ink)" opacity="0.75"/>

  <text x="${width / 2}" y="${height * 0.76}" text-anchor="middle"
        font-family="Menlo, monospace" font-size="22" letter-spacing="8"
        fill="${CYAN}" opacity="0.75">LIVE SCORES / NEWS / STREAMING / DATA</text>
</svg>`);
}

await mkdir(outDir, { recursive: true });

await writeFile(
  join(outDir, "ogp.png"),
  await sharp(ogpSvg(1200, 630)).png({ quality: 90 }).toBuffer(),
);
console.log("generated public/images/sports/ogp.png");
