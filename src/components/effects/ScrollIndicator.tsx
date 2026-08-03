import { cn } from "@/lib/utils";

export function ScrollIndicator({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none flex flex-col items-center gap-3", className)}
    >
      <span className="font-display text-gold/70 text-[0.6rem] tracking-[0.4em] uppercase">
        Scroll
      </span>
      <span className="bg-ivory/15 relative block h-14 w-px">
        <span
          className="from-gold-light to-gold/0 absolute inset-x-0 top-0 block h-full bg-gradient-to-b"
          style={{ animation: "scroll-hint 2.6s cubic-bezier(.22,1,.36,1) infinite" }}
        />
      </span>
    </div>
  );
}
