/**
 * クレジット表示。
 *
 * ■ 画像とクレジットを切り離さない
 *   このコンポーネントは WikimediaImage の内部から必ず呼ばれます。
 *   「記事末尾にまとめて出すから画像の近くには出さない」はしません。
 *
 * ■ 各要素をリンクにする
 *   作者ページ・Commons ファイルページ・ライセンスページへ、それぞれ移動できます。
 *
 * ■ 原文を保持する
 *   作者名・ライセンス正式名称・ファイル名は翻訳しません。
 */
import type { WikimediaAsset } from "../types";
import { creditLabels, creditParts } from "../credit";

type Props = {
  asset: WikimediaAsset;
  locale: string;
  /** compact: 画像直下の1行 / full: 一覧・モーダル用の詳細 */
  variant?: "compact" | "full";
  className?: string;
};

export function ImageAttribution({ asset, locale, variant = "compact", className = "" }: Props) {
  const label = creditLabels(locale);
  const parts = creditParts(asset);

  if (variant === "compact") {
    return (
      // translate="no" — 固有名詞とライセンス名を機械翻訳させません
      <p className={`text-ink-faint text-[0.625rem] leading-relaxed ${className}`} translate="no">
        <span className="text-ink-dim">{label.photo}：</span>
        {parts.authorName ? (
          parts.authorUrl ? (
            <a
              href={parts.authorUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="hover:text-cyan underline decoration-dotted underline-offset-2 transition-colors"
            >
              {parts.authorName}
            </a>
          ) : (
            <span>{parts.authorName}</span>
          )
        ) : null}
        {parts.authorName ? " / " : null}
        <a
          href={parts.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="hover:text-cyan underline decoration-dotted underline-offset-2 transition-colors"
        >
          Wikimedia Commons
        </a>
        {" / "}
        {parts.licenseUrl ? (
          <a
            href={parts.licenseUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="hover:text-cyan underline decoration-dotted underline-offset-2 transition-colors"
          >
            {parts.licenseName}
          </a>
        ) : (
          <span>{parts.licenseName}</span>
        )}
        {parts.isModified ? <span className="text-caution">（{label.modified}）</span> : null}
      </p>
    );
  }

  return (
    <dl className={`space-y-1 text-[0.6875rem] ${className}`}>
      <Row label={label.author} translateNo>
        {parts.authorUrl ? (
          <a
            href={parts.authorUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="hover:text-cyan"
          >
            {parts.authorName ?? "—"}
          </a>
        ) : (
          (parts.authorName ?? "—")
        )}
      </Row>
      <Row label={label.source} translateNo>
        <a
          href={parts.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="hover:text-cyan"
        >
          {asset.fileName}
        </a>
      </Row>
      <Row label={label.license} translateNo>
        {parts.licenseUrl ? (
          <a
            href={parts.licenseUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="hover:text-cyan"
          >
            {parts.licenseName}
          </a>
        ) : (
          parts.licenseName
        )}
      </Row>
      {parts.publicDomainBasis ? <Row label="Public domain">{parts.publicDomainBasis}</Row> : null}
      <Row label={label.modified}>
        {parts.isModified
          ? (parts.modificationDescription ?? "—")
          : locale === "ja"
            ? "なし"
            : "No"}
      </Row>
      <Row label={label.retrieved}>{parts.retrievedAt.slice(0, 10)}</Row>
    </dl>
  );
}

function Row({
  label,
  children,
  translateNo = false,
}: {
  label: string;
  children: React.ReactNode;
  translateNo?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <dt className="text-ink-faint w-24 shrink-0">{label}</dt>
      <dd
        className="text-ink-soft min-w-0 flex-1 break-words"
        translate={translateNo ? "no" : undefined}
      >
        {children}
      </dd>
    </div>
  );
}
