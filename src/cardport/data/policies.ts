/**
 * 固定ページ（運営者情報・編集方針・各種ポリシー）。
 *
 * 金融メディアとして必要な開示をまとめています。
 * 運営会社が未確定の項目は、埋めずに「未設定」と表示します（推測を書かないため）。
 */
import type { PolicyPage } from "./types";

const UPDATED = "2026-07-20";

export const policyPages: PolicyPage[] = [
  {
    id: "about",
    slug: "about",
    title: { ja: "運営者情報", en: "About us" },
    lead: {
      ja: "このサイトを誰が運営し、どう収益を得ているかを開示します。",
      en: "Who runs this site and how it earns money.",
    },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "運営体制", en: "Who we are" },
        body: {
          ja: [
            "運営会社の情報は、環境変数（NEXT_PUBLIC_CARDPORT_COMPANY ほか）で設定します。未設定の項目は空欄のまま表示され、推測値は入れません。",
            "記事は編集部が執筆し、金融関連の記述は監修者が確認しています。執筆者・監修者は各ページに表示しています。",
          ],
          en: [
            "Operator details are configured via environment variables. Unset fields stay blank — we do not fill them with guesses.",
            "Articles are written by the editorial team and financial content is checked by a supervisor. Both are credited on each page.",
          ],
        },
      },
      {
        heading: { ja: "収益源", en: "How we earn" },
        body: {
          ja: [
            "カード会社・サービス提供会社のアフィリエイトプログラムによる成果報酬",
            "広告掲載およびスポンサー記事（該当箇所には必ず表示します）",
            "収益はサイトの運営・情報更新の費用に充てています",
          ],
          en: [
            "Affiliate commissions from card issuers and service providers",
            "Display advertising and sponsored articles, always labelled as such",
            "Revenue funds running the site and keeping the data current",
          ],
        },
      },
    ],
  },
  {
    id: "editorial-policy",
    slug: "editorial-policy",
    title: { ja: "編集方針", en: "Editorial policy" },
    lead: { ja: "何を書き、何を書かないかの基準です。", en: "What we will and will not publish." },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "書くこと", en: "What we publish" },
        body: {
          ja: [
            "カード会社の公式発表・利用規約で確認できた内容",
            "確認した日付（情報確認日）",
            "デメリットと注意点。メリットだけを書くことはしません",
            "計算の根拠。還元額を示すときは、必ず計算式と前提を併記します",
          ],
          en: [
            "Content we could verify in issuers' announcements and terms",
            "The date we verified it",
            "Drawbacks and caveats — we never publish upsides alone",
            "The arithmetic: any reward figure comes with its formula and assumptions",
          ],
        },
      },
      {
        heading: { ja: "書かないこと", en: "What we do not publish" },
        body: {
          ja: [
            "確認できていない数値・条件（推測値を入れるくらいなら空欄にします）",
            "審査に必ず通る、誰でも発行できる、といった表現",
            "利用条件を隠したキャンペーン表示",
            "実データのない口コミ評価・受賞歴・メディア掲載実績",
            "収入や信用情報を偽る方法、多重申込みを促す内容",
          ],
          en: [
            "Figures or conditions we could not verify — we leave a blank rather than guess",
            "Claims that approval is guaranteed or that anyone can be issued a card",
            "Campaign headlines that hide the conditions",
            "Ratings, awards or press mentions with no underlying data",
            "Anything explaining how to misstate income or encouraging mass applications",
          ],
        },
      },
      {
        heading: { ja: "訂正", en: "Corrections" },
        body: {
          ja: [
            "誤りが判明した場合は、該当箇所を修正し、更新日を改めます。",
            "内容に影響する修正の場合は、記事内に訂正の旨を明記します。",
            "修正のご依頼は「情報修正依頼」のページから承ります。",
          ],
          en: [
            "When we find an error we correct it and update the modification date.",
            "If the correction changes the substance, we say so in the article.",
            "You can request a correction from our correction request page.",
          ],
        },
      },
    ],
  },
  {
    id: "ranking-criteria",
    slug: "ranking-criteria",
    title: { ja: "ランキング評価基準", en: "Ranking criteria" },
    lead: { ja: "順位の計算方法を全文公開します。", en: "The full method behind our rankings." },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "評価軸", en: "Scoring axes" },
        body: {
          ja: [
            "還元率：基本還元率と、条件付きで到達できる最大還元率の両方を見ます。到達条件が厳しいほど加点を抑えます。",
            "年会費の負担：年会費の金額と、無料条件の達成しやすさを見ます。",
            "特典・優待：ラウンジ・優待・付帯サービスの範囲を見ます。",
            "保険・補償：補償額と、自動付帯か利用付帯かを見ます。",
            "使いやすさ：発行スピード、対応する決済手段、アプリの機能を見ます。",
            "発行会社の信頼性：事業基盤と情報開示の明確さを見ます。",
          ],
          en: [
            "Reward rate: both the base rate and the achievable maximum, discounted when conditions are hard to meet.",
            "Cost of holding: the fee itself and how attainable any waiver is.",
            "Benefits: the breadth of lounges, perks and services.",
            "Insurance: cover amounts, and whether cover is automatic or usage-based.",
            "Ease of use: issuing speed, supported payment methods and app capability.",
            "Issuer trust: operating base and clarity of disclosure.",
          ],
        },
      },
      {
        heading: { ja: "重みづけ", en: "Weighting" },
        body: {
          ja: [
            "カテゴリごとに重みを変えます。たとえば「年会費無料」カテゴリでは年会費の重みを最大にし、「旅行」カテゴリでは保険の重みを最大にします。",
            "各カテゴリの重みは、そのカテゴリのランキングページに表示しています。",
            "同点の場合は、年会費が安い順、次にスラッグ順で決めます。毎回同じ順序になるようにするためです。",
          ],
          en: [
            "Weights change per category — the no-fee category weights cost highest, the travel category weights insurance highest.",
            "Each category's weights are shown on that category's ranking page.",
            "Ties break by lower annual fee, then by slug, so the order is reproducible.",
          ],
        },
      },
      {
        heading: { ja: "広告との関係", en: "Relationship to advertising" },
        body: {
          ja: [
            "報酬額・提携の有無は、順位の計算に一切使用していません。",
            "順位算出のコード（scoring.ts）は、アフィリエイト管理のコード（affiliate.ts）を参照しない構造にしています。",
            "広告リンクを含む箇所には「PR」を表示します。",
          ],
          en: [
            "Commission and partnership status are never inputs to the ranking.",
            "Our ranking code does not import our affiliate code — the separation is enforced in the codebase.",
            "Anywhere containing an advertising link is labelled 'AD'.",
          ],
        },
      },
    ],
  },
  {
    id: "advertising-policy",
    slug: "advertising-policy",
    title: { ja: "広告掲載ポリシー", en: "Advertising policy" },
    lead: {
      ja: "広告と編集内容の区別について。",
      en: "How we separate advertising from editorial.",
    },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "表示のルール", en: "Labelling rules" },
        body: {
          ja: [
            '広告リンクには「PR」ラベルを付け、rel="sponsored nofollow" を設定します。',
            "スポンサー記事には、記事冒頭に広告である旨を表示します。",
            "提携していないカードの公式サイトへのリンクは広告ではないため、PRラベルを付けません。",
          ],
          en: [
            "Advertising links carry an 'AD' label and use rel=\"sponsored nofollow\".",
            "Sponsored articles say so at the top of the article.",
            "Links to official sites of cards we do not partner with are not advertising and are not labelled.",
          ],
        },
      },
      {
        heading: { ja: "受け付けない広告", en: "Advertising we decline" },
        body: {
          ja: [
            "審査の通過を保証すると読める表現を含むもの",
            "利用条件・手数料を明示しないもの",
            "返済能力を超える利用を促すもの",
            "第三者の商標を無断で使用しているもの",
          ],
          en: [
            "Anything implying approval is guaranteed",
            "Anything that hides conditions or fees",
            "Anything encouraging borrowing beyond means",
            "Anything using third-party trademarks without permission",
          ],
        },
      },
    ],
  },
  {
    id: "affiliate-policy",
    slug: "affiliate-policy",
    title: { ja: "アフィリエイトポリシー", en: "Affiliate policy" },
    lead: {
      ja: "成果報酬を受け取る仕組みと、その影響範囲について。",
      en: "How commissions work here and what they do not affect.",
    },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "仕組み", en: "How it works" },
        body: {
          ja: [
            "当サイトのリンク経由で申込みが成立した場合、カード会社・サービス提供会社から報酬を受け取ることがあります。",
            "報酬の有無・金額は、掲載順位、評価点、記事の内容に影響しません。",
            "利用者が負担する費用が増えることはありません。",
          ],
          en: [
            "We may receive a commission when an application completes via our links.",
            "Whether or how much we earn does not affect placement, scores or article content.",
            "Nothing about it increases what you pay.",
          ],
        },
      },
    ],
  },
  {
    id: "financial-policy",
    slug: "financial-policy",
    title: { ja: "金融情報掲載方針", en: "Financial content policy" },
    lead: {
      ja: "金融サービスを扱ううえでの前提です。",
      en: "The ground rules for covering financial services.",
    },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "助言ではありません", en: "This is not advice" },
        body: {
          ja: [
            "当サイトの掲載内容は情報提供を目的としたもので、金融商品の勧誘や投資助言ではありません。",
            "税務・法務の判断は、税理士・弁護士など有資格の専門家にご相談ください。",
            "診断・シミュレーターの結果は、入力条件と掲載データにもとづく機械的な計算結果です。",
          ],
          en: [
            "Everything here is for information. It is not a solicitation or investment advice.",
            "For tax and legal decisions, consult a qualified professional.",
            "Finder and simulator results are mechanical calculations from your inputs and our published data.",
          ],
        },
      },
      {
        heading: { ja: "審査について", en: "On credit assessments" },
        body: {
          ja: [
            "カードの審査基準はカード会社が公開しておらず、当サイトも把握していません。",
            "審査の通過・発行・利用限度額を保証する情報は一切掲載しません。",
            "収入や信用情報を偽る方法は案内しません。",
          ],
          en: [
            "Issuers do not publish their criteria and we do not know them.",
            "We never publish anything that guarantees approval, issuance or a credit limit.",
            "We do not explain how to misstate income or credit information.",
          ],
        },
      },
      {
        heading: { ja: "暗号資産について", en: "On crypto assets" },
        body: {
          ja: [
            "暗号資産は価格変動が大きく、元本が保証されません。",
            "サービスの停止・地域制限・詐欺のリスクがあります。",
            "暗号資産関連の掲載は、決済手段としての比較にとどめ、投資を勧める文脈では扱いません。",
          ],
          en: [
            "Crypto assets are volatile and not principal-protected.",
            "Suspension, geo-restriction and fraud are real risks.",
            "We cover crypto only as a payment rail, never as an investment recommendation.",
          ],
        },
      },
    ],
  },
  {
    id: "disclaimer",
    slug: "disclaimer",
    title: { ja: "免責事項", en: "Disclaimer" },
    lead: {
      ja: "掲載情報の正確性と、利用にあたっての責任について。",
      en: "On accuracy and your use of this site.",
    },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "掲載情報", en: "Published information" },
        body: {
          ja: [
            "掲載内容は情報確認日時点のものです。年会費・還元率・特典・保険・キャンペーンは変更されることがあります。",
            "申込み前に、必ず各カード会社・サービス提供会社の公式サイトで最新の条件をご確認ください。",
            "掲載情報の利用により生じた損害について、当サイトは責任を負いかねます。",
          ],
          en: [
            "Content reflects the date we verified it. Fees, rates, benefits, insurance and campaigns change.",
            "Always confirm current terms on the issuer's or provider's official site before applying.",
            "We cannot accept liability for losses arising from use of the information here.",
          ],
        },
      },
      {
        heading: { ja: "外部サイト", en: "External sites" },
        body: {
          ja: [
            "外部サイトの内容について、当サイトは責任を負いません。",
            "外部サイトの利用は、各サイトの規約に従ってください。",
          ],
          en: [
            "We are not responsible for the content of external sites.",
            "Use of external sites is governed by their own terms.",
          ],
        },
      },
    ],
  },
  {
    id: "privacy",
    slug: "privacy",
    title: { ja: "プライバシーポリシー", en: "Privacy policy" },
    lead: {
      ja: "取得する情報と、取得しない情報について。",
      en: "What we collect — and what we deliberately do not.",
    },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "取得しない情報", en: "What we never collect" },
        body: {
          ja: [
            "カード番号・有効期限・セキュリティコード",
            "暗証番号",
            "本人確認書類の画像および記載内容",
            "診断・シミュレーターでは、氏名・住所・電話番号・年収の具体額を尋ねません",
          ],
          en: [
            "Card numbers, expiry dates and security codes",
            "PINs",
            "Images or contents of identity documents",
            "Our finder and simulators never ask for your name, address, phone number or exact income",
          ],
        },
      },
      {
        heading: { ja: "取得する情報", en: "What we do collect" },
        body: {
          ja: [
            "アクセス解析のための閲覧情報（ページ、参照元、言語、おおまかな地域）",
            "診断・シミュレーターの入力値は、原則としてブラウザ内で処理し、サーバーへ送信しません",
            "メールマガジンにご登録いただいた場合のメールアドレス",
          ],
          en: [
            "Analytics data about page views, referrers, language and approximate region",
            "Finder and simulator inputs are processed in your browser and are not sent to our servers",
            "Your email address, if you subscribe to our newsletter",
          ],
        },
      },
    ],
  },
  {
    id: "terms",
    slug: "terms",
    title: { ja: "利用規約", en: "Terms of use" },
    lead: { ja: "本サイトのご利用条件です。", en: "The conditions for using this site." },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "禁止事項", en: "Prohibited use" },
        body: {
          ja: [
            "掲載内容の無断転載・改変",
            "自動化された手段による過度なアクセス",
            "他の利用者・第三者への迷惑行為",
          ],
          en: [
            "Reproducing or altering our content without permission",
            "Excessive automated access",
            "Behaviour that harms other users or third parties",
          ],
        },
      },
    ],
  },
  {
    id: "cookie",
    slug: "cookie",
    title: { ja: "Cookieポリシー", en: "Cookie policy" },
    lead: {
      ja: "Cookie とローカルストレージの利用について。",
      en: "How we use cookies and local storage.",
    },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "利用目的", en: "Purposes" },
        body: {
          ja: [
            "表示言語の記憶",
            "比較リストに追加したカードの記憶（ブラウザ内のみ）",
            "アクセス解析",
          ],
          en: [
            "Remembering your display language",
            "Remembering the cards you added to the comparison list (browser only)",
            "Analytics",
          ],
        },
      },
      {
        heading: { ja: "無効化", en: "Opting out" },
        body: {
          ja: [
            "ブラウザの設定で Cookie を無効にできます。無効にした場合、比較リストや言語設定が保持されません。",
          ],
          en: [
            "You can disable cookies in your browser. If you do, the comparison list and language preference will not persist.",
          ],
        },
      },
    ],
  },
  {
    id: "copyright",
    slug: "copyright",
    title: { ja: "著作権ポリシー", en: "Copyright policy" },
    lead: {
      ja: "掲載物の権利と、第三者の権利の取扱いについて。",
      en: "Rights in our content and respect for third-party rights.",
    },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "第三者の権利", en: "Third-party rights" },
        body: {
          ja: [
            "実在するカードの商標・ロゴ・券面デザインは、権利者の許諾なく複製しません。",
            "現在掲載しているカード名・券面はすべて架空のプレースホルダーです。",
            "権利侵害のご指摘は、情報修正依頼のページからご連絡ください。",
          ],
          en: [
            "We do not reproduce real card trademarks, logos or artwork without permission.",
            "All card names and artwork currently shown are fictional placeholders.",
            "Report any infringement through our correction request page.",
          ],
        },
      },
    ],
  },
  {
    id: "correction",
    slug: "correction",
    title: { ja: "情報修正依頼", en: "Request a correction" },
    lead: { ja: "誤りを見つけた場合のご連絡方法です。", en: "How to tell us about an error." },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "ご連絡いただきたい内容", en: "What to include" },
        body: {
          ja: ["該当ページのURL", "誤っている箇所", "正しい情報の出典（公式サイトのURLなど）"],
          en: [
            "The URL of the page",
            "Which part is wrong",
            "A source for the correct information, such as an official page",
          ],
        },
      },
      {
        heading: { ja: "対応", en: "What happens next" },
        body: {
          ja: [
            "内容を確認し、修正が必要な場合は該当箇所を修正して更新日を改めます。",
            "カード会社・サービス提供会社からのご指摘も同じ手順で対応します。",
          ],
          en: [
            "We check the report and, where a correction is needed, fix the page and update its modification date.",
            "Reports from issuers and providers follow the same process.",
          ],
        },
      },
    ],
  },
  {
    id: "contact",
    slug: "contact",
    title: { ja: "お問い合わせ", en: "Contact" },
    lead: {
      ja: "掲載・取材・提携に関するお問い合わせ先です。",
      en: "For listings, press and partnership enquiries.",
    },
    updatedOn: UPDATED,
    sections: [
      {
        heading: { ja: "お受けできないご相談", en: "What we cannot help with" },
        body: {
          ja: [
            "個別の審査結果に関するお問い合わせ（当サイトでは審査に関与していません）",
            "税務・法務の個別相談",
            "カードの紛失・不正利用のご連絡（各カード会社の窓口へご連絡ください）",
          ],
          en: [
            "Questions about a specific application outcome — we have no part in assessments",
            "Individual tax or legal advice",
            "Lost cards or fraud — contact your issuer directly",
          ],
        },
      },
    ],
  },
];

const policyMap = new Map(policyPages.map((page) => [page.slug, page]));

export function getPolicy(slug: string) {
  return policyMap.get(slug);
}
