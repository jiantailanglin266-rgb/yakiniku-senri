/**
 * 管理画面の画像確認キュー。
 *
 * ■ 見せているもの
 *   取得結果・関連度・ライセンス・利用条件・追加権利のリスク・判定理由。
 *   「なぜこの状態なのか」を必ず読めるようにしています。
 *
 * ■ ここで承認ボタンを押せない理由
 *   このサイトは静的書き出し（GitHub Pages）で配信しており、書き込み先がありません。
 *   承認・却下・使用停止は、管理APIを接続してから有効になります。
 *   動かないボタンを置くと「承認済み」と誤解される恐れがあるため、
 *   接続前は操作ではなく**状態と根拠**だけを表示します。
 */
import { getLicense } from "../lib/license";
import { getPagesUsingAsset } from "../data/usages";
import type { MediaLabels } from "../i18n/labels";
import type { VerificationStatus, WikimediaAsset } from "../types";
import { ImageLicenseBadge } from "./ImageLicenseBadge";

const statusLabels: Record<VerificationStatus, { ja: string; en: string; tone: string }> = {
  pending: { ja: "未判定", en: "Pending", tone: "border-media-line text-media-dim" },
  needs_review: {
    ja: "要確認",
    en: "Needs review",
    tone: "border-media-amber/50 bg-media-amber/10 text-media-amber",
  },
  license_unknown: {
    ja: "ライセンス不明",
    en: "Licence unknown",
    tone: "border-media-amber/50 bg-media-amber/10 text-media-amber",
  },
  rights_risk: {
    ja: "追加権利リスク",
    en: "Rights risk",
    tone: "border-media-danger/50 bg-media-danger/10 text-media-danger",
  },
  approved: {
    ja: "承認済み",
    en: "Approved",
    tone: "border-media-emerald/50 bg-media-emerald/10 text-media-emerald",
  },
  rejected: {
    ja: "却下",
    en: "Rejected",
    tone: "border-media-danger/50 bg-media-danger/10 text-media-danger",
  },
};

export function MediaReviewQueue({
  assets,
  locale,
  labels,
}: {
  assets: WikimediaAsset[];
  locale: string;
  labels: MediaLabels;
}) {
  const ja = locale === "ja";

  if (assets.length === 0) {
    return (
      <p className="border-media-line/50 text-media-mist rounded-xl border border-dashed px-4 py-3 text-[0.8rem] leading-relaxed">
        {ja
          ? "確認待ちの画像はありません。scripts/wikimedia-sync.mjs を実行すると候補がここに並びます。"
          : "No images are awaiting review. Run scripts/wikimedia-sync.mjs to populate this queue."}
      </p>
    );
  }

  return (
    <ul className="divide-media-line/30 divide-y">
      {assets.map((asset) => {
        const license = getLicense(asset.licenseCode);
        const status = statusLabels[asset.verificationStatus];
        const usages = getPagesUsingAsset(asset.id);

        return (
          <li key={asset.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded border px-1.5 py-px text-[0.64rem] font-medium ${status.tone}`}
              >
                {ja ? status.ja : status.en}
              </span>
              <ImageLicenseBadge code={asset.licenseCode} />
              {/* ファイル名は識別子。翻訳しません */}
              <a
                href={asset.commonsPageUrl || undefined}
                target="_blank"
                rel="nofollow noopener noreferrer"
                translate="no"
                className="text-media-mist hover:text-media-cyan text-[0.8rem] underline decoration-dotted underline-offset-2"
              >
                {asset.fileName}
              </a>
              <span className="text-media-dim numeric text-[0.68rem]">
                {asset.width}×{asset.height}
              </span>
            </div>

            <dl className="text-media-dim mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem]">
              <div className="flex gap-1.5">
                <dt>{labels.author}</dt>
                <dd className="text-media-mist m-0" translate="no">
                  {asset.authorName ?? labels.notProvided}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt>{labels.commercialUse}</dt>
                <dd className="text-media-mist m-0">
                  {license.commercialUseAllowed ? labels.allowed : labels.notAllowed}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt>{labels.derivativeWorks}</dt>
                <dd className="text-media-mist m-0">
                  {license.derivativeWorksAllowed ? labels.allowed : labels.notAllowed}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt>{labels.shareAlike}</dt>
                <dd className="text-media-mist m-0">
                  {license.shareAlikeRequired ? labels.required : labels.notRequired}
                </dd>
              </div>
              {usages.length > 0 ? (
                <div className="flex gap-1.5">
                  <dt>{ja ? "使用ページ" : "Used on"}</dt>
                  <dd className="text-media-mist m-0" translate="no">
                    {usages.map((usage) => usage.pageKey).join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>

            {asset.rightsRisks.length > 0 ? (
              <p className="border-media-danger/40 bg-media-danger/8 text-media-danger mt-2 rounded-lg border px-2.5 py-1.5 text-[0.7rem] leading-snug">
                {ja ? "ライセンスとは別の権利の確認が必要です: " : "Rights beyond the licence: "}
                <span translate="no">{asset.rightsRisks.join(", ")}</span>
              </p>
            ) : null}

            {asset.verificationNotes.length > 0 ? (
              <ul className="text-media-dim mt-2 space-y-0.5 text-[0.7rem] leading-snug">
                {asset.verificationNotes.map((note) => (
                  <li key={note}>・{note}</li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
