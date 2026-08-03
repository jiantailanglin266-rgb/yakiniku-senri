/**
 * プレースホルダー画像を生成します。
 *
 *   npm run placeholders
 *
 * 生成される画像は src/data/media.ts が参照しているパスと同じ場所・同じファイル名です。
 * 本番の写真が用意できたら、同名ファイルを上書きするだけで差し替えが完了します。
 * （拡張子を変える場合は src/data/media.ts の該当行を書き換えてください）
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

/** ブランドカラー */
const BLACK = "#0a0908";
const CHARCOAL = "#16120f";
const GOLD = "#c7a253";
const GOLD_DARK = "#8f6b28";
const EMBER = "#b9381e";

function svg({ width, height, label, sub, seed = 0 }) {
  const cx = 28 + ((seed * 17) % 44);
  const cy = 12 + ((seed * 29) % 40);
  const fontSize = Math.max(11, Math.round(Math.min(width, height) * 0.032));
  const subSize = Math.max(9, Math.round(fontSize * 0.72));

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${CHARCOAL}"/>
      <stop offset="55%" stop-color="${BLACK}"/>
      <stop offset="100%" stop-color="#131010"/>
    </linearGradient>
    <radialGradient id="glowGold" cx="${cx}%" cy="${cy}%" r="70%">
      <stop offset="0%" stop-color="${GOLD_DARK}" stop-opacity="0.34"/>
      <stop offset="62%" stop-color="${GOLD_DARK}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowEmber" cx="${100 - cx}%" cy="${100 - cy}%" r="65%">
      <stop offset="0%" stop-color="${EMBER}" stop-opacity="0.2"/>
      <stop offset="60%" stop-color="${EMBER}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#base)"/>
  <rect width="${width}" height="${height}" fill="url(#glowGold)"/>
  <rect width="${width}" height="${height}" fill="url(#glowEmber)"/>
  <rect width="${width}" height="${height}" filter="url(#grain)" opacity="0.05"/>

  <rect x="${width * 0.5 - 40}" y="${height * 0.5 - 34}" width="80" height="1" fill="${GOLD}" opacity="0.55"/>
  <text x="50%" y="${height * 0.5 + 4}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}"
        letter-spacing="${fontSize * 0.34}" fill="${GOLD}" opacity="0.8">${label}</text>
  <text x="50%" y="${height * 0.5 + fontSize * 2.2}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="${subSize}"
        letter-spacing="${subSize * 0.2}" fill="#a7a7a7" opacity="0.55">${sub}</text>
  <rect x="${width * 0.5 - 40}" y="${height * 0.5 + fontSize * 3.1}" width="80" height="1" fill="${GOLD}" opacity="0.3"/>
</svg>`);
}

/** [出力パス, 幅, 高さ, ラベル, サブラベル] */
const targets = [
  ["images/hero/hero-main.webp", 1920, 1280, "HERO", "hero-main"],
  ["images/hero/hero-meat.webp", 1920, 1280, "HERO", "hero-meat"],
  ["images/hero/hero-charcoal.webp", 1920, 1280, "HERO", "hero-charcoal"],

  ["images/movie/movie-poster.webp", 1920, 1080, "MOVIE", "movie-poster"],

  ["images/story/story-history.webp", 1600, 1200, "STORY", "story-history"],
  ["images/story/story-sauce.webp", 1600, 1200, "STORY", "story-sauce"],
  ["images/story/story-family.webp", 1600, 1200, "STORY", "story-family"],

  ["images/commitment/commitment-legacy.webp", 1200, 900, "CRAFT", "commitment-legacy"],
  ["images/commitment/commitment-sauce.webp", 1200, 900, "CRAFT", "commitment-sauce"],
  ["images/commitment/commitment-momi.webp", 1200, 900, "CRAFT", "commitment-momi"],
  ["images/commitment/commitment-space.webp", 1200, 900, "CRAFT", "commitment-space"],

  ["images/menu/menu-momi-assortment.webp", 1200, 900, "MENU", "momi-assortment"],
  ["images/menu/menu-jo-rosu.webp", 1200, 900, "MENU", "jo-rosu"],
  ["images/menu/menu-cheese-fondue.webp", 1200, 900, "MENU", "cheese-fondue"],

  ["images/owner/owner-profile.webp", 1200, 1500, "OWNER", "owner-profile"],
  ["images/takeout/takeout-main.webp", 1920, 1080, "TAKEOUT", "takeout-main"],
  ["images/access/access-exterior.webp", 1600, 1067, "ACCESS", "access-exterior"],
  ["images/news/news-default.webp", 1200, 900, "NEWS", "news-default"],

  ["images/gallery/gallery-01.webp", 1200, 900, "GALLERY", "gallery-01"],
  ["images/gallery/gallery-02.webp", 1200, 1500, "GALLERY", "gallery-02"],
  ["images/gallery/gallery-03.webp", 1200, 900, "GALLERY", "gallery-03"],
  ["images/gallery/gallery-04.webp", 1200, 1500, "GALLERY", "gallery-04"],
  ["images/gallery/gallery-05.webp", 1200, 900, "GALLERY", "gallery-05"],
  ["images/gallery/gallery-06.webp", 1200, 900, "GALLERY", "gallery-06"],
  ["images/gallery/gallery-07.webp", 1200, 1500, "GALLERY", "gallery-07"],
  ["images/gallery/gallery-08.webp", 1200, 900, "GALLERY", "gallery-08"],

  ["images/common/page-hero-about.webp", 1920, 900, "ABOUT", "page-hero"],
  ["images/common/page-hero-commitment.webp", 1920, 900, "CRAFT", "page-hero"],
  ["images/common/page-hero-menu.webp", 1920, 900, "MENU", "page-hero"],
  ["images/common/page-hero-takeout.webp", 1920, 900, "TAKEOUT", "page-hero"],
  ["images/common/page-hero-owner.webp", 1920, 900, "OWNER", "page-hero"],
  ["images/common/page-hero-news.webp", 1920, 900, "NEWS", "page-hero"],
  ["images/common/page-hero-access.webp", 1920, 900, "ACCESS", "page-hero"],
  ["images/common/page-hero-contact.webp", 1920, 900, "CONTACT", "page-hero"],
  ["images/common/page-hero-legal.webp", 1920, 900, "LEGAL", "page-hero"],
];

const brandSvg = (size) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BLACK}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.42}" fill="none" stroke="${GOLD}" stroke-width="${Math.max(1, size * 0.02)}" opacity="0.85"/>
  <text x="50%" y="${size * 0.62}" text-anchor="middle" font-family="Georgia, serif" font-size="${size * 0.46}" fill="${GOLD}">千</text>
</svg>`);

const ogpSvg =
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="og" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${CHARCOAL}"/>
      <stop offset="60%" stop-color="${BLACK}"/>
      <stop offset="100%" stop-color="#140f0d"/>
    </linearGradient>
    <radialGradient id="ogGlow" cx="50%" cy="115%" r="65%">
      <stop offset="0%" stop-color="${EMBER}" stop-opacity="0.35"/>
      <stop offset="55%" stop-color="${GOLD_DARK}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${BLACK}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#og)"/>
  <rect width="1200" height="630" fill="url(#ogGlow)"/>
  <rect x="510" y="196" width="180" height="1" fill="${GOLD}" opacity="0.6"/>
  <text x="600" y="170" text-anchor="middle" font-family="Georgia, serif" font-size="22" letter-spacing="10" fill="${GOLD}" opacity="0.85">SINCE 1965</text>
  <text x="600" y="300" text-anchor="middle" font-family="'Yu Mincho', Georgia, serif" font-size="72" letter-spacing="16" fill="#f7f3e8">焼肉 千里</text>
  <text x="600" y="360" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="12" fill="${GOLD}" opacity="0.8">YAKINIKU SENRI</text>
  <text x="600" y="440" text-anchor="middle" font-family="'Yu Gothic', Helvetica, sans-serif" font-size="24" letter-spacing="6" fill="#a7a7a7">世田谷・上馬の老舗焼肉店</text>
</svg>`);

/** 32x32 の PNG を ICO コンテナで包みます（PNG埋め込み型 .ico） */
function toIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

async function write(relPath, buffer) {
  const outPath = join(publicDir, relPath);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buffer);
  return relPath;
}

async function main() {
  let count = 0;

  for (const [relPath, width, height, label, sub] of targets) {
    const buffer = await sharp(svg({ width, height, label, sub, seed: count }))
      .webp({ quality: 78 })
      .toBuffer();
    await write(relPath, buffer);
    count += 1;
  }

  await write("images/common/ogp.png", await sharp(ogpSvg).png().toBuffer());
  await write("icon.png", await sharp(brandSvg(512)).png().toBuffer());
  await write("apple-touch-icon.png", await sharp(brandSvg(180)).png().toBuffer());
  await write("favicon.ico", toIco(await sharp(brandSvg(64)).resize(32, 32).png().toBuffer()));
  count += 4;

  // 動画置き場（差し替え用）
  await mkdir(join(publicDir, "videos"), { recursive: true });
  await writeFile(
    join(publicDir, "videos", "README.md"),
    [
      "# /public/videos",
      "",
      "ブランドムービーの mp4 をここに置いてください（例: brand-movie.mp4）。",
      "配置後、`src/data/media.ts` の `brandMovie.mp4` に `/videos/brand-movie.mp4` を設定すると再生ボタンが表示されます。",
      "YouTube を使う場合は `brandMovie.youtubeId` に動画IDを設定してください。",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(`✓ ${count} 件のプレースホルダーを生成しました（/public 配下）`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
