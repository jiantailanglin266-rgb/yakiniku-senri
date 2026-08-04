/**
 * 画像の出典一覧。
 *
 * ■ このページの役割
 *   ライセンスが要求する作者表示は、画像のすぐ近くに出すのが原則です。
 *   このページは**その代わり**ではなく、まとめて確認するための補助です
 *   （各画像のクレジットは WikimediaImage が画像と同じ figure に描画します）。
 *
 * ■ 掲載していない画像は、このページにも出しません
 *   「一覧に出ている ＝ 掲載可否の確認が済んでいる」という関係を保つためです。
 */
import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd } from "@/sports/lib/structured-data";

import { ImageLicenseBadge } from "@/media/components";
import { wikimediaAssets, getLocalization } from "@/media/data/assets";
import { getPagesUsingAsset } from "@/media/data/usages";
import { siteAssetCredits } from "@/media/data/site-assets";
import { getMediaLabels } from "@/media/i18n/labels";
import { isPublishable } from "@/media/lib/eligibility";
import { getLicense } from "@/media/lib/license";

export function generateStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const info = findLocale(locale);
  if (!info) return {};
  const labels = getMediaLabels(info.code);
  return sportsMetadata({
    locale: info.code,
    path: "/image-credits",
    title: labels.creditsTitle,
    description: labels.creditsIntro,
  });
}

export default async function ImageCreditsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, dict } = await resolveLocale(params);
  const labels = getMediaLabels(locale);
  const ja = locale === "ja";

  // 掲載できる状態の画像だけを並べます
  const published = wikimediaAssets
    .filter(isPublishable)
    .sort((a, b) => a.fileName.localeCompare(b.fileName));

  const trail = [
    { label: "HOME", path: "/" },
    { label: labels.creditsTitle, path: "/image-credits" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">IMAGE CREDITS</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{labels.creditsTitle}</h1>
        <p className="text-ink-dim mt-3 max-w-3xl text-sm leading-relaxed">{labels.creditsIntro}</p>
      </header>

      <section aria-labelledby="ic-site" className="mb-12">
        <SectionHeading
          id="ic-site"
          eyebrow="SITE ASSETS"
          title={ja ? "Wikimedia 以外の素材" : "Assets other than Wikimedia"}
          description={
            ja
              ? "自作の素材と、他者の素材をライセンスに従って使っているものです。出所の記録が無いものは「出所未確認」と書き、確認できていないことをそのまま示します。"
              : "Assets we made ourselves, and third-party assets used under licence. Where provenance is unrecorded we say so rather than claim authorship."
          }
        />
        <ul className="space-y-3">
          {siteAssetCredits.map((credit) => (
            <li key={credit.id} className="sp-solid p-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* ライセンス名は識別子です。翻訳しません */}
                <span
                  className={`sp-mono rounded border px-1.5 py-0.5 text-[0.625rem] ${
                    credit.origin === "third-party"
                      ? "border-cyan/45 text-cyan"
                      : credit.origin === "unverified"
                        ? "border-caution/45 text-caution"
                        : "border-neon/45 text-neon"
                  }`}
                  translate="no"
                >
                  {credit.licenseCode}
                </span>
                <span className="text-ink-faint text-[0.625rem]">
                  {originLabel(credit.origin, ja)}
                </span>
              </div>

              <h2 className="text-ink mt-2 text-sm font-semibold">{credit.label}</h2>

              <dl className="mt-3 grid gap-x-4 gap-y-1 text-[0.6875rem] sm:grid-cols-2">
                <Row label={ja ? "点数" : "Files"}>{credit.fileCount}</Row>
                <Row label={labels.author}>
                  {credit.authorName ? (
                    credit.authorUrl ? (
                      <a
                        href={credit.authorUrl}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        translate="no"
                        className="hover:text-cyan underline decoration-dotted underline-offset-2"
                      >
                        {credit.authorName}
                      </a>
                    ) : (
                      <span translate="no">{credit.authorName}</span>
                    )
                  ) : (
                    labels.notProvided
                  )}
                </Row>
                <Row label={labels.source}>
                  {credit.sourceUrl ? (
                    <a
                      href={credit.sourceUrl}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      translate="no"
                      className="hover:text-cyan break-all underline decoration-dotted underline-offset-2"
                    >
                      {credit.sourceName ?? credit.sourceUrl}
                    </a>
                  ) : (
                    (credit.sourceName ?? labels.notProvided)
                  )}
                </Row>
                <Row label={labels.license}>
                  {credit.licenseUrl ? (
                    <a
                      href={credit.licenseUrl}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      translate="no"
                      className="hover:text-cyan underline decoration-dotted underline-offset-2"
                    >
                      {credit.licenseName}
                    </a>
                  ) : (
                    <span translate="no">{credit.licenseName}</span>
                  )}
                </Row>
                {/* MIT のように全文の保持が条件のものは、必ず全文への導線を出します */}
                {credit.licenseTextPath ? (
                  <Row label={ja ? "ライセンス全文" : "Licence text"}>
                    <a
                      href={credit.licenseTextPath}
                      className="hover:text-cyan underline decoration-dotted underline-offset-2"
                    >
                      {ja ? "サイト内に全文を掲載しています" : "Full text hosted on this site"}
                    </a>
                  </Row>
                ) : null}
                {credit.isModified && credit.modificationDescription ? (
                  <Row label={labels.modified}>{credit.modificationDescription}</Row>
                ) : null}
                <Row label={ja ? "使用箇所" : "Used on"}>{credit.usedOn.join("、")}</Row>
                <Row label={ja ? "確認日" : "Verified"}>
                  {credit.verifiedAt ?? (ja ? "未確認" : "Not verified")}
                </Row>
              </dl>

              <p className="text-ink-faint mt-2 text-[0.625rem] leading-relaxed">
                {credit.verificationNote}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ic-commons" className="mb-12">
        <SectionHeading
          id="ic-commons"
          eyebrow="WIKIMEDIA COMMONS"
          title={ja ? "Wikimedia Commons の画像" : "Images from Wikimedia Commons"}
        />

        {published.length === 0 ? (
          /*
            画像が0件でも、それらしい一覧を作りません。
            ライセンス確認が済んでいない画像を「掲載中」に見せないためです。
          */
          <div className="sp-solid text-ink-soft p-5 text-sm leading-relaxed">
            <p>
              {ja
                ? "現在、ライセンスを確認できた Wikimedia Commons の画像はありません。"
                : "No Wikimedia Commons images have completed licence verification yet."}
            </p>
            <p className="text-ink-dim mt-2 text-xs">
              {ja
                ? "確認が済むまで、各ページは画像を使わない装飾表現で表示しています。"
                : "Until they do, pages use image-free decorative visuals."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {published.map((asset) => {
              const license = getLicense(asset.licenseCode);
              const localization = getLocalization(asset.id, locale);
              const usages = getPagesUsingAsset(asset.id);

              return (
                <li key={asset.id} className="sp-solid p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <ImageLicenseBadge code={asset.licenseCode} />
                    <span className="text-ink-faint text-[0.6875rem]">
                      {labels.commercialUse}:{" "}
                      {license.commercialUseAllowed ? labels.allowed : labels.notAllowed}
                    </span>
                    <span className="text-ink-faint text-[0.6875rem]">
                      {labels.derivativeWorks}:{" "}
                      {license.derivativeWorksAllowed ? labels.allowed : labels.notAllowed}
                    </span>
                    <span className="text-ink-faint text-[0.6875rem]">
                      {labels.shareAlike}:{" "}
                      {license.shareAlikeRequired ? labels.required : labels.notRequired}
                    </span>
                  </div>

                  {/* ファイル名は識別子です。翻訳しません */}
                  <h2 className="text-ink mt-2 text-sm font-semibold" translate="no">
                    {asset.fileName}
                  </h2>
                  {localization?.caption ? (
                    <p className="text-ink-dim mt-1 text-xs leading-relaxed">
                      {localization.caption}
                    </p>
                  ) : null}

                  <dl className="mt-3 grid gap-x-4 gap-y-1 text-[0.6875rem] sm:grid-cols-2">
                    <Row label={labels.author}>
                      {asset.authorName ? (
                        asset.authorUrl ? (
                          <a
                            href={asset.authorUrl}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            translate="no"
                            className="hover:text-cyan underline decoration-dotted underline-offset-2"
                          >
                            {asset.authorName}
                          </a>
                        ) : (
                          <span translate="no">{asset.authorName}</span>
                        )
                      ) : (
                        labels.notProvided
                      )}
                    </Row>
                    <Row label={labels.source}>
                      <a
                        href={asset.commonsPageUrl}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        translate="no"
                        className="hover:text-cyan underline decoration-dotted underline-offset-2"
                      >
                        Wikimedia Commons
                      </a>
                    </Row>
                    <Row label={labels.license}>
                      {asset.licenseUrl ? (
                        <a
                          href={asset.licenseUrl}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          translate="no"
                          className="hover:text-cyan underline decoration-dotted underline-offset-2"
                        >
                          {license.name}
                        </a>
                      ) : (
                        <span translate="no">{license.name}</span>
                      )}
                      {asset.isModified ? ` ${labels.modified}` : ""}
                    </Row>
                    {usages.length > 0 ? (
                      <Row label={ja ? "使用ページ" : "Used on"}>
                        <span translate="no">
                          {usages.map((usage) => usage.pageKey).join(", ")}
                        </span>
                      </Row>
                    ) : null}
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="ic-policy" className="mb-4">
        <SectionHeading
          id="ic-policy"
          eyebrow="POLICY"
          title={ja ? "画像の掲載方針" : "How we handle images"}
        />
        <ul className="sp-solid divide-edge divide-y">
          {[
            ja
              ? "対象は Wikimedia Commons に登録されたファイルです。Wikipedia の記事に表示されているという理由だけで転載することはしません。"
              : "We only use files hosted on Wikimedia Commons. Appearing in a Wikipedia article is never on its own a reason to reuse an image.",
            ja
              ? "ライセンス・作者・出典を機械的に確認できない画像は掲載しません。取得できたことと、掲載してよいことは別に判定しています。"
              : "Images whose licence, author or source cannot be verified are not published. Successful retrieval and permission to publish are judged separately.",
            ja
              ? "商用利用不可（CC BY-NC など）・改変不可（CC BY-ND）・ライセンス不明の画像は使用しません。"
              : "We do not use non-commercial, no-derivatives or unknown-licence images.",
            ja
              ? "存命人物・商標・建築著作物・美術作品が写る画像は、ライセンスが自由でも自動公開しません。"
              : "Images showing living people, trademarks, architecture or artworks are never auto-published, however free the licence.",
            labels.disclaimer,
            ja
              ? "当サイトは Wikimedia Foundation とは関係がなく、同財団による推奨も受けていません。"
              : "This site is not affiliated with, nor endorsed by, the Wikimedia Foundation.",
          ].map((item) => (
            <li key={item} className="text-ink-soft px-4 py-3 text-sm leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-ink-faint text-[0.6875rem]">
        <Link href={href(locale, "/legal/copyright")} className="hover:text-cyan">
          {dict.footerCopyright}
        </Link>
      </p>

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </>
  );
}

function originLabel(origin: string, ja: boolean): string {
  if (origin === "third-party") return ja ? "他者の素材" : "Third-party";
  if (origin === "unverified") return ja ? "出所未確認" : "Provenance unverified";
  return ja ? "自作" : "Made in-house";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-ink-faint w-24 shrink-0">{label}</dt>
      <dd className="text-ink-soft m-0 min-w-0 flex-1 break-words">{children}</dd>
    </div>
  );
}
