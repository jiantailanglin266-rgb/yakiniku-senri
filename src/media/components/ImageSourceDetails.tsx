/**
 * 画像の出典・ライセンス詳細。
 *
 * ■ なぜ「モーダル」ではなく `<details>` なのか
 *   モーダルは JavaScript が必要で、静的書き出し（GitHub Pages）や
 *   スクリプト無効環境で開けなくなります。クレジットは「見えないと権利上の問題になる」
 *   情報なので、JavaScript 無しでも必ず開ける `<details>` にしています。
 *
 * ■ ここに出す情報
 *   作者・出典・ライセンス・ファイル名・Commons ページ・利用条件の要約。
 *   いずれも原文（作者名・ライセンス名・ファイル名・URL）は翻訳しません。
 *
 * ■ 免責
 *   ライセンスは著作権のみを扱います。被写体の肖像権・商標・建築著作物などは
 *   別問題である旨を必ず併記します（`labels.disclaimer`）。
 */
import { getLicense } from "../lib/license";
import type { WikimediaAsset } from "../types";
import type { MediaLabels } from "../i18n/labels";
import { ImageLicenseBadge } from "./ImageLicenseBadge";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 py-1 max-sm:grid-cols-1">
      <dt className="text-media-dim text-[0.7rem] tracking-wide uppercase">{label}</dt>
      <dd className="text-media-mist m-0 text-[0.78rem] break-words">{children}</dd>
    </div>
  );
}

export function ImageSourceDetails({
  asset,
  labels,
  className,
}: {
  asset: WikimediaAsset;
  labels: MediaLabels;
  className?: string;
}) {
  const license = getLicense(asset.licenseCode);

  return (
    <details className={["group", className ?? ""].join(" ")}>
      <summary className="text-media-dim hover:text-media-mist cursor-pointer list-none text-[0.7rem] underline decoration-dotted underline-offset-2">
        {labels.detailsLabel}
      </summary>

      <dl className="border-media-line/50 mt-2 border-t pt-2">
        <Row label={labels.author}>
          {asset.authorName ? (
            // 作者名は原文のまま。翻訳すると作者表示の義務を満たせなくなります
            asset.authorUrl ? (
              <a
                href={asset.authorUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                translate="no"
                className="underline decoration-dotted underline-offset-2"
              >
                {asset.authorName}
              </a>
            ) : (
              <span translate="no">{asset.authorName}</span>
            )
          ) : (
            // 「作者不明」と断定せず、「記載なし」と書きます
            labels.notProvided
          )}
        </Row>

        <Row label={labels.source}>
          <a
            href={asset.commonsPageUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            translate="no"
            className="underline decoration-dotted underline-offset-2"
          >
            Wikimedia Commons
          </a>
          {asset.sourceName && asset.sourceUrl ? (
            <>
              {" / "}
              <a
                href={asset.sourceUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                translate="no"
                className="underline decoration-dotted underline-offset-2"
              >
                {asset.sourceName}
              </a>
            </>
          ) : null}
        </Row>

        <Row label={labels.license}>
          <span className="inline-flex flex-wrap items-center gap-2">
            <ImageLicenseBadge code={asset.licenseCode} />
            {asset.licenseUrl ? (
              <a
                href={asset.licenseUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                translate="no"
                className="underline decoration-dotted underline-offset-2"
              >
                {asset.licenseUrl}
              </a>
            ) : null}
          </span>
        </Row>

        <Row label={labels.fileName}>
          {/* ファイル名は識別子です。翻訳すると Commons 上で辿れなくなります */}
          <span translate="no">{asset.fileName}</span>
        </Row>

        <Row label={labels.commercialUse}>
          {license.commercialUseAllowed ? labels.allowed : labels.notAllowed}
        </Row>
        <Row label={labels.derivativeWorks}>
          {license.derivativeWorksAllowed ? labels.allowed : labels.notAllowed}
        </Row>
        <Row label={labels.shareAlike}>
          {license.shareAlikeRequired ? labels.required : labels.notRequired}
        </Row>

        {asset.isModified && asset.modificationDescription ? (
          <Row label={labels.modified}>{asset.modificationDescription}</Row>
        ) : null}
      </dl>

      <p className="text-media-dim mt-2 text-[0.68rem] leading-relaxed">{labels.disclaimer}</p>
    </details>
  );
}
