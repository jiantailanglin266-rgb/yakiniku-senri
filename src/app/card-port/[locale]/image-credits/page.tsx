/**
 * 画像の出典一覧。
 *
 * ■ このページの役割
 *   ライセンスが要求する作者表示は、画像のすぐ近くに出すのが原則です。
 *   このページは**その代わり**ではなく、まとめて確認・検証するための補助です。
 *   （各画像のクレジットは WikimediaImage が画像と同じ figure に描画します）
 *
 * ■ 掲載していない画像
 *   ライセンスを確認できていない画像は、このページにも出しません。
 *   「一覧に出ている ＝ 掲載可否の確認が済んでいる」という関係を保つためです。
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageShell } from "@/cardport/components/layout/PageShell";
import { Notice, Panel, SectionHeading } from "@/cardport/components/ui/primitives";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { ImageLicenseBadge } from "@/media/components";
import { wikimediaAssets, getLocalization } from "@/media/data/assets";
import { thirdPartyAssets } from "@/media/data/third-party";
import { getPagesUsingAsset } from "@/media/data/usages";
import { getMediaLabels } from "@/media/i18n/labels";
import { isPublishable } from "@/media/lib/eligibility";
import { getLicense } from "@/media/lib/license";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const labels = getMediaLabels(locale);
  return cardportMetadata({
    title: labels.creditsTitle,
    description: labels.creditsIntro,
    path: routes.imageCredits(locale),
    locale,
  });
}

export default async function ImageCreditsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);
  const labels = getMediaLabels(locale);

  // 掲載できる状態の画像だけを並べます
  const published = wikimediaAssets
    .filter(isPublishable)
    .sort((a, b) => a.fileName.localeCompare(b.fileName));

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: labels.creditsTitle, path: routes.imageCredits(locale) },
      ]}
      eyebrow="IMAGE CREDITS"
      title={labels.creditsTitle}
    >
      <p className="text-cp-mist max-w-3xl text-[0.86rem] leading-relaxed">{labels.creditsIntro}</p>

      {thirdPartyAssets.length > 0 ? (
        <section className="mt-8">
          <SectionHeading
            eyebrow="THIRD PARTY"
            title={locale === "ja" ? "第三者素材" : "Third-party assets"}
            accent="cyan"
          />
          <ul className="mt-3 grid gap-3">
            {thirdPartyAssets.map((asset) => (
              <li key={asset.id}>
                <Panel as="article" className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    {/* 素材名とライセンス名は識別子です。翻訳しません */}
                    <h2 className="text-cp-ink text-[0.9rem] font-semibold" translate="no">
                      {asset.name}
                    </h2>
                    <span className="text-cp-cyan text-[0.7rem]" translate="no">
                      {asset.licenseName}
                    </span>
                  </div>
                  <p className="text-cp-mist mt-1 text-[0.78rem] leading-relaxed">
                    {locale === "ja" ? asset.usage.ja : asset.usage.en}
                  </p>
                  <dl className="mt-3 grid gap-x-4 gap-y-1 text-[0.76rem] sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="text-cp-dim w-20 shrink-0">
                        {locale === "ja" ? "著作権表示" : "Copyright"}
                      </dt>
                      {/* ライセンスが保持を求める表示です。省略できません */}
                      <dd className="text-cp-mist m-0" translate="no">
                        {asset.copyrightNotice}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-cp-dim w-20 shrink-0">{labels.source}</dt>
                      <dd className="text-cp-mist m-0">
                        <a
                          href={asset.sourceUrl}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="break-all underline decoration-dotted underline-offset-2"
                        >
                          {asset.sourceUrl}
                        </a>
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-cp-dim w-20 shrink-0">{labels.license}</dt>
                      <dd className="text-cp-mist m-0">
                        <a
                          href={asset.licenseUrl}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="break-all underline decoration-dotted underline-offset-2"
                        >
                          {asset.licenseUrl}
                        </a>
                      </dd>
                    </div>
                    {asset.modification ? (
                      <div className="flex gap-2">
                        <dt className="text-cp-dim w-20 shrink-0">{labels.modified}</dt>
                        <dd className="text-cp-mist m-0">
                          {locale === "ja" ? asset.modification.ja : asset.modification.en}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </Panel>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {published.length === 0 ? (
        <div className="mt-6 max-w-3xl">
          {/*
            画像が0件でも、それらしい一覧を作りません。
            ライセンス確認が済んでいない画像を「掲載中」に見せないためです。
          */}
          <Notice>
            {locale === "ja"
              ? "現在、ライセンスを確認できた Wikimedia Commons の画像はありません。確認が済むまで、各ページは画像を使わない装飾表現で表示しています。"
              : "No Wikimedia Commons images have completed licence verification yet. Until they do, pages use image-free decorative visuals."}
          </Notice>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {published.map((asset) => {
            const license = getLicense(asset.licenseCode);
            const localization = getLocalization(asset.id, locale);
            const usages = getPagesUsingAsset(asset.id);

            return (
              <li key={asset.id}>
                <Panel as="article" className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <ImageLicenseBadge code={asset.licenseCode} />
                    <span className="text-cp-dim text-[0.7rem]">
                      {labels.commercialUse}:{" "}
                      {license.commercialUseAllowed ? labels.allowed : labels.notAllowed}
                    </span>
                    <span className="text-cp-dim text-[0.7rem]">
                      {labels.derivativeWorks}:{" "}
                      {license.derivativeWorksAllowed ? labels.allowed : labels.notAllowed}
                    </span>
                    <span className="text-cp-dim text-[0.7rem]">
                      {labels.shareAlike}:{" "}
                      {license.shareAlikeRequired ? labels.required : labels.notRequired}
                    </span>
                  </div>

                  {/* ファイル名は識別子です。翻訳しません */}
                  <h2 className="text-cp-ink mt-2 text-[0.9rem] font-semibold" translate="no">
                    {asset.fileName}
                  </h2>

                  {localization?.caption ? (
                    <p className="text-cp-mist mt-1 text-[0.78rem] leading-relaxed">
                      {localization.caption}
                    </p>
                  ) : null}

                  <dl className="mt-3 grid gap-x-4 gap-y-1 text-[0.76rem] sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="text-cp-dim w-20 shrink-0">{labels.author}</dt>
                      <dd className="text-cp-mist m-0">
                        {asset.authorName ? (
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
                          labels.notProvided
                        )}
                      </dd>
                    </div>

                    <div className="flex gap-2">
                      <dt className="text-cp-dim w-20 shrink-0">{labels.source}</dt>
                      <dd className="text-cp-mist m-0">
                        <a
                          href={asset.commonsPageUrl}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          translate="no"
                          className="underline decoration-dotted underline-offset-2"
                        >
                          Wikimedia Commons
                        </a>
                      </dd>
                    </div>

                    <div className="flex gap-2">
                      <dt className="text-cp-dim w-20 shrink-0">{labels.license}</dt>
                      <dd className="text-cp-mist m-0">
                        {asset.licenseUrl ? (
                          <a
                            href={asset.licenseUrl}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            translate="no"
                            className="underline decoration-dotted underline-offset-2"
                          >
                            {license.name}
                          </a>
                        ) : (
                          <span translate="no">{license.name}</span>
                        )}
                        {asset.isModified ? ` ${labels.modified}` : ""}
                      </dd>
                    </div>

                    {usages.length > 0 ? (
                      <div className="flex gap-2">
                        <dt className="text-cp-dim w-20 shrink-0">
                          {locale === "ja" ? "使用ページ" : "Used on"}
                        </dt>
                        <dd className="text-cp-mist m-0" translate="no">
                          {usages.map((usage) => usage.pageKey).join(", ")}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 max-w-3xl">
        <SectionHeading
          eyebrow="NOTE"
          title={locale === "ja" ? "画像の取り扱いについて" : "How we handle images"}
          accent="violet"
        />
        <ul className="text-cp-mist mt-3 space-y-2 text-[0.8rem] leading-relaxed">
          <li>
            {locale === "ja"
              ? "対象は Wikimedia Commons に登録されたファイルです。Wikipedia の記事に表示されているという理由だけで転載することはしません。"
              : "We only use files hosted on Wikimedia Commons. Appearing in a Wikipedia article is never on its own a reason to reuse an image."}
          </li>
          <li>
            {locale === "ja"
              ? "ライセンス・作者・出典を機械的に確認できない画像は掲載しません。取得できたことと、掲載してよいことは別に判定しています。"
              : "Images whose licence, author or source cannot be verified are not published. Successful retrieval and permission to publish are judged separately."}
          </li>
          <li>{labels.disclaimer}</li>
          <li>
            {locale === "ja"
              ? "当サイトは Wikimedia Foundation とは関係がなく、同財団による推奨も受けていません。"
              : "This site is not affiliated with, nor endorsed by, the Wikimedia Foundation."}
          </li>
        </ul>
      </div>
    </PageShell>
  );
}
