import { cn } from "@/lib/utils";

/**
 * AI PORT のシンボル。
 *
 * 「港（PORT）」＝情報が集まり、また出ていく地点。
 * 中心のノードと、そこへ集まる4方向の線で表しています。
 *
 * グラデーションの id はページ内で重複すると片方が消えるため、
 * 固定 id を使わず CSS の currentColor と stroke で表現しています。
 */
export function PortalLogo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "from-ai-cyan via-ai-blue to-ai-violet relative grid place-items-center rounded-lg bg-gradient-to-br",
        className,
      )}
    >
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
  );
}
