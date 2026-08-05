import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";

/**
 * AI PORT のシンボル。
 *
 * ============================================================
 * ⚠ 動くロゴ（/videos/ai-port-logo.mp4）を流します。
 *   枠の比率は動画に合わせています（864:496）。呼び出し側は高さだけ決めます。
 *   object-contain なので、動画の端が切れることはありません。
 *
 * ⚠ ロゴが消える状態を作っていません。
 *   従来のSVGマークを下に敷いたまま、その上に動画を重ねています。
 *     - 動画が読み込めない      → 下のSVGマークが見えます
 *     - 動画に対応していない    → 同上
 *     - prefers-reduced-motion  → 動画を隠し、SVGマークに戻します
 *   どの経路でも「ロゴが無い」状態にはなりません。
 *
 * ⚠ 音声は常に切ります。
 *   この動画は音声トラック（AAC）を持っています。
 *   muted は自動再生の条件でもあります（音の出る自動再生は多くのブラウザが止めます）。
 * ============================================================
 *
 * ■ マークの意味（フォールバック側）
 *   「港（PORT）」＝情報が集まり、また出ていく地点。
 *   中心のノードと、そこへ集まる4方向の線で表しています。
 *
 *   グラデーションの id はページ内で重複すると片方が消えるため、
 *   固定 id を使わず CSS の currentColor と stroke で表現しています。
 */

/** 動くロゴの置き場所。差し替えるときはこのファイルを上書きしてください。 */
export const PORTAL_LOGO_VIDEO = "/videos/ai-port-logo.mp4";

/** 動画の実寸（864×496）。枠の比率をここから決めます。 */
const LOGO_ASPECT = "aspect-[864/496]";

export function PortalLogo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block shrink-0 overflow-hidden", LOGO_ASPECT, className)}
    >
      {/*
        従来のマーク。動画が出せないときは、これがそのまま見えます。
        横長の枠の中で、元と同じ正方形のタイルとして中央に置きます。
      */}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="from-ai-cyan via-ai-blue to-ai-violet relative grid aspect-square h-full shrink-0 place-items-center rounded-lg bg-gradient-to-br">
          <span
            aria-hidden="true"
            className="from-ai-cyan to-ai-violet absolute inset-0 rounded-lg bg-gradient-to-br opacity-60 blur-md"
          />
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
        </span>
      </span>

      {/* 動くロゴ。動きを抑える設定では隠し、上のマークに戻します */}
      <video
        className="absolute inset-0 size-full object-contain motion-reduce:hidden"
        src={withBasePath(PORTAL_LOGO_VIDEO)}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
      />
    </span>
  );
}
