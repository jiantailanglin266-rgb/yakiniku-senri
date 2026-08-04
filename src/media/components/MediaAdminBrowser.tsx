"use client";

/**
 * 管理画面の画像一覧（絞り込み・検索つき）。
 *
 * ■ 未承認の画像をここでプレビューしません
 *   `/admin` は検索避けをしていますが、URL を知っていれば誰でも開けます。
 *   確認前の画像をここに描画することは、確認前の画像を公開することと同じです。
 *   代わりに Commons のファイルページへのリンクを出します。
 *   **中身の確認は Commons 側で行ってください。** ライセンステンプレート・
 *   肖像権の注意書き・撮影国も、そちらでしか確認できません。
 *
 * ■ 承認ボタンを置いていません
 *   静的配信のため書き込み先がありません。動かないボタンを置くと
 *   「押したから承認された」と誤解されます。
 *   状態を変えるときは requests.json を直すか、同期を実行してください。
 */
import { useMemo, useState } from "react";

import { getLicense } from "../lib/license";
import { getPagesUsingAsset } from "../data/usages";
import type { MediaLabels } from "../i18n/labels";
import type { VerificationStatus, WikimediaAsset } from "../types";
import { ImageLicenseBadge } from "./ImageLicenseBadge";

const statusLabels: Record<VerificationStatus, { ja: string; en: string; tone: string }> = {
  pending: { ja: "未判定", en: "Pending", tone: "border-cp-line text-cp-dim" },
  needs_review: {
    ja: "要確認",
    en: "Needs review",
    tone: "border-cp-amber/50 bg-cp-amber/10 text-cp-amber",
  },
  license_unknown: {
    ja: "ライセンス不明",
    en: "Licence unknown",
    tone: "border-cp-amber/50 bg-cp-amber/10 text-cp-amber",
  },
  rights_risk: {
    ja: "追加権利リスク",
    en: "Rights risk",
    tone: "border-cp-danger/50 bg-cp-danger/10 text-cp-danger",
  },
  approved: {
    ja: "承認済み",
    en: "Approved",
    tone: "border-cp-emerald/50 bg-cp-emerald/10 text-cp-emerald",
  },
  rejected: {
    ja: "却下",
    en: "Rejected",
    tone: "border-cp-danger/50 bg-cp-danger/10 text-cp-danger",
  },
};

type Filter = "all" | "approved" | "pending" | "rejected";

const filterLabels: Record<Filter, { ja: string; en: string }> = {
  all: { ja: "すべて", en: "All" },
  approved: { ja: "承認済み（表示中）", en: "Approved" },
  pending: { ja: "未承認（非表示）", en: "Awaiting review" },
  rejected: { ja: "却下", en: "Rejected" },
};

function matchesFilter(asset: WikimediaAsset, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "approved") return asset.verificationStatus === "approved";
  if (filter === "rejected") return asset.verificationStatus === "rejected";
  return !["approved", "rejected"].includes(asset.verificationStatus);
}

export function MediaAdminBrowser({
  assets,
  locale,
  labels,
}: {
  assets: WikimediaAsset[];
  locale: string;
  labels: MediaLabels;
}) {
  const ja = locale === "ja";
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: 0, approved: 0, pending: 0, rejected: 0 };
    for (const asset of assets) {
      result.all += 1;
      if (matchesFilter(asset, "approved")) result.approved += 1;
      else if (matchesFilter(asset, "rejected")) result.rejected += 1;
      else result.pending += 1;
    }
    return result;
  }, [assets]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assets
      .filter((asset) => matchesFilter(asset, filter))
      .filter((asset) => {
        if (!needle) return true;
        const haystack = [
          asset.fileName,
          asset.authorName ?? "",
          asset.licenseCode,
          getPagesUsingAsset(asset.id)
            .map((usage) => usage.pageKey)
            .join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => a.fileName.localeCompare(b.fileName));
  }, [assets, filter, query]);

  if (assets.length === 0) {
    return (
      <p className="border-cp-line/50 text-cp-mist rounded-xl border border-dashed px-4 py-3 text-[0.8rem] leading-relaxed">
        {ja
          ? "画像がまだありません。GitHub Actions の「Sync Wikimedia images」を実行すると、ここに候補が並びます。"
          : "No images yet. Run the “Sync Wikimedia images” workflow to populate this list."}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(Object.keys(filterLabels) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={[
              "rounded-full border px-3 py-1 text-[0.72rem] transition-colors",
              filter === key
                ? "border-cp-cyan/60 bg-cp-cyan/15 text-cp-cyan"
                : "border-cp-line text-cp-mist hover:border-cp-cyan/40",
            ].join(" ")}
          >
            {ja ? filterLabels[key].ja : filterLabels[key].en}
            <span className="numeric ms-1.5 opacity-70">{counts[key]}</span>
          </button>
        ))}

        <label className="ms-auto flex items-center gap-2">
          <span className="text-cp-dim text-[0.7rem]">{ja ? "絞り込み" : "Filter"}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ja ? "ファイル名 / 作者 / ページ" : "file / author / page"}
            className="border-cp-line bg-cp-void/60 text-cp-mist placeholder:text-cp-dim/70 focus:border-cp-cyan/60 w-52 rounded-lg border px-2.5 py-1 text-[0.76rem] outline-none"
          />
        </label>
      </div>

      <p className="text-cp-dim mb-2 text-[0.7rem]">
        {ja
          ? `${visible.length} 件を表示（未承認の画像はここでもプレビューしません。Commons で確認してください）`
          : `Showing ${visible.length}. Unapproved images are not previewed here — check them on Commons.`}
      </p>

      <ul className="divide-cp-line/30 border-cp-line/40 divide-y rounded-xl border">
        {visible.map((asset) => {
          const license = getLicense(asset.licenseCode);
          const status = statusLabels[asset.verificationStatus];
          const usages = getPagesUsingAsset(asset.id);
          const isApproved = asset.verificationStatus === "approved";

          return (
            <li key={asset.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded border px-1.5 py-px text-[0.64rem] font-medium ${status.tone}`}
                >
                  {ja ? status.ja : status.en}
                </span>
                <ImageLicenseBadge code={asset.licenseCode} />
                <a
                  href={asset.commonsPageUrl || undefined}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  translate="no"
                  className="text-cp-mist hover:text-cp-cyan text-[0.8rem] underline decoration-dotted underline-offset-2"
                >
                  {asset.fileName}
                </a>
                <span className="text-cp-dim numeric text-[0.68rem]">
                  {asset.width}×{asset.height}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-start gap-3">
                {/* 承認済みの画像だけ、確認用の小さなプレビューを出します */}
                {isApproved && asset.optimized?.thumbnailWebp ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 管理用の確認プレビュー。最適化不要
                  <img
                    src={asset.optimized.thumbnailWebp}
                    alt=""
                    width={120}
                    height={68}
                    loading="lazy"
                    className="border-cp-line/40 h-[68px] w-[120px] shrink-0 rounded border object-cover"
                  />
                ) : null}

                <dl className="text-cp-dim flex flex-1 flex-wrap gap-x-4 gap-y-1 text-[0.7rem]">
                  <div className="flex gap-1.5">
                    <dt>{labels.author}</dt>
                    <dd className="text-cp-mist m-0" translate="no">
                      {asset.authorUrl && asset.authorName ? (
                        <a
                          href={asset.authorUrl}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="underline decoration-dotted underline-offset-2"
                        >
                          {asset.authorName}
                        </a>
                      ) : (
                        (asset.authorName ?? labels.notProvided)
                      )}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>{labels.commercialUse}</dt>
                    <dd className="text-cp-mist m-0">
                      {license.commercialUseAllowed ? labels.allowed : labels.notAllowed}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>{labels.derivativeWorks}</dt>
                    <dd className="text-cp-mist m-0">
                      {license.derivativeWorksAllowed ? labels.allowed : labels.notAllowed}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>{labels.shareAlike}</dt>
                    <dd className="text-cp-mist m-0">
                      {license.shareAlikeRequired ? labels.required : labels.notRequired}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>{ja ? "表示位置" : "Position"}</dt>
                    <dd className="text-cp-mist m-0" translate="no">
                      {typeof asset.objectPosition === "string"
                        ? asset.objectPosition
                        : `${asset.objectPosition.x}% ${asset.objectPosition.y}%`}
                    </dd>
                  </div>
                  {usages.length > 0 ? (
                    <div className="flex gap-1.5">
                      <dt>{ja ? "使用ページ" : "Used on"}</dt>
                      <dd className="text-cp-mist m-0" translate="no">
                        {usages.map((usage) => `${usage.pageKey} (${usage.slot})`).join(", ")}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              {asset.rightsRisks.length > 0 ? (
                <p className="border-cp-danger/40 bg-cp-danger/8 text-cp-danger mt-2 rounded-lg border px-2.5 py-1.5 text-[0.7rem] leading-snug">
                  {ja ? "ライセンスとは別の権利の確認が必要です: " : "Rights beyond the licence: "}
                  <span translate="no">{asset.rightsRisks.join(", ")}</span>
                </p>
              ) : null}

              {asset.verificationNotes.length > 0 ? (
                <details className="mt-2">
                  <summary className="text-cp-dim hover:text-cp-mist cursor-pointer text-[0.7rem]">
                    {ja ? "判定の根拠" : "Why this status"}
                  </summary>
                  <ul className="text-cp-dim mt-1 space-y-0.5 text-[0.7rem] leading-snug">
                    {asset.verificationNotes.map((note, index) => (
                      <li key={`${asset.id}-note-${index}`}>・{note}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="text-cp-dim mt-3 text-[0.68rem] leading-relaxed">
        {ja
          ? "状態を変えるには src/media/data/requests.json を直すか、同期を実行してください。静的配信のため、この画面から書き込むことはできません。"
          : "To change a status, edit src/media/data/requests.json or re-run the sync. This page cannot write — the site is statically exported."}
      </p>
    </div>
  );
}
