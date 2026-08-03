import { store } from "@/data/store";
import { cn } from "@/lib/utils";

export function BusinessHours({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <dl className={cn("space-y-2.5", className)}>
      {store.businessHours.map((hour) => (
        <div key={hour.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <dt className="text-gold/80 min-w-[5.5rem] text-[0.7rem] tracking-[0.14em]">
            {hour.label}
          </dt>
          <dd className="text-ivory/90 text-sm">
            {hour.value}
            {hour.lastOrder && !compact ? (
              <span className="text-gray ml-2 text-[0.7rem]">（L.O. {hour.lastOrder}）</span>
            ) : null}
          </dd>
        </div>
      ))}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <dt className="text-gold/80 min-w-[5.5rem] text-[0.7rem] tracking-[0.14em]">定休日</dt>
        <dd className="text-ivory/90 text-sm">{store.closed}</dd>
      </div>
    </dl>
  );
}
