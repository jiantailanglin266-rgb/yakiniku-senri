import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { faqsFor } from "@/sports/data/content";

import { Breadcrumbs, FaqList, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, faqJsonLd } from "@/sports/lib/structured-data";

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
  const dict = getDictionary(info.code);
  return sportsMetadata({
    locale: info.code,
    path: "/betting",
    title: dict.navBetting,
    description:
      info.code === "ja"
        ? "スポーツベッティングに関する法令・年齢制限・地域制限・責任ある利用の解説です。事業者の紹介・勧誘は行いません。"
        : "An explainer on the legal, age and regional limits around sports betting. We do not promote or link to operators.",
    // 事業者一覧を持たない情報ページのため、検索面での取り扱いも情報ページとして扱われるようにします
  });
}

export default async function BettingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const faqs = faqsFor("betting");
  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navBetting, path: "/betting" },
  ];

  const criteria =
    locale === "ja"
      ? [
          [
            "運営ライセンス",
            "どの国・地域の規制当局が、どの番号で免許を出しているか。免許の実在をその当局のサイトで確認できるか。",
          ],
          [
            "対応地域",
            "自分の居住地域が利用可能地域に含まれているか。含まれていない場合、利用は認められません。",
          ],
          ["年齢制限", "18歳以上、地域によっては21歳以上。年齢確認の方法。"],
          ["本人確認", "出金時にどの書類が必要か。確認前に入金だけできる設計になっていないか。"],
          [
            "責任ある利用制度",
            "入金上限、利用時間の制限、自己排除（クーリングオフ）制度があるか。",
          ],
          ["入出金方法", "手数料、着金までの期間、出金拒否に関する規約。"],
          ["セキュリティ", "二段階認証、通信の暗号化、資金の分別管理。"],
          ["カスタマーサポート", "対応言語、対応時間、記録の残る問い合わせ手段。"],
        ]
      : [
          [
            "Licence",
            "Which regulator issued it, under what number, and can you verify it on the regulator's own site?",
          ],
          [
            "Permitted regions",
            "Whether your country of residence is on the permitted list. If not, you may not use the service.",
          ],
          ["Age limit", "18+, or 21+ in some regions, and how age is verified."],
          [
            "Identity checks",
            "What documents withdrawal requires — and whether deposits are possible before verification.",
          ],
          ["Responsible-play tools", "Deposit limits, session limits and self-exclusion."],
          ["Payments", "Fees, settlement times and the terms around refused withdrawals."],
          ["Security", "Two-factor authentication, encryption, segregation of customer funds."],
          ["Support", "Languages, hours, and whether there is a written record."],
        ];

  const responsible =
    locale === "ja"
      ? [
          "生活費や借入金を使わないこと",
          "損失を取り戻そうとしないこと",
          "利用時間と金額の上限をあらかじめ決めること",
          "感情が高ぶっているときは離れること",
          "未成年者を関与させないこと",
          "困ったときは公的な相談窓口に連絡すること",
        ]
      : [
          "Never use money you need for living costs, and never borrow to play",
          "Never chase losses",
          "Set time and money limits before you start",
          "Step away when you are emotional",
          "Keep minors away from it entirely",
          "Contact a public support service if it stops being a choice",
        ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-8">
        <p className="sp-eyebrow mb-2">BETTING INFORMATION</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.navBetting}</h1>
      </header>

      {/* 最初に置くべきは注意喚起。比較表より前に読ませます */}
      <div className="mb-10 space-y-3">
        <p className="border-live/50 bg-live/10 text-live rounded-xl border p-4 text-sm leading-relaxed">
          {dict.bettingDisclaimer}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="border-caution/40 bg-caution/10 text-caution rounded-xl border p-4 text-sm">
            {dict.ageWarning}
          </p>
          <p className="border-caution/40 bg-caution/10 text-caution rounded-xl border p-4 text-sm">
            {dict.regionWarning}
          </p>
        </div>
      </div>

      {/* 事業者を載せない理由を明示します。空欄の理由が分からないと不信になります */}
      <section aria-labelledby="bt-policy" className="mb-12">
        <SectionHeading
          id="bt-policy"
          eyebrow="OUR POSITION"
          title={
            locale === "ja"
              ? "このページに事業者一覧を掲載していない理由"
              : "Why there is no operator list here"
          }
        />
        <div className="sp-solid text-ink-soft space-y-3 p-5 text-sm leading-relaxed">
          {locale === "ja" ? (
            <>
              <p>
                日本国内から海外のベッティングサービスを利用する行為は、法令に抵触するおそれがあります。当サイトの主要な読者は日本国内の方であるため、事業者名・リンク・アフィリエイトリンクは掲載していません。
              </p>
              <p>
                また、掲載する場合であっても、免許番号・対応地域・出金条件を当サイトで検証できない事業者は載せません。検証していない比較表は、読者の判断を助けるどころか誤らせます。
              </p>
              <p>
                このページでは、代わりに「もし検討するなら、何をどう確認すべきか」だけを説明します。勝敗や利益に関する情報は扱いません。
              </p>
            </>
          ) : (
            <>
              <p>
                Using offshore betting services from Japan may breach local law, and most of our
                readers are in Japan. We therefore publish no operator names, links or affiliate
                links.
              </p>
              <p>
                Even where it is lawful, we will not list an operator whose licence number,
                permitted regions and withdrawal terms we cannot verify ourselves. An unverified
                comparison table misleads rather than helps.
              </p>
              <p>
                What follows is only how to check things for yourself. We publish nothing about
                outcomes or returns.
              </p>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="bt-criteria" className="mb-12">
        <SectionHeading
          id="bt-criteria"
          eyebrow="HOW TO CHECK"
          title={locale === "ja" ? "確認すべき項目" : "What to verify"}
          description={
            locale === "ja"
              ? "検討する場合は、少なくとも以下を自分で確認してください。"
              : "If you are considering it at all, verify at least these yourself."
          }
        />
        <dl className="sp-solid divide-edge divide-y">
          {criteria.map(([label, detail]) => (
            <div key={label} className="px-4 py-3">
              <dt className="text-ink text-sm font-semibold">{label}</dt>
              <dd className="text-ink-dim mt-1 text-xs leading-relaxed">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="bt-responsible" className="mb-12">
        <SectionHeading id="bt-responsible" eyebrow="RESPONSIBLE USE" title={dict.responsibleUse} />
        <ul className="sp-solid divide-edge divide-y">
          {responsible.map((item) => (
            <li key={item} className="text-ink-soft flex gap-3 px-4 py-3 text-sm">
              <span className="text-caution shrink-0" aria-hidden="true">
                !
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-ink-faint mt-4 text-xs leading-relaxed">
          {locale === "ja"
            ? "ギャンブル等依存症でお困りの方は、お住まいの自治体の相談窓口や、精神保健福祉センターにご相談ください。当サイトは相談機関ではありません。"
            : "If gambling has stopped being a choice, contact a public health or addiction support service in your area. We are not one."}
        </p>
      </section>

      <section aria-labelledby="bt-prediction" className="mb-12">
        <SectionHeading
          id="bt-prediction"
          eyebrow="PREDICTIONS"
          title={locale === "ja" ? "予測コンテンツについて" : "About prediction content"}
        />
        <p className="sp-solid text-ink-soft p-5 text-sm leading-relaxed">
          {dict.predictionDisclaimer}
        </p>
        <p className="text-ink-faint mt-3 text-xs">
          {locale === "ja"
            ? "当サイトのAI分析は過去データの集計です。「必ず勝てる」「高確率で儲かる」といった表現は、当サイトのどのページでも使用しません。"
            : 'Our analysis aggregates past data. We never write "guaranteed" or "high probability of profit" anywhere on this site.'}
        </p>
      </section>

      <section aria-labelledby="bt-links" className="mb-12">
        <SectionHeading
          id="bt-links"
          eyebrow="POLICIES"
          title={locale === "ja" ? "関連する掲載方針" : "Related policies"}
        />
        <div className="flex flex-wrap gap-2">
          {[
            { path: "/legal/betting-policy", label: dict.footerBettingPolicy },
            { path: "/legal/responsible-use", label: dict.footerResponsible },
            { path: "/legal/ad-policy", label: dict.footerAdPolicy },
            { path: "/legal/editorial-policy", label: dict.footerEditorial },
          ].map((item) => (
            <Link
              key={item.path}
              href={href(locale, item.path)}
              className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-4 py-2.5 text-sm transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="bt-faq">
        <SectionHeading id="bt-faq" eyebrow="FAQ" title={dict.sectionFaq} />
        <FaqList items={faqs} locale={locale} t={t} />
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
