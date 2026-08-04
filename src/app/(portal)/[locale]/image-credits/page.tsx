/**
 * 画像の出典一覧（CRYPTO PORT）。
 *
 * ■ このページの位置づけ
 *   ライセンスが求める作者表示は、原則として**画像のすぐ近く**に出します
 *   （`MediaSlot` / `WikimediaFigure` が画像と同じ figure に描画します）。
 *   このページはその代わりではなく、まとめて確認するための補助です。
 *
 * ■ 掲載していない画像は載せません
 *   ライセンス・作者・出典を確認できていない画像は、この一覧にも出しません。
 *   「一覧にある ＝ 掲載可否の確認が済んでいる」という関係を保つためです。
 *
 * ■ 原文を訳さない箇所
 *   作者名・ファイル名・ライセンス正式名称・Wikimedia Commons は
 *   `translate="no"` を付け、多言語ページでも原文のまま表示します。
 *   訳すとライセンスが求める「作者の表示」を満たさなくなります。
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { Badge, GlassCard, NoticeBox, SectionHeading } from "@/portal/components/ui/primitives";

import { ImageLicenseBadge } from "@/media/components";
import { getLocalization, wikimediaAssets } from "@/media/data/assets";
import { getPagesUsingAsset } from "@/media/data/usages";
import { getMediaLabels } from "@/media/i18n/labels";
import { isPublishable } from "@/media/lib/eligibility";
import { getLicense } from "@/media/lib/license";
import { getReviewableLicenses } from "@/media/config/licenses";
import photoManifest from "@/portal/data/photo-manifest.json";
import { photoCredit } from "@/portal/lib/photos";

export function generateStaticParams() {
  return staticLocales().map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const labels = getMediaLabels(locale);
  return portalMetadata({
    locale,
    path: "/image-credits",
    title: labels.creditsTitle,
    description: labels.creditsIntro,
  });
}

export default async function ImageCreditsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const labels = getMediaLabels(locale);
  const ja = locale === "ja";

  // 一括クレジット方式で配信している写真（mountain-peak 方式）
  const photoFiles = Object.values(photoManifest as Record<string, { commonsFile: string }>)
    .map((entry) => entry.commonsFile)
    .sort((a, b) => a.localeCompare(b));

  // 1件ずつ確認して掲載できる状態になった画像（共通メディア基盤）
  const published = wikimediaAssets
    .filter(isPublishable)
    .sort((a, b) => a.fileName.localeCompare(b.fileName));

  return (
    <Section className="pt-28">
      <Container size="text">
        <Breadcrumbs
          trail={[{ name: labels.creditsTitle, path: "/image-credits" }]}
          locale={locale}
          dict={dict}
        />
        <PageHeader
          eyebrow="IMAGE CREDITS"
          title={labels.creditsTitle}
          /* 共通ラベルの creditsIntro は「1件ずつ確認したものだけ」を前提にしています。
             CRYPTO PORT には一括クレジットの写真もあるため、この画面の説明は差し替えます */
          lead={
            ja
              ? "当サイトで使用している画像の出典です。サイト共通クレジットで表示している写真と、1件ずつ確認して個別クレジットを付けている画像の2種類があります。"
              : "Sources for the images used on this site. Some carry a site-wide credit; others are verified individually and carry per-image attribution."
          }
        />

        <SectionHeading
          eyebrow="POLICY"
          title={ja ? "画像の取り扱いについて" : "How we handle images"}
        />
        <ul className="mt-3 grid gap-2 text-sm text-(--color-ink-soft)">
          <li>
            {ja
              ? "対象は Wikimedia Commons に登録されたファイルです。Wikipedia の記事に表示されているという理由だけで転載することはしません。"
              : "We only use files hosted on Wikimedia Commons. Appearing in a Wikipedia article is never on its own a reason to reuse an image."}
          </li>
          <li>
            {ja
              ? "取得できたことと、掲載してよいことは別に判定しています。ライセンス・作者・出典を機械的に確認できない画像は公開しません。"
              : "Successful retrieval and permission to publish are judged separately. Images whose licence, author or source cannot be verified are never published."}
          </li>
          <li>
            {ja
              ? "適切な画像が見つからない枠には、無理に画像を当てず、サイト独自の装飾表現を表示します。"
              : "Where no suitable image exists, we show our own decorative visual rather than forcing an unrelated image into the slot."}
          </li>
          <li>{labels.disclaimer}</li>
          <li>
            {ja
              ? "当サイトは Wikimedia Foundation および Wikipedia とは関係がなく、これらによる推奨も受けていません。"
              : "This site is not affiliated with, nor endorsed by, the Wikimedia Foundation or Wikipedia."}
          </li>
        </ul>

        <div className="mt-10">
          <SectionHeading
            eyebrow="LICENCES"
            title={ja ? "使用を許可しているライセンス" : "Accepted licences"}
          />
          {/* ライセンス名は識別子です。翻訳しません */}
          <ul className="mt-3 flex flex-wrap gap-2">
            {getReviewableLicenses().map((code) => (
              <li key={code}>
                <Badge tone="neutral" className="font-mono">
                  <span translate="no">{code}</span>
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-(--color-ink-dim)">
            {ja
              ? "CC BY-NC / CC BY-ND / GFDL 単独 / フェアユース / 権利表示なしのものは対象外です。"
              : "CC BY-NC, CC BY-ND, GFDL-only, fair use and images without rights information are excluded."}
          </p>
        </div>

        <div className="mt-10">
          <SectionHeading
            eyebrow="PHOTOS"
            title={ja ? "サイト共通クレジットの写真" : "Site-wide credited photos"}
          />
          <p className="mt-3 text-sm text-(--color-ink-soft)">
            {ja
              ? "解説記事と銘柄ページの写真は Wikimedia Commons から取得し、当サイトから配信しています。これらは画像ごとの個別表記ではなく、以下のサイト共通クレジットで表示しています。"
              : "Photos on guide and coin pages come from Wikimedia Commons and are served from this site. They carry the following site-wide credit rather than per-image attribution."}
          </p>
          <p className="mt-2 text-sm text-(--color-ink)" translate="no">
            {photoCredit(locale)}
          </p>

          {photoFiles.length === 0 ? (
            <p className="mt-3 text-sm text-(--color-ink-dim)">
              {ja
                ? "現在、取得済みの写真はありません（scripts/portal-photos.mjs 未実行）。"
                : "No photos have been fetched yet (scripts/portal-photos.mjs has not been run)."}
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm text-(--color-ink-dim)">
                {ja ? "使用しているファイル" : "Files in use"}（{photoFiles.length}）
              </p>
              {/* ファイル名は識別子です。翻訳しません */}
              <ul className="mt-2 grid gap-1 text-xs text-(--color-ink-soft)" translate="no">
                {photoFiles.map((file) => (
                  <li key={file}>
                    <a
                      href={`https://commons.wikimedia.org/wiki/${encodeURIComponent(file.replace(/ /g, "_"))}`}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="underline decoration-dotted underline-offset-2 transition-colors hover:text-white"
                    >
                      {file}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="mt-10">
          <SectionHeading
            eyebrow="LIST"
            title={ja ? "個別クレジットの画像" : "Individually credited images"}
          />

          {published.length === 0 ? (
            // 0件でも、それらしい一覧は作りません。
            // 確認の済んでいない画像を「掲載中」に見せないためです。
            <NoticeBox
              tone="cyan"
              className="mt-4"
              title={ja ? "現在、掲載中の Wikimedia 画像はありません" : "No images published yet"}
            >
              {ja
                ? "ライセンス・作者・出典を確認できた画像がまだ1件もないため、推測での掲載は行っていません。確認が済むまでのあいだ、各ページはサイト独自の装飾表現を表示します。"
                : "No image has completed licence, author and source verification yet, and we do not publish on assumption. Until then, pages show our own decorative visuals."}
            </NoticeBox>
          ) : (
            <ul className="mt-4 grid gap-3">
              {published.map((asset) => {
                const license = getLicense(asset.licenseCode);
                const localization = getLocalization(asset.id, locale);
                const usages = getPagesUsingAsset(asset.id);

                return (
                  <li key={asset.id}>
                    <GlassCard as="article" className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <ImageLicenseBadge code={asset.licenseCode} />
                        <span className="text-xs text-(--color-ink-dim)">
                          {labels.commercialUse}:{" "}
                          {license.commercialUseAllowed ? labels.allowed : labels.notAllowed}
                        </span>
                        <span className="text-xs text-(--color-ink-dim)">
                          {labels.derivativeWorks}:{" "}
                          {license.derivativeWorksAllowed ? labels.allowed : labels.notAllowed}
                        </span>
                        <span className="text-xs text-(--color-ink-dim)">
                          {labels.shareAlike}:{" "}
                          {license.shareAlikeRequired ? labels.required : labels.notRequired}
                        </span>
                      </div>

                      {/* ファイル名は識別子です。翻訳しません */}
                      <h2 className="mt-2 text-base font-semibold" translate="no">
                        {asset.fileName}
                      </h2>

                      {localization?.caption ? (
                        <p className="mt-1 text-sm text-(--color-ink-soft)">
                          {localization.caption}
                        </p>
                      ) : null}

                      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                        <CreditRow label={labels.author}>
                          {asset.authorName ? (
                            <ExternalText href={asset.authorUrl}>{asset.authorName}</ExternalText>
                          ) : (
                            labels.notProvided
                          )}
                        </CreditRow>

                        <CreditRow label={labels.source}>
                          <ExternalText href={asset.commonsPageUrl}>Wikimedia Commons</ExternalText>
                        </CreditRow>

                        <CreditRow label={labels.license}>
                          <ExternalText href={asset.licenseUrl ?? license.url}>
                            {license.name}
                          </ExternalText>
                          {asset.isModified ? ` ${labels.modified}` : ""}
                        </CreditRow>

                        {usages.length > 0 ? (
                          <CreditRow label={ja ? "使用ページ" : "Used on"}>
                            <span translate="no">
                              {usages.map((usage) => usage.pageKey).join(", ")}
                            </span>
                          </CreditRow>
                        ) : null}
                      </dl>
                    </GlassCard>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
    </Section>
  );
}

function CreditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-(--color-ink-dim)">{label}</dt>
      <dd className="m-0 text-(--color-ink-soft)">{children}</dd>
    </div>
  );
}

/**
 * 出典リンク。作者名・ライセンス名は原文のまま出すため `translate="no"` を付けます。
 * 外部リンクなので `nofollow` と `noopener` を付けます。
 */
function ExternalText({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <span translate="no">{children}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow noopener noreferrer"
      translate="no"
      className="underline decoration-dotted underline-offset-2 transition-colors hover:text-white"
    >
      {children}
    </a>
  );
}
