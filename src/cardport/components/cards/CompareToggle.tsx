"use client";

import { useCompare } from "@/cardport/hooks/useCompare";
import { cx } from "@/cardport/components/ui/primitives";

/** 比較リストへの追加・削除ボタン */
export function CompareToggle({
  cardId,
  addLabel,
  removeLabel,
  className,
}: {
  cardId: string;
  addLabel: string;
  removeLabel: string;
  className?: string;
}) {
  const { ids, toggle, isFull } = useCompare();
  const selected = ids.includes(cardId);
  // 上限に達していて、かつ未選択のカードは追加できません
  const disabled = isFull && !selected;

  return (
    <button
      type="button"
      onClick={() => toggle(cardId)}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] transition-colors",
        selected
          ? "border-cyan/60 bg-cyan/15 text-cyan"
          : "border-line text-mist hover:border-cyan/50 hover:text-ink",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <svg viewBox="0 0 14 14" className="h-3 w-3" aria-hidden="true">
        {selected ? (
          <path
            d="M2 7.5l3.2 3.2L12 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M7 2v10M2 7h10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </svg>
      {selected ? removeLabel : addLabel}
    </button>
  );
}
