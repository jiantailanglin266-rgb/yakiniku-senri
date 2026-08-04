"use client";

import Link from "next/link";
import { localePath } from "@/portal/i18n/config";
import { resolveLink } from "@/portal/lib/affiliate";
import { t } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { Exchange } from "@/portal/lib/types";
import { Badge, SupportMark } from "@/portal/components/ui/primitives";
import { OutboundLink } from "@/portal/components/ui/links";
import { CompareTable, type CompareColumn } from "./CompareTable";

/**
 * 取引所の比較表。
 *
 * ■ クライアントコンポーネントである理由
 *   列の描画関数（render）は関数なので、サーバーからクライアントへ渡せません。
 *   そのため、表の組み立てごとこちら側で行います。
 *   受け取るのはプレーンなデータだけです。
 *
 * ■ アフィリエイトリンク
 *   `resolveLink` が環境変数を見て、設定済みなら広告リンク＋PR表記、
 *   未設定なら公式サイトへの通常リンクになります。
 */
export function ExchangeCompare({
  exchanges,
  locale,
  dict,
  placement,
}: {
  exchanges: Exchange[];
  locale: string;
  dict: Dictionary;
  /** クリック計測用の設置場所 */
  placement: string;
}) {
  const supportLabels = {
    yes: dict.common.yes,
    no: dict.common.no,
    partial: dict.common.partial,
    unknown: dict.common.unknown,
  };

  const columns: CompareColumn<Exchange>[] = [
    {
      key: "rating",
      label: dict.exchanges.rating,
      align: "center",
      render: (row) => <span className="font-mono">{row.rating.toFixed(1)}</span>,
    },
    {
      key: "spot",
      label: dict.exchanges.spot,
      align: "center",
      render: (row) => <SupportMark value={row.spot} labels={supportLabels} />,
    },
    {
      key: "margin",
      label: dict.exchanges.margin,
      align: "center",
      render: (row) => <SupportMark value={row.margin} labels={supportLabels} />,
    },
    {
      key: "futures",
      label: dict.exchanges.futures,
      align: "center",
      secondary: true,
      render: (row) => <SupportMark value={row.futures} labels={supportLabels} />,
    },
    {
      key: "tradingFee",
      label: dict.exchanges.tradingFee,
      render: (row) => <span className="text-xs">{t(row.tradingFee, locale)}</span>,
    },
    {
      key: "spread",
      label: dict.exchanges.spread,
      secondary: true,
      render: (row) => <span className="text-xs">{t(row.spread, locale)}</span>,
    },
    {
      key: "savings",
      label: dict.exchanges.savings,
      align: "center",
      render: (row) => <SupportMark value={row.savings} labels={supportLabels} />,
    },
    {
      key: "staking",
      label: dict.exchanges.staking,
      align: "center",
      render: (row) => <SupportMark value={row.staking} labels={supportLabels} />,
    },
    {
      key: "lending",
      label: dict.exchanges.lending,
      align: "center",
      secondary: true,
      render: (row) => <SupportMark value={row.lending} labels={supportLabels} />,
    },
    {
      key: "app",
      label: dict.exchanges.app,
      align: "center",
      secondary: true,
      render: (row) => <SupportMark value={row.app} labels={supportLabels} />,
    },
    {
      key: "japanese",
      label: dict.exchanges.japanese,
      align: "center",
      render: (row) => <SupportMark value={row.japanese} labels={supportLabels} />,
    },
    {
      key: "cta",
      label: dict.exchanges.openAccount,
      align: "center",
      render: (row) => {
        const link = resolveLink(row.affiliateId, row.officialUrl);
        return (
          <OutboundLink
            link={link}
            placement={placement}
            label={row.name}
            adLabel={dict.common.sponsored}
            srExternal={dict.a11y.externalLink}
            className="rounded-full bg-linear-to-r from-(--color-cyan) to-(--color-violet) px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-(--color-void)"
          >
            {dict.exchanges.viewOfficial}
          </OutboundLink>
        );
      },
    },
  ];

  return (
    <CompareTable
      rows={exchanges}
      columns={columns}
      labels={{ table: dict.common.showAsTable, cards: dict.common.showAsCards }}
      caption={dict.exchanges.domestic}
      rowHeader={(row) => (
        <Link
          href={localePath(locale, `/exchanges/${row.slug}`)}
          className="flex items-center gap-3"
        >
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg font-mono text-[0.625rem] font-bold"
            style={{
              color: row.color,
              background: `${row.color}1a`,
              border: `1px solid ${row.color}44`,
            }}
          >
            {row.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block font-medium whitespace-nowrap">{row.name}</span>
            {row.beginnerFriendly ? (
              <Badge tone="emerald" className="mt-0.5">
                {dict.exchanges.beginner}
              </Badge>
            ) : null}
          </span>
        </Link>
      )}
    />
  );
}
