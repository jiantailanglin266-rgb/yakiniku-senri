/**
 * 固定ページ（サイトポリシー）。
 *
 * ⚠ 事業者名・住所・連絡先などは、確定するまで空にしています。
 *   埋めるべき箇所は `[[...]]` で示しています。
 *   未確認の情報を仮に入れると、そのまま公開されてしまうためです。
 */

import type { LocalizedList, LocalizedText } from "@/portal/lib/types";

export type LegalPage = {
  slug: string;
  title: LocalizedText;
  lead: LocalizedText;
  sections: { heading: LocalizedText; body: LocalizedList }[];
};

/** 未確定の情報を示すプレースホルダ */
const TBD = "[[ 確定後に記入 / to be filled in ]]";

export const legalPages: LegalPage[] = [
  {
    slug: "about",
    title: { ja: "運営者情報", en: "About us" },
    lead: {
      ja: "当サイトの運営体制と、情報の作り方をご案内します。",
      en: "Who runs this site and how the information is produced.",
    },
    sections: [
      {
        heading: { ja: "運営者", en: "Operator" },
        body: {
          ja: [`運営者名: ${TBD}`, `所在地: ${TBD}`, `連絡先: ${TBD}`],
          en: [`Operator: ${TBD}`, `Address: ${TBD}`, `Contact: ${TBD}`],
        },
      },
      {
        heading: { ja: "サイトの目的", en: "What this site is for" },
        body: {
          ja: [
            "仮想通貨（暗号資産）とWeb3.0に関する情報を、初心者から上級者までが判断材料として使える形で整理して提供することを目的としています。",
            "特定の銘柄やサービスの購入を勧誘するものではありません。",
          ],
          en: [
            "We organise information about crypto assets and Web3 so that readers, from beginners upwards, can use it to make their own decisions.",
            "Nothing here is a solicitation to buy any particular asset or service.",
          ],
        },
      },
      {
        heading: { ja: "資格・登録について", en: "Licences and registration" },
        body: {
          ja: [
            "当サイトは情報提供を行うメディアであり、暗号資産交換業者ではありません。金融商品取引業の登録も受けていません。",
            "したがって、個別の投資助言や運用の代行は行いません。",
          ],
          en: [
            "This site is an information publisher. It is not a crypto-asset exchange provider and is not registered as a financial instruments business.",
            "We therefore do not provide individual investment advice or manage assets on anyone's behalf.",
          ],
        },
      },
    ],
  },
  {
    slug: "editorial-policy",
    title: { ja: "編集方針", en: "Editorial policy" },
    lead: {
      ja: "どのように情報を集め、確認し、修正するかを定めています。",
      en: "How we gather, verify and correct information.",
    },
    sections: [
      {
        heading: { ja: "一次情報を優先します", en: "Primary sources first" },
        body: {
          ja: [
            "手数料・取扱銘柄・キャンペーン条件などは、事業者の公式発表を一次情報として確認します。",
            "確認できていない数値は掲載せず、「公式サイトで要確認」と表示します。推測値を入れることはしません。",
          ],
          en: [
            "Fees, listings and campaign terms are verified against the operator's own announcements.",
            "Figures we have not verified are not published; they show as “check official site”. We never fill gaps with estimates.",
          ],
        },
      },
      {
        heading: { ja: "変動する情報の扱い", en: "Information that changes" },
        body: {
          ja: [
            "価格・時価総額・出来高は外部APIから取得し、取得日時と更新間隔を必ず画面に表示します。",
            "「リアルタイム」という表現だけで済ませず、実際の更新頻度を明示します。",
          ],
          en: [
            "Prices, market caps and volumes come from external APIs, and every screen shows when they were fetched and how often they refresh.",
            "We state the actual refresh interval rather than simply claiming “real time”.",
          ],
        },
      },
      {
        heading: { ja: "使わない表現", en: "Language we do not use" },
        body: {
          ja: [
            "「絶対に儲かる」「必ず上がる」「元本保証」といった、誤認を招く表現は使用しません。",
            "特定銘柄の購入を断定的に勧めることもしません。",
          ],
          en: [
            "We do not use misleading phrases such as “guaranteed profit”, “sure to rise” or “capital protected”.",
            "We do not tell readers to buy any particular asset.",
          ],
        },
      },
      {
        heading: { ja: "修正について", en: "Corrections" },
        body: {
          ja: [
            "誤りが判明した場合は、速やかに修正し、修正日を記載します。重大な誤りは修正内容も明記します。",
            "修正のご依頼は「コンテンツ修正依頼」からお願いします。",
          ],
          en: [
            "When we find an error we correct it promptly and publish the date of the correction. For significant errors we describe what changed.",
            "Please use the correction request page to report one.",
          ],
        },
      },
    ],
  },
  {
    slug: "advertising-policy",
    title: { ja: "広告掲載ポリシー", en: "Advertising policy" },
    lead: {
      ja: "広告と編集コンテンツの境界について定めています。",
      en: "How we separate advertising from editorial content.",
    },
    sections: [
      {
        heading: { ja: "広告の明示", en: "Disclosure" },
        body: {
          ja: [
            '報酬が発生するリンクには「PR」と表示し、HTMLでは rel="sponsored nofollow" を付与します。',
            "スポンサー記事には、記事上部にスポンサー名を明示します。",
          ],
          en: [
            'Links that earn us a commission are labelled “Sponsored” and carry rel="sponsored nofollow".',
            "Sponsored articles name the sponsor at the top of the article.",
          ],
        },
      },
      {
        heading: { ja: "掲載順位", en: "Rankings" },
        body: {
          ja: [
            "比較表やランキングの順位は、報酬額のみで決定しません。評価基準（手数料・取扱銘柄・セキュリティ・使いやすさ）と、その内訳を各ページに表示します。",
          ],
          en: [
            "Commission alone never determines a ranking. We publish our criteria — fees, listings, security, usability — and the score breakdown on each page.",
          ],
        },
      },
      {
        heading: { ja: "掲載しないもの", en: "What we will not carry" },
        body: {
          ja: [
            "元本保証や高利回りを断定的にうたうサービス、実体の確認できないプロジェクト、秘密鍵やシードフレーズの入力を求めるサービスは掲載しません。",
          ],
          en: [
            "We do not carry services promising guaranteed capital or returns, projects we cannot verify, or anything that asks users for a private key or seed phrase.",
          ],
        },
      },
    ],
  },
  {
    slug: "affiliate-policy",
    title: { ja: "アフィリエイトポリシー", en: "Affiliate policy" },
    lead: {
      ja: "アフィリエイトプログラムの利用について説明します。",
      en: "How we use affiliate programmes.",
    },
    sections: [
      {
        heading: { ja: "アフィリエイトの利用", en: "Our use of affiliate links" },
        body: {
          ja: [
            "当サイトは、一部のリンクにアフィリエイトプログラムを利用しています。リンク経由で口座開設やサービス利用があった場合、当サイトに報酬が発生することがあります。",
            "利用者に追加の費用が発生することはありません。",
          ],
          en: [
            "Some links on this site are affiliate links. If you open an account or use a service through one, we may receive a commission.",
            "This never costs you anything extra.",
          ],
        },
      },
      {
        heading: { ja: "評価への影響", en: "Effect on our assessments" },
        body: {
          ja: [
            "報酬の有無が評価や掲載順位を左右しないよう、評価基準を事前に定め、内訳を公開しています。",
            "アフィリエイトプログラムのないサービスも、条件を満たせば掲載します。",
          ],
          en: [
            "We fix our criteria in advance and publish the breakdown so commission cannot drive assessments or rankings.",
            "Services without an affiliate programme are listed too if they meet our criteria.",
          ],
        },
      },
    ],
  },
  {
    slug: "disclaimer",
    title: { ja: "免責事項", en: "Disclaimer" },
    lead: {
      ja: "当サイトの情報をご利用いただくうえでの前提です。",
      en: "The basis on which this site's information is provided.",
    },
    sections: [
      {
        heading: { ja: "投資判断について", en: "Investment decisions" },
        body: {
          ja: [
            "当サイトの情報は情報提供のみを目的としており、投資勧誘を目的としたものではありません。",
            "仮想通貨（暗号資産）は価格変動が大きく、購入価格を下回って損失が生じるおそれがあります。投資の最終判断はご自身の責任でお願いします。",
          ],
          en: [
            "Everything here is for information only and is not a solicitation to invest.",
            "Crypto assets are highly volatile and you may lose money. Any decision to invest is yours alone.",
          ],
        },
      },
      {
        heading: { ja: "情報の正確性", en: "Accuracy" },
        body: {
          ja: [
            "掲載内容には正確を期していますが、その完全性・最新性を保証するものではありません。特に手数料・取扱銘柄・キャンペーンは変更されることがあります。",
            "ご利用の前に、必ず各サービスの公式サイトで最新の情報をご確認ください。",
          ],
          en: [
            "We aim for accuracy but cannot guarantee that everything is complete or current. Fees, listings and campaigns change.",
            "Always confirm the current terms on the service's own site before using it.",
          ],
        },
      },
      {
        heading: { ja: "外部リンク", en: "External links" },
        body: {
          ja: [
            "外部サイトの内容について、当サイトは責任を負いません。リンク先での取引・契約は、利用者と当該事業者の間で行われます。",
          ],
          en: [
            "We are not responsible for the content of external sites. Any transaction or contract there is between you and that operator.",
          ],
        },
      },
      {
        heading: { ja: "税務・法務", en: "Tax and legal" },
        body: {
          ja: [
            "税金に関する記載は一般的な整理であり、個別の税務相談ではありません。具体的な判断は税理士または所轄の税務署にご確認ください。",
          ],
          en: [
            "Anything we write about tax is a general orientation, not advice on your situation. Consult a tax professional or the tax office.",
          ],
        },
      },
    ],
  },
  {
    slug: "privacy",
    title: { ja: "プライバシーポリシー", en: "Privacy policy" },
    lead: { ja: "個人情報の取り扱いについて。", en: "How we handle personal data." },
    sections: [
      {
        heading: { ja: "取得する情報", en: "What we collect" },
        body: {
          ja: [
            "アクセス解析のために、ページ閲覧履歴・端末情報・参照元などを取得することがあります。",
            "メールマガジンにご登録いただいた場合、メールアドレスを取得します。",
          ],
          en: [
            "For analytics we may collect page views, device information and referrers.",
            "If you subscribe to the newsletter we collect your email address.",
          ],
        },
      },
      {
        heading: { ja: "利用目的", en: "How we use it" },
        body: {
          ja: [
            "サイトの改善、コンテンツの最適化、メールマガジンの配信のために利用します。",
            "ご本人の同意なく第三者へ提供することはありません（法令にもとづく場合を除きます）。",
          ],
          en: [
            "To improve the site, tune the content and send the newsletter.",
            "We do not pass it to third parties without your consent, except where the law requires it.",
          ],
        },
      },
      {
        heading: { ja: "秘密鍵について", en: "About private keys" },
        body: {
          ja: [
            "当サイトは、秘密鍵・シードフレーズ・取引所のパスワードを一切取得しません。入力を求める画面も存在しません。",
          ],
          en: [
            "We never collect private keys, seed phrases or exchange passwords, and no screen on this site asks for them.",
          ],
        },
      },
      {
        heading: { ja: "お問い合わせ窓口", en: "Contact" },
        body: {
          ja: [`個人情報に関するお問い合わせ先: ${TBD}`],
          en: [`Data protection contact: ${TBD}`],
        },
      },
    ],
  },
  {
    slug: "terms",
    title: { ja: "利用規約", en: "Terms of use" },
    lead: {
      ja: "当サイトのご利用にあたっての条件です。",
      en: "The terms on which you may use this site.",
    },
    sections: [
      {
        heading: { ja: "適用", en: "Scope" },
        body: {
          ja: [
            "本規約は、当サイトの利用に関する条件を定めるものです。利用者は、本規約に同意のうえご利用ください。",
          ],
          en: ["These terms govern your use of this site. By using it you accept them."],
        },
      },
      {
        heading: { ja: "禁止事項", en: "Prohibited conduct" },
        body: {
          ja: [
            "当サイトのコンテンツの無断複製・転載、サーバーへの過度な負荷を与える行為、他の利用者や第三者の権利を侵害する行為を禁止します。",
          ],
          en: [
            "Do not copy or republish our content without permission, place undue load on our servers, or infringe the rights of others.",
          ],
        },
      },
      {
        heading: { ja: "免責", en: "Limitation" },
        body: {
          ja: [
            "当サイトの利用により生じた損害について、当サイトは責任を負いません。詳細は免責事項をご確認ください。",
          ],
          en: [
            "We are not liable for losses arising from your use of this site. See the disclaimer for detail.",
          ],
        },
      },
    ],
  },
  {
    slug: "cookie",
    title: { ja: "Cookieポリシー", en: "Cookie policy" },
    lead: { ja: "Cookie の利用について。", en: "How this site uses cookies." },
    sections: [
      {
        heading: { ja: "利用目的", en: "Purpose" },
        body: {
          ja: [
            "アクセス解析および広告効果の測定のために Cookie を使用することがあります。",
            "言語の選択は URL で管理しており、Cookie は使用していません。",
          ],
          en: [
            "We may use cookies for analytics and to measure advertising performance.",
            "Language selection is handled in the URL, not by a cookie.",
          ],
        },
      },
      {
        heading: { ja: "無効化", en: "Opting out" },
        body: {
          ja: [
            "ブラウザの設定から Cookie を無効にできます。無効にした場合も、サイトの主要な機能はご利用いただけます。",
          ],
          en: [
            "You can disable cookies in your browser. The site's main features continue to work if you do.",
          ],
        },
      },
    ],
  },
  {
    slug: "sources",
    title: { ja: "情報提供元", en: "Data sources" },
    lead: { ja: "当サイトが参照しているデータの出どころです。", en: "Where our data comes from." },
    sections: [
      {
        heading: { ja: "市場データ", en: "Market data" },
        body: {
          ja: [
            "価格・時価総額・出来高は、設定された外部APIから取得しています。取得元と取得日時は各画面に表示しています。",
            "APIが未接続の場合は、モックデータであることを画面上に明示します。",
          ],
          en: [
            "Prices, market caps and volumes come from a configured external API. The source and fetch time are shown on every screen.",
            "When no API is connected, screens state clearly that the data is mock.",
          ],
        },
      },
      {
        heading: { ja: "ニュース", en: "News" },
        body: {
          ja: [
            "ニュースは複数のRSSフィードおよびニュースAPIから取得し、掲載時には必ず情報元のメディア名と公開日時を表示します。",
            "一次情報が確認できる場合は、その参照先へのリンクを添えます。",
          ],
          en: [
            "News is aggregated from several RSS feeds and news APIs. We always show the outlet and publication time.",
            "Where a primary source exists, we link to it.",
          ],
        },
      },
      {
        heading: { ja: "取引所・ツール情報", en: "Exchange and tool data" },
        body: {
          ja: [
            "各事業者が公開している情報を編集部が確認して掲載しています。確認日は各ページに表示します。",
            "確認できていない数値は掲載しません。",
          ],
          en: [
            "Taken from each operator's own published information and checked by our editors. The check date appears on each page.",
            "Figures we cannot verify are not published.",
          ],
        },
      },
    ],
  },
  {
    slug: "corrections",
    title: { ja: "コンテンツ修正依頼", en: "Request a correction" },
    lead: {
      ja: "誤り・古い情報を見つけた場合はお知らせください。",
      en: "Tell us if you find something wrong or out of date.",
    },
    sections: [
      {
        heading: { ja: "受付窓口", en: "Where to send it" },
        body: { ja: [`ご連絡先: ${TBD}`], en: [`Contact: ${TBD}`] },
      },
      {
        heading: { ja: "対応の流れ", en: "What happens next" },
        body: {
          ja: [
            "ご指摘の内容を一次情報にあたって確認します。",
            "誤りが確認できた場合は、修正または削除のうえ、該当ページに修正日を表示します。",
            "確認に時間を要する場合は、その旨を該当ページに表示します。",
          ],
          en: [
            "We check what you report against primary sources.",
            "If it is wrong we correct or remove it and publish the correction date on the page.",
            "If verification takes time, we say so on the page.",
          ],
        },
      },
    ],
  },
  {
    slug: "copyright",
    title: { ja: "著作権ポリシー", en: "Copyright policy" },
    lead: { ja: "コンテンツの権利と引用について。", en: "Rights in our content, and quoting it." },
    sections: [
      {
        heading: { ja: "当サイトのコンテンツ", en: "Our content" },
        body: {
          ja: [
            "当サイトに掲載している文章・図表の著作権は、当サイトまたは正当な権利者に帰属します。",
            "引用の範囲を超える転載を行う場合は、事前にご連絡ください。",
          ],
          en: [
            "Text and figures on this site belong to us or to their rightful owners.",
            "Please contact us before republishing beyond the bounds of fair quotation.",
          ],
        },
      },
      {
        heading: { ja: "第三者の権利", en: "Third-party rights" },
        body: {
          ja: [
            "サービス名・ロゴ等は各社の商標です。当サイトは比較・紹介の目的でこれらに言及していますが、各社との提携や推奨を示すものではありません。",
            "権利侵害のご指摘は「コンテンツ修正依頼」からご連絡ください。",
          ],
          en: [
            "Service names and logos are the trademarks of their owners. We reference them for comparison and description; this does not imply a partnership or endorsement.",
            "Report any infringement through the correction request page.",
          ],
        },
      },
    ],
  },
  {
    slug: "contact",
    title: { ja: "お問い合わせ", en: "Contact" },
    lead: { ja: "ご連絡はこちらから。", en: "How to reach us." },
    sections: [
      {
        heading: { ja: "窓口", en: "Contact points" },
        body: {
          ja: [
            `一般のお問い合わせ: ${TBD}`,
            `広告・掲載のご相談: ${TBD}`,
            `コンテンツの修正依頼: 「コンテンツ修正依頼」ページをご覧ください`,
          ],
          en: [
            `General enquiries: ${TBD}`,
            `Advertising: ${TBD}`,
            `Content corrections: see the correction request page`,
          ],
        },
      },
      {
        heading: { ja: "お答えできないこと", en: "What we cannot answer" },
        body: {
          ja: [
            "個別の投資判断に関するご相談、および取引所・ウォレットの口座に関するお問い合わせにはお答えできません。各サービスのサポート窓口へご連絡ください。",
          ],
          en: [
            "We cannot advise on individual investment decisions, and we cannot help with your exchange or wallet account. Please contact that service's support.",
          ],
        },
      },
    ],
  },
];

export const legalBySlug = new Map(legalPages.map((page) => [page.slug, page]));

export function getLegalPage(slug: string): LegalPage | undefined {
  return legalBySlug.get(slug);
}
