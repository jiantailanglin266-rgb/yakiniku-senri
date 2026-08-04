import { Phone } from "lucide-react";
import { store } from "@/data/store";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "gold" | "outline";
  /** 電話番号を併記する */
  showNumber?: boolean;
  className?: string;
  label?: string;
};

/**
 * 電話予約ボタン。tel: リンクは store.phoneHref を唯一の出典とします。
 */
export function ReservationButton({
  variant = "outline",
  showNumber = false,
  className,
  label = "電話で予約する",
}: Props) {
  return (
    <a
      href={store.phoneHref}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2.5 px-6 py-3 text-[0.8rem] tracking-[0.18em] transition-colors duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
        variant === "gold"
          ? "bg-gold hover:bg-gold-light font-medium text-black"
          : "border-gold/55 text-gold hover:border-gold hover:bg-gold/10 hover:text-gold-light border",
        className,
      )}
    >
      <Phone aria-hidden="true" className="size-4" />
      <span>{label}</span>
      {showNumber ? (
        <span translate="no" className="font-display text-base tracking-[0.08em]">
          {store.phone}
        </span>
      ) : null}
      <span className="sr-only">電話番号 {store.phone}</span>
    </a>
  );
}
