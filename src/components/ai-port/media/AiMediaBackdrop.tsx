/**
 * AI PORT の見出し背景・カードサムネイル。
 *
 * ============================================================
 * ⚠ 画像の割り当ては `src/media/` が唯一の入口です。
 *   ここは AI PORT の配色に合わせる薄い層で、
 *   掲載可否の判定は一切していません（`MediaSlot` が判断します）。
 *
 * ⚠ 減光（scrim）を必ず重ねます。
 *   見出しを画像の上に載せるため、コントラストを確保できないと
 *   文字が読めなくなります。被写体が判別できる範囲にとどめています。
 *
 * ⚠ 人物写真・報道写真・歴史資料・地図・作品画像には、
 *   事実関係を誤認させる加工をしないでください。
 *   ここで行っているのは減光だけで、色相の変更はしていません。
 * ============================================================
 *
 * 画像の有無で枠の大きさが変わらないため、レイアウトは崩れません（CLSなし）。
 */
import { MediaSlot } from "@/media/components";
import type { FallbackTheme } from "@/media/components/FallbackVisual";
import { cn } from "@/lib/utils";

/** AI PORT のページキー。書式のばらつきを防ぐため必ずこれを使ってください。 */
export function aiPortPageKey(kind: string, slug: string): string {
  return `aiport:${kind}:${slug}`;
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
  return (
    <div className={cn("absolute inset-0 -z-[1] overflow-hidden", className)}>
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
