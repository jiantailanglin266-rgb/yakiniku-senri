/**
 * 券面（プレースホルダー）。
 *
 * ⚠ 実在するカードの意匠は使いません。
 *   `card.art` の3色とテクスチャから CSS で描画します。
 *   本番データでは、カード会社から提供された画像へ差し替えてください。
 *
 * 比率は ISO/IEC 7810 ID-1（85.60 × 53.98mm = 1.585:1）に合わせています。
 */
import { cx } from "@/cardport/components/ui/primitives";
import type { Card } from "@/cardport/data/types";
import { brandLabels } from "@/cardport/data/issuers";
import { pick } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";

const textureClass: Record<Card["art"]["texture"], string> = {
  holo: "before:holo before:opacity-40",
  matte: "before:opacity-0",
  metal:
    "before:bg-[linear-gradient(115deg,rgba(255,255,255,.28)_0%,transparent_28%,rgba(255,255,255,.18)_52%,transparent_74%)]",
  carbon:
    "before:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.06)_0_2px,transparent_2px_5px)]",
};

export function CardArt({
  card,
  locale,
  className,
  sheen = true,
  showChip = true,
}: {
  card: Card;
  locale: Locale;
  className?: string;
  sheen?: boolean;
  showChip?: boolean;
}) {
  return (
    <div
      className={cx(
        "card3d relative isolate overflow-hidden",
        "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
        textureClass[card.art.texture],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${card.art.from} 0%, ${card.art.via} 52%, ${card.art.to} 100%)`,
      }}
    >
      {sheen ? <span className="card3d-sheen" aria-hidden="true" /> : null}

      <div className="relative z-10 flex h-full flex-col justify-between p-[6%]">
        <div className="flex items-start justify-between gap-2">
          {/* カード幅に対する比率で指定し、小さな券面でも溢れないようにします */}
          <p
            className="line-clamp-2 leading-tight font-semibold text-white/90"
            style={{ fontSize: "6cqw", letterSpacing: "0.06em" }}
          >
            {pick(card.name, locale)}
          </p>
          {card.crypto ? (
            <span
              className="shrink-0 rounded bg-white/20 px-1.5 py-px tracking-wider text-white/90"
              style={{ fontSize: "4.4cqw" }}
            >
              CRYPTO
            </span>
          ) : null}
        </div>

        {showChip ? (
          <div className="flex items-center gap-2">
            {/* ICチップ */}
            <span
              aria-hidden="true"
              className="h-[8%] min-h-4 w-[13%] min-w-6 rounded-[3px] shadow-inner"
              style={{ background: "linear-gradient(140deg,#f5e6b4,#c9a961 45%,#eedfa8)" }}
            />
            {/* 非接触決済のマーク */}
            {card.touchPayment ? (
              <svg
                viewBox="0 0 24 24"
                className="h-[7%] min-h-3.5 w-auto text-white/80"
                aria-hidden="true"
              >
                <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 8a7 7 0 0 1 0 8" />
                  <path d="M11 5.5a11 11 0 0 1 0 13" />
                  <path d="M15 3a15 15 0 0 1 0 18" />
                </g>
              </svg>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-2">
          <p
            className="numeric text-white/70"
            style={{ fontSize: "5cqw", letterSpacing: "0.22em" }}
          >
            •••• •••• •••• ••••
          </p>
          <p
            className="shrink-0 font-semibold tracking-wide text-white/85"
            style={{ fontSize: "5cqw" }}
          >
            {brandLabels[card.brands[0]]}
          </p>
        </div>
      </div>
    </div>
  );
}
