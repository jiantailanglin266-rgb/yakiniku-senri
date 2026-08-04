import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";

/**
 * AI PORT のシンボル。
 *
 * ============================================================
 * ⚠ 動くロゴ（/videos/ai-port-logo.mp4）を、従来のマークと同じ枠で流します。
 *   枠の大きさは呼び出し側が決めます（ヘッダー size-8 / フッター size-9）。
 *   動画の有無で枠は変わらないため、レイアウトは動きません（CLSなし）。
 *
 * ⚠ ロゴが消える状態を作っていません。
 *   従来のSVGマークを下に敷いたまま、その上に動画を重ねています。
 *     - 動画が読み込めない      → 下のSVGがそのまま見えます
 *     - 動画に対応していない    → 同上
 *     - prefers-reduced-motion  → 動画を隠し、SVGに戻します
 *   どの経路でも「ロゴが無い」状態にはなりません。
 *
 * ⚠ 音声は常に切ります。
 *   muted は自動再生の条件です（音の出る自動再生は多くのブラウザが止めます）。
 *   ロゴに音は不要なので、音声トラックの有無に関わらず消音します。
 * ============================================================
 *
 * ■ マークの意味
 *   「港（PORT）」＝情報が集まり、また出ていく地点。
 *   中心のノードと、そこへ集まる4方向の線で表しています。
 *
 *   グラデーションの id はページ内で重複すると片方が消えるため、
 *   固定 id を使わず CSS の currentColor と stroke で表現しています。
 */

/** 動くロゴの置き場所。差し替えるときはこのファイルを上書きしてください。 */
export const PORTAL_LOGO_VIDEO = "/videos/ai-port-logo.mp4";

export function PortalLogo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "from-ai-cyan via-ai-blue to-ai-violet relative grid place-items-center overflow-hidden rounded-lg bg-gradient-to-br",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="from-ai-cyan to-ai-violet absolute inset-0 rounded-lg bg-gradient-to-br opacity-60 blur-md"
      />

      {/* 従来のマーク。動画が出せないときは、これがそのまま見えます */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#04060f"
        strokeWidth="1.9"
        strokeLinecap="round"
        className="relative size-[62%]"
      >
        <circle cx="12" cy="12" r="3.1" />
        <path d="M12 2.4v5.5M12 16.1v5.5M2.4 12h5.5M16.1 12h5.5" />
      </svg>

      {/* 動くロゴ。動きを抑える設定では隠し、上のSVGに戻します */}
      <video
        className="absolute inset-0 size-full rounded-lg object-cover motion-reduce:hidden"
        src={withBasePath(PORTAL_LOGO_VIDEO)}
        autoPlay
        loop
        muted
        playsInline
        tabIndex={-1}
      />
    </span>
  );
}
