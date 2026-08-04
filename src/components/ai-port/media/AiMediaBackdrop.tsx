/**
 * AI PORT の見出し背景・カードサムネイル。
 *
 * ============================================================
 * ⚠ この枠には、性質の違う2種類の画像が入ります。
 *
 *   1. ライセンス確認済みの Wikimedia 画像（`src/media/` の判定を通ったもの）
 *      → 作者・出典・ライセンスが画像と同じ要素に描画されます
 *
 *   2. Wikipedia の記事代表画像（`scripts/wikipedia-photos.mjs` で取得）
 *      → **ライセンス確認をしていません。** 作者・出典・ライセンスを
 *        保持していないため、個別クレジットを出せません。
 *        詳細は docs/ai-port/wikipedia-photos.md
 *
 *   1 を優先します。1 があるときに 2 を出すことはありません。
 *   どちらも無ければ、外部素材を使わない装飾表現に落ちます。
 * ============================================================
 *
 * ⚠ 減光（scrim）を必ず重ねます。
 *   見出しを画像の上に載せるため、コントラストを確保できないと
 *   文字が読めなくなります。被写体が判別できる範囲にとどめています。
 *
 * ⚠ 人物写真・報道写真・歴史資料・地図・作品画像には、
 *   事実関係を誤認させる加工をしないでください。
 *   ここで行っているのは減光だけで、色相の変更はしていません。
 *
 * 画像の有無で枠の大きさが変わらないため、レイアウトは崩れません（CLSなし）。
 */
import Image from "next/image";

import { photoPath } from "@/data/ai-port/photos";
import { MediaSlot } from "@/media/components";
import type { FallbackTheme } from "@/media/components/FallbackVisual";
import { resolveImage } from "@/media/lib/resolve";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";

/** AI PORT のページキー。書式のばらつきを防ぐため必ずこれを使ってください。 */
export function aiPortPageKey(kind: string, slug: string): string {
  return `aiport:${kind}:${slug}`;
}

/** 写真ファイルのスラッグ。マニフェスト（scripts/wikipedia-photo-manifest.json）と対応します。 */
function photoSlug(kind: string, slug: string): string {
  return `${kind}-${slug}`;
}

/**
 * ライセンス未確認の写真を出してよいか。
 *
 * 確認済みの画像が割り当てられているときは、そちらが優先です。
 */
function unverifiedPhotoFor(
  kind: string,
  slug: string,
  slot: "background" | "card",
): string | null {
  if (resolveImage(aiPortPageKey(kind, slug), slot, "ja")) return null;
  return photoPath(photoSlug(kind, slug));
}

/** 見出しの背景。 */
export function AiMediaBackdrop({
  kind,
  slug,
  theme = "neutral",
  seed = 0,
  priority = false,
  className,
}: {
  kind: string;
  slug: string;
  theme?: FallbackTheme;
  seed?: number;
  priority?: boolean;
  className?: string;
}) {
  const photo = unverifiedPhotoFor(kind, slug, "background");

  return (
    <div className={cn("absolute inset-0 -z-[1] overflow-hidden", className)}>
      {photo ? (
        <Image
          src={withBasePath(photo)}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          priority={priority}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <MediaSlot
          pageKey={aiPortPageKey(kind, slug)}
          slot="background"
          locale="ja"
          theme={theme}
          seed={seed}
          priority={priority}
          sizes="100vw"
          showCaption={false}
          className="h-full w-full"
        />
      )}

      {/* 見出しの可読性を確保する減光。画像・装飾のどちらにも掛けます。 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#04060f] via-[#04060f]/85 to-[#04060f]/55"
      />
    </div>
  );
}

/** カードのサムネイル枠。比率を固定し、画像の有無で高さを変えません。 */
export function AiMediaThumb({
  kind,
  slug,
  theme = "neutral",
  seed = 0,
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw",
  className,
}: {
  kind: string;
  slug: string;
  theme?: FallbackTheme;
  seed?: number;
  sizes?: string;
  className?: string;
}) {
  const photo = unverifiedPhotoFor(kind, slug, "card");

  if (photo) {
    return (
      <div className={cn("relative aspect-[16/9] overflow-hidden", className)}>
        <Image
          src={withBasePath(photo)}
          alt=""
          aria-hidden="true"
          fill
          sizes={sizes}
          style={{ objectFit: "cover" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/45 to-transparent"
        />
      </div>
    );
  }

  return (
    <MediaSlot
      pageKey={aiPortPageKey(kind, slug)}
      slot="card"
      locale="ja"
      theme={theme}
      seed={seed}
      sizes={sizes}
      showCaption={false}
      // 幅は呼び出し側の枠に従います（w-full を付けると負のマージンで枠から外れます）
      className={cn("aspect-[16/9]", className)}
    />
  );
}
