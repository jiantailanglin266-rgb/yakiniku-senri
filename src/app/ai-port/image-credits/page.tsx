/**
 * 画像の出典とライセンス（AI PORT）。
 *
 * ============================================================
 * ⚠ このページはクレジットの「代わり」ではありません。
 *   ライセンスが求める作者表示は、画像のすぐ横に出すのが原則です
 *   （`WikimediaImage` が画像と同じ figure に描画します）。
 *   ここは、後からまとめて確認・検証するための台帳です。
 *
 * ⚠ 掲載可否の確認が済んでいない画像は、このページにも出しません。
 *   「一覧に出ている ＝ 確認が済んでいる」という関係を保つためです。
 * ============================================================
 */
import type { Metadata } from "next";

import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiPortName, aiPortPath } from "@/data/ai-port/site";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, aiPortFaqJsonLd } from "@/lib/ai-port/structured-data";
import { withBasePath } from "@/lib/base-path";
import { ImageLicenseBadge } from "@/media/components";
import { getLocalization, wikimediaAssets } from "@/media/data/assets";
import { siteAssetCredits, type SiteAssetCredit } from "@/media/data/site-assets";
import { getPagesUsingAsset } from "@/media/data/usages";
import { isPublishable } from "@/media/lib/eligibility";
import { getLicense } from "@/media/lib/license";
import { getReviewableLicenses } from "@/media/config/licenses";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "画像の出典とライセンス", path: "/image-credits" },
];

const FAQS = [
  {
    q: "このサイトの画像はどこから来ていますか？",
    a: "自作の図版・ロゴ、ライセンスを確認した外部素材、そして出所の記録が残っていない既存画像の3種類です。外部素材は作者・出典・ライセンスを、このページと画像のすぐ横の両方に表示しています。出所を確認できていないものは「出所未確認」と明記し、推測で「自作」とは書きません。",
  },
  {
    q: "Wikipedia に載っている画像をそのまま使っていますか？",
    a: "使っていません。Wikipedia の記事に表示されている画像には、フェアユースなど再利用できない条件のものが含まれます。Wikimedia Commons に登録され、パブリックドメイン・CC0・CC BY・CC BY-SA のいずれかであることを確認できた画像だけを対象にしています。",
  },
  {
    q: "ライセンスが判定できない画像はどう扱いますか？",
    a: "掲載しません。取得できたことと使ってよいことは別なので、判定できないものは保留のままにし、人が確認するまで画面には出しません。",
  },
  {
    q: "掲載内容に誤りがある場合はどうすればよいですか？",
    a: "お問い合わせよりご連絡ください。作者・ライセンスの表記に誤りがあった場合は、確認のうえ訂正または削除します。",
  },
];

export const metadata: Metadata = aiPortMetadata({
  title: "画像の出典とライセンス",
  description: `${aiPortName}で使用している画像の作者・出典・ライセンスの一覧です。パブリックドメイン・CC0・CC BY・CC BY-SA のみを対象とし、判定できない画像は掲載していません。`,
  path: "/image-credits",
});

const ORIGIN_LABEL: Record<SiteAssetCredit["origin"], string> = {
  "third-party": "外部素材",
  "first-party": "自作",
  unverified: "出所未確認",
};

export default function ImageCreditsPage() {
  // 掲載できる状態の画像だけを並べます
  const published = wikimediaAssets
    .filter(isPublishable)
    .sort((a, b) => a.fileName.localeCompare(b.fileName));

  return (
    <>
      <PageHero
        eyebrow="Image Credits"
        title="画像の出典と"
        highlight="ライセンス"
        description="このサイトで使用している画像の作者・出典・ライセンスの一覧です。パブリックドメイン・CC0・CC BY・CC BY-SA のみを対象とし、判定できない画像は掲載していません。"
        crumbs={CRUMBS}
      />

      <PageBody className="max-w-5xl">
        <section aria-labelledby="policy">
          <h2 id="policy" className="text-ai-white text-[1.2rem]">
            画像の扱い方
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "使うのは条件の軽いライセンスだけ",
                body: "パブリックドメイン・CC0・CC BY・CC BY-SA に限っています。CC BY-NC などの非商用限定、改変禁止、フェアユース、条件不明のものは対象外です。",
              },
              {
                title: "取得できたことと、使ってよいことを分ける",
                body: "APIで画像が取得できても、それは利用可能を意味しません。取得結果は原文のまま保存し、掲載可否は別の処理が判定します。",
              },
              {
                title: "クレジットは画像と一体で出す",
                body: "作者・出典・ライセンスが揃っていない画像は、表示コンポーネントが描画自体を拒否します。「画像だけ出す」状態を作れない設計です。",
              },
              {
                title: "ライセンスだけで完結させない",
                body: "人物・建築物・作品・商標が写っている画像は、ライセンスが自由でも別の権利が残ります。これらは自動掲載せず、人が確認します。",
              },
            ].map((item) => (
              <GlassCard key={item.title} className="p-5">
                <h3 className="text-ai-white text-[0.92rem]">{item.title}</h3>
                <p className="text-ai-haze mt-2 text-[0.82rem] leading-[1.95]">{item.body}</p>
              </GlassCard>
            ))}
          </div>

          <p className="text-ai-dim mt-5 text-[0.78rem] leading-[1.95]" translate="no">
            対象ライセンス：{getReviewableLicenses().join(" / ")}
          </p>
        </section>

        <section className="mt-14" aria-labelledby="commons">
          <h2 id="commons" className="text-ai-white text-[1.2rem]">
            Wikimedia Commons の画像
          </h2>

          {published.length === 0 ? (
            <p className="text-ai-haze ai-glass mt-6 rounded-xl px-5 py-8 text-[0.84rem] leading-[1.9]">
              {/*
                0件でも、それらしい一覧を作りません。
                確認の済んでいない画像を「掲載中」に見せないためです。
              */}
              現在、ライセンスを確認できた Wikimedia Commons
              の画像はありません。確認が済むまで、各ページは画像を使わない装飾表現で表示しています。
            </p>
          ) : (
            <ul className="mt-6 grid gap-3">
              {published.map((asset) => {
                const license = getLicense(asset.licenseCode);
                const localization = getLocalization(asset.id, "ja");
                const usages = getPagesUsingAsset(asset.id);

                return (
                  <li key={asset.id}>
                    <GlassCard className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <ImageLicenseBadge code={asset.licenseCode} />
                        <span className="text-ai-dim text-[0.7rem]">
                          商用利用：{license.commercialUseAllowed ? "可" : "不可"}
                        </span>
                        <span className="text-ai-dim text-[0.7rem]">
                          改変：{license.derivativeWorksAllowed ? "可" : "不可"}
                        </span>
                        <span className="text-ai-dim text-[0.7rem]">
                          継承：{license.shareAlikeRequired ? "必要" : "不要"}
                        </span>
                      </div>

                      {/* ファイル名は識別子です。翻訳しません */}
                      <h3 className="text-ai-white mt-2.5 text-[0.9rem]" translate="no">
                        {asset.fileName}
                      </h3>

                      {localization?.caption ? (
                        <p className="text-ai-mist mt-1.5 text-[0.8rem] leading-[1.9]">
                          {localization.caption}
                        </p>
                      ) : null}

                      <dl className="text-ai-haze mt-3 grid gap-1 text-[0.78rem] leading-[1.85]">
                        <Row
                          label="作者"
                          value={asset.authorName ?? "記載なし"}
                          href={asset.authorUrl}
                          raw={Boolean(asset.authorName)}
                        />
                        <Row
                          label="出典"
                          value="Wikimedia Commons"
                          href={asset.commonsPageUrl}
                          raw
                        />
                        <Row
                          label="ライセンス"
                          value={`${license.name}${asset.isModified ? "（改変あり）" : ""}`}
                          href={asset.licenseUrl}
                          raw
                        />
                        {usages.length > 0 ? (
                          <Row
                            label="使用ページ"
                            value={usages.map((usage) => usage.pageKey).join("、")}
                            raw
                          />
                        ) : null}
                      </dl>
                    </GlassCard>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-14" aria-labelledby="site-assets">
          <h2 id="site-assets" className="text-ai-white text-[1.2rem]">
            Wikimedia 以外の素材
          </h2>
          <p className="text-ai-haze mt-3 text-[0.85rem] leading-[1.95]">
            自作の素材と、他者の素材をライセンスに従って使っているものです。出所の記録が無いものは
            「出所未確認」として、確認できていないことをそのまま書いています。
          </p>

          <ul className="mt-6 grid gap-3">
            {siteAssetCredits.map((credit) => (
              <li key={credit.id}>
                <GlassCard className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      translate="no"
                      className={`font-ai-mono inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[0.58rem] tracking-[0.1em] ${
                        credit.origin === "third-party"
                          ? "text-ai-sky border-sky-400/35 bg-sky-400/10"
                          : credit.origin === "unverified"
                            ? "text-ai-amber border-amber-400/35 bg-amber-400/10"
                            : "text-ai-mint border-emerald-400/35 bg-emerald-400/10"
                      }`}
                    >
                      {credit.licenseCode}
                    </span>
                    <span className="text-ai-dim font-ai-mono text-[0.58rem] tracking-[0.1em]">
                      {ORIGIN_LABEL[credit.origin]}
                    </span>
                  </div>

                  <h3 className="text-ai-white mt-2.5 text-[0.95rem]">{credit.label}</h3>

                  <dl className="text-ai-haze mt-2.5 grid gap-1 text-[0.78rem] leading-[1.85]">
                    <Row label="点数" value={`${credit.fileCount} 点`} />
                    <Row
                      label="作者"
                      value={credit.authorName ?? "未確認"}
                      href={credit.authorUrl}
                      raw={Boolean(credit.authorName)}
                    />
                    <Row
                      label="出典"
                      value={credit.sourceName ?? "未確認"}
                      href={credit.sourceUrl}
                      raw={Boolean(credit.sourceName)}
                    />
                    <Row
                      label="ライセンス"
                      value={credit.licenseName}
                      href={credit.licenseUrl}
                      raw
                    />
                    {credit.licenseTextPath ? (
                      <Row
                        label="ライセンス全文"
                        value="サイト内に全文を掲載しています"
                        href={withBasePath(credit.licenseTextPath)}
                      />
                    ) : null}
                    {credit.isModified && credit.modificationDescription ? (
                      <Row label="改変" value={credit.modificationDescription} />
                    ) : null}
                    <Row label="使用箇所" value={credit.usedOn.join("、")} />
                    <Row label="確認日" value={credit.verifiedAt ?? "未確認"} />
                  </dl>

                  <p className="text-ai-dim mt-2.5 text-[0.75rem] leading-[1.85]">
                    {credit.verificationNote}
                  </p>
                </GlassCard>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14" aria-labelledby="faq">
          <h2 id="faq" className="text-ai-white text-[1.2rem]">
            よくある質問
          </h2>
          <dl className="mt-6 grid gap-5">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="text-ai-white text-[0.92rem] leading-[1.7]">{faq.q}</dt>
                <dd className="text-ai-haze mt-2 text-[0.85rem] leading-[1.95]">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-ai-dim mt-12 text-[0.78rem] leading-[1.95]">
          このサイトは Wikimedia Foundation および Wikipedia とは無関係であり、
          両者の公認を受けているものではありません。
        </p>

        <RelatedLinks
          items={[
            { href: aiPortPath("/about"), label: "運営者情報・編集方針" },
            { href: aiPortPath("/disclosure"), label: "広告掲載について" },
            { href: aiPortPath("/guides/ai-image-rights"), label: "AI生成画像の権利の考え方" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(CRUMBS), aiPortFaqJsonLd(FAQS)]} />
    </>
  );
}

function Row({
  label,
  value,
  href,
  raw = false,
}: {
  label: string;
  value: string;
  href?: string | null;
  /** 原文を保持する項目（翻訳させない） */
  raw?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <dt className="text-ai-dim w-[7rem] shrink-0">{label}</dt>
      <dd className="text-ai-mist m-0 min-w-0 break-all" translate={raw ? "no" : undefined}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="hover:text-ai-cyan underline decoration-dotted underline-offset-2 transition-colors"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
