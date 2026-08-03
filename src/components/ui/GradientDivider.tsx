import { cn } from "@/lib/utils";

/**
 * セクション間の区切り。実線ボーダーは使わず、黒→赤黒→金の淡い帯で溶かします。
 * 3〜5点のカラーストップ・240px以上の遷移距離でバンディングを回避。
 */
export function GradientDivider({
  className,
  tone = "ember",
}: {
  className?: string;
  tone?: "ember" | "gold";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative h-60 w-full overflow-hidden", className)}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            tone === "ember"
              ? "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(28,12,8,0.55) 30%, rgba(95,11,11,0.28) 55%, rgba(143,107,40,0.16) 78%, rgba(8,8,8,0) 100%)"
              : "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(143,107,40,0.14) 38%, rgba(199,162,83,0.2) 60%, rgba(8,8,8,0) 100%)",
        }}
      />
      <span className="rule-gold absolute top-1/2 left-1/2 w-40 -translate-x-1/2" />
    </div>
  );
}
