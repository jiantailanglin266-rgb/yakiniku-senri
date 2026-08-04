import { cn } from "@/lib/utils";

/**
 * 横に流れ続けるティッカー。
 *
 * 同じ内容を2組並べ、-50% までずらして先頭に戻します。
 * 2組目は読み上げ対象から外し、同じ文言が2回読まれないようにしています。
 * hover で停止するので、流れている見出しもクリックできます。
 */
export function Ticker({
  children,
  className,
  /** 1周にかける秒数。長いほどゆっくり流れます。 */
  duration = 42,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="ai-marquee"
        style={{ "--ai-marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>

      {/* 左右の端をフェードさせ、唐突に切れて見えないようにします */}
      <div className="from-ai-void pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r to-transparent" />
      <div className="from-ai-void pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent" />
    </div>
  );
}
