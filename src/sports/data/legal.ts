/**
 * 法務・方針の固定ページ。
 *
 * 「載せない理由」まで書くのが方針です。
 * 空欄や未記載は、読み手には隠しているように見えます。
 *
 * ⚠ 公開前に必ず、運営者名・所在地・連絡先を実在の情報へ置き換えてください。
 *   ここでは未確認の情報を書かないため、事業者情報は空欄のままにしています。
 */
import type { LocalizedText } from "../types";

export type LegalSection = {
  heading: LocalizedText;
  paragraphs: LocalizedText[];
  /** 箇条書き（あれば段落の後に出します） */
  bullets?: LocalizedText[];
};

export type LegalPage = {
  slug: string;
  title: LocalizedText;
  lead: LocalizedText;
  sections: LegalSection[];
  /** 最終更新日 */
  updatedAt: string;
};

const p = (ja: string, en: string): LocalizedText => ({ ja, en });

export const legalPages: LegalPage[] = [
  {
    slug: "about",
    title: p("運営者情報", "About us"),
    lead: p(
      "SPORTS PORT の運営体制と、掲載内容に対する責任の所在を示します。",
      "Who runs SPORTS PORT and who is accountable for what we publish.",
    ),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("運営者", "Operator"),
        paragraphs: [
          p(
            "運営者名・所在地・代表者名・連絡先は、公開前に実在の情報を記載します。現時点では確認済みの情報がないため、意図的に空欄としています（推測値を書かない方針のため）。",
            "The operating entity, address, representative and contact details will be filled in with verified information before launch. We deliberately leave them blank rather than write something unverified.",
          ),
        ],
      },
      {
        heading: p("サイトの目的", "What this site is for"),
        paragraphs: [
          p(
            "国内外のスポーツについて、試合速報・日程・順位表・選手情報・ニュース・動画・視聴手段を一元的に確認できる場を提供することを目的としています。",
            "To put live scores, fixtures, tables, player data, news, video and viewing options for world sport in one place.",
          ),
        ],
      },
      {
        heading: p("収益について", "How we are funded"),
        paragraphs: [
          p(
            "配信サービス・スポーツ用品・チケット・Web3.0 サービスなどのアフィリエイト、広告掲載、スポンサー記事を収益源としています。広告リンクには必ず「PR」表記を付け、通常のリンクと区別しています。",
            "Affiliate links, advertising and sponsored posts. Every paid link is labelled and distinguishable from an editorial one.",
          ),
        ],
      },
    ],
  },
  {
    slug: "editorial-policy",
    title: p("編集方針", "Editorial policy"),
    lead: p(
      "何を載せ、何を載せないかの基準です。",
      "What we publish, and what we refuse to publish.",
    ),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("事実の扱い", "Facts"),
        paragraphs: [
          p(
            "確認できない情報は掲載しません。推測値で欄を埋めるくらいなら、空のままにします。データには必ず取得時刻と情報元を添えます。",
            "If we cannot verify it, we do not publish it. We would rather leave a field empty than fill it with a guess. Every data point carries a timestamp and a source.",
          ),
        ],
      },
      {
        heading: p("情報の確度", "Confidence levels"),
        paragraphs: [
          p(
            "ニュースは「公式発表」「報道」「未確認」の3段階に分けて表示します。噂を確定情報として扱いません。",
            "News items are labelled official, reported or unconfirmed. A rumour is never presented as a fact.",
          ),
        ],
      },
      {
        heading: p("データ取得に失敗したとき", "When a data fetch fails"),
        paragraphs: [
          p(
            "古い情報を最新として表示しません。取得できなかったことを明示し、最終更新時刻を据え置きます。",
            "We never present stale numbers as current. We say the fetch failed and keep the previous timestamp visible.",
          ),
        ],
      },
      {
        heading: p("予測コンテンツ", "Predictions"),
        paragraphs: [
          p(
            "AI分析・プレビューは過去データの集計であり、将来の結果を保証しません。「必ず勝てる」「高確率で儲かる」といった表現は使用しません。",
            'Analysis aggregates past data and guarantees nothing. We never write "guaranteed" or "high probability of profit".',
          ),
        ],
      },
      {
        heading: p("訂正", "Corrections"),
        paragraphs: [
          p(
            "誤りが判明した場合は、該当箇所を修正し、更新日を明記します。修正依頼はお問い合わせページから受け付けます。",
            "When we get something wrong we fix it and stamp the update date. You can report an error from the correction page.",
          ),
        ],
      },
    ],
  },
  {
    slug: "ad-policy",
    title: p("広告掲載ポリシー", "Advertising policy"),
    lead: p(
      "広告と編集記事の線引きです。",
      "Where the line between advertising and editorial sits.",
    ),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("表記", "Labelling"),
        paragraphs: [
          p(
            '広告リンクには「PR」表記を付け、rel="sponsored nofollow" を付与します。スポンサー記事は記事冒頭に明記します。',
            'Ad links carry a visible label and rel="sponsored nofollow". Sponsored articles say so at the top.',
          ),
        ],
      },
      {
        heading: p("掲載順位", "Ordering"),
        paragraphs: [
          p(
            "比較表・一覧の掲載順は編集部の判断によるもので、報酬額では決めていません。報酬の有無が評価内容に影響することはありません。",
            "Ordering in comparison tables is editorial. Commission does not buy position, and it does not change what we write.",
          ),
        ],
      },
      {
        heading: p("掲載しないもの", "What we refuse"),
        bullets: [
          p("違法配信サイトへのリンク", "Links to pirate streams"),
          p(
            "年齢制限・地域制限の回避を促す内容",
            "Anything encouraging circumvention of age or region limits",
          ),
          p("利益や勝率を保証する表現", "Claims of guaranteed winnings"),
          p("実在しない実績・受賞歴の記載", "Fabricated awards or credentials"),
        ],
        paragraphs: [],
      },
    ],
  },
  {
    slug: "affiliate-policy",
    title: p("アフィリエイトポリシー", "Affiliate policy"),
    lead: p("アフィリエイトの仕組みと、当サイトの扱い方です。", "How affiliate links work here."),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("仕組み", "How it works"),
        paragraphs: [
          p(
            "当サイトのリンクを経由して契約・購入があった場合、当サイトが紹介料を受け取ることがあります。利用者の支払額が増えることはありません。",
            "If you subscribe or buy through our link we may receive a commission. It never increases what you pay.",
          ),
        ],
      },
      {
        heading: p("評価への影響", "Effect on our reviews"),
        paragraphs: [
          p(
            "紹介料の有無は、評価内容・掲載順位に影響しません。紹介料が発生しないサービスも同じ基準で掲載します。",
            "Commission does not affect our assessment or ordering. Services that pay nothing appear on the same terms.",
          ),
        ],
      },
      {
        heading: p("情報の鮮度", "Freshness"),
        paragraphs: [
          p(
            "料金・対象大会・キャンペーンは変わります。各行に情報確認日を表示していますので、申込前に必ず公式サイトで最新情報をご確認ください。",
            "Prices, rights and campaigns change. Every row is dated — always confirm on the official site first.",
          ),
        ],
      },
    ],
  },
  {
    slug: "betting-policy",
    title: p("ベッティング情報掲載方針", "Betting content policy"),
    lead: p(
      "スポーツベッティングに関する情報の扱いについてです。",
      "How we handle anything to do with sports betting.",
    ),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("基本方針", "Position"),
        paragraphs: [
          p(
            "当サイトは情報提供のみを目的としており、賭博行為を勧誘しません。日本国内から海外のベッティングサービスを利用する行為は、法令に抵触するおそれがあります。",
            "We publish information only and do not solicit gambling. Using offshore betting services from Japan may breach local law.",
          ),
        ],
      },
      {
        heading: p("事業者を掲載しない理由", "Why we list no operators"),
        paragraphs: [
          p(
            "当サイトの主要な読者が日本国内の方であること、および免許番号・対応地域・出金条件を当サイトで検証できない事業者を載せないという方針から、事業者名・リンク・アフィリエイトリンクを掲載していません。",
            "Most of our readers are in Japan, and we will not list an operator whose licence, permitted regions and withdrawal terms we cannot verify. So we list none.",
          ),
        ],
      },
      {
        heading: p("行わないこと", "What we will not do"),
        bullets: [
          p("試合結果の予言", "Predict results"),
          p("利益・勝率の保証", "Guarantee profit or win rates"),
          p("損失を取り戻す行動の推奨", "Encourage chasing losses"),
          p("賭け金を増やすことの推奨", "Encourage increasing stakes"),
          p("年齢制限・地域制限の回避の案内", "Explain how to bypass age or region limits"),
          p("VPN による地域制限回避の推奨", "Recommend VPNs for circumventing restrictions"),
          p("借入による利用の推奨", "Suggest borrowing to play"),
        ],
        paragraphs: [],
      },
      {
        heading: p("年齢・地域", "Age and region"),
        paragraphs: [
          p(
            "18歳未満（地域によっては21歳未満）の方は利用できません。お住まいの地域の法令により利用できない場合があります。",
            "Not available under 18, or under 21 in some regions. Local law may prohibit use entirely.",
          ),
        ],
      },
    ],
  },
  {
    slug: "responsible-use",
    title: p("責任ある利用に関する方針", "Responsible use policy"),
    lead: p("スポーツを楽しむことが目的です。", "The point is to enjoy the sport."),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("お願いしていること", "What we ask"),
        bullets: [
          p("生活費や借入金を使わないこと", "Never use money you need, and never borrow"),
          p("損失を取り戻そうとしないこと", "Never chase losses"),
          p("利用時間と金額の上限を先に決めること", "Set time and money limits before you start"),
          p("未成年者を関与させないこと", "Keep minors out of it"),
        ],
        paragraphs: [],
      },
      {
        heading: p("相談先", "Where to get help"),
        paragraphs: [
          p(
            "ギャンブル等依存症でお困りの場合は、お住まいの自治体の相談窓口、精神保健福祉センター等の公的機関にご相談ください。当サイトは相談機関ではありません。",
            "If gambling has stopped being a choice, contact a public health or addiction service where you live. We are not one.",
          ),
        ],
      },
    ],
  },
  {
    slug: "disclaimer",
    title: p("免責事項", "Disclaimer"),
    lead: p(
      "掲載内容の正確性と責任の範囲についてです。",
      "On accuracy and the limits of our responsibility.",
    ),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("掲載内容", "Content"),
        paragraphs: [
          p(
            "掲載内容の正確性には努めていますが、完全性・最新性を保証するものではありません。試合情報・料金・対応地域は変更されます。重要な判断の前には、必ず公式情報をご確認ください。",
            "We try to be accurate but do not warrant completeness or currency. Fixtures, prices and regional availability change. Check the official source before acting on anything important.",
          ),
        ],
      },
      {
        heading: p("外部リンク", "External links"),
        paragraphs: [
          p(
            "外部サイトの内容について、当サイトは責任を負いません。リンク先の利用規約・プライバシーポリシーをご確認ください。",
            "We are not responsible for the content of external sites. Read their terms and privacy policies.",
          ),
        ],
      },
      {
        heading: p("分析・予測", "Analysis and previews"),
        paragraphs: [
          p(
            "AI分析・プレビューは娯楽および情報提供が目的です。将来の結果や利益を保証するものではありません。",
            "Analysis and previews are entertainment and information. They guarantee no outcome and no return.",
          ),
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: p("プライバシーポリシー", "Privacy policy"),
    lead: p("取得する情報と、その使い道です。", "What we collect and why."),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("取得する情報", "What we collect"),
        paragraphs: [
          p(
            "アクセス解析のための利用状況（閲覧ページ、参照元、端末情報など）を取得することがあります。氏名・住所などの個人を直接特定する情報は、お問い合わせいただいた場合を除き取得しません。",
            "Usage data for analytics — pages viewed, referrer, device information. We do not collect directly identifying information unless you contact us.",
          ),
        ],
      },
      {
        heading: p("利用目的", "Why"),
        bullets: [
          p("サイトの改善と表示速度の最適化", "Improving the site and its performance"),
          p("不正アクセスの検知", "Detecting abuse"),
          p("お問い合わせへの対応", "Responding to enquiries"),
        ],
        paragraphs: [],
      },
      {
        heading: p("第三者提供", "Third parties"),
        paragraphs: [
          p(
            "法令に基づく場合を除き、取得した情報を第三者へ提供することはありません。解析・配信のために外部サービスを利用する場合は、Cookieポリシーに記載します。",
            "We do not share data with third parties except where the law requires it. Any analytics or delivery services we use are listed in the cookie policy.",
          ),
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: p("利用規約", "Terms of use"),
    lead: p("ご利用にあたっての取り決めです。", "The terms on which you use this site."),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("禁止事項", "Prohibited"),
        bullets: [
          p("掲載内容の無断転載・大量複製", "Republishing or bulk-copying our content"),
          p(
            "サーバーへ過度な負荷をかける行為（自動収集を含む）",
            "Overloading our servers, including automated scraping",
          ),
          p("他の利用者・第三者の権利を侵害する行為", "Infringing the rights of others"),
        ],
        paragraphs: [],
      },
      {
        heading: p("サービスの変更・停止", "Changes"),
        paragraphs: [
          p(
            "予告なくサービス内容を変更または停止することがあります。",
            "We may change or suspend the service without notice.",
          ),
        ],
      },
    ],
  },
  {
    slug: "cookie",
    title: p("Cookieポリシー", "Cookie policy"),
    lead: p("Cookie の使い方です。", "How we use cookies."),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("利用目的", "Purpose"),
        paragraphs: [
          p(
            "表示設定の保持、アクセス解析、アフィリエイト計測のために Cookie を使用することがあります。ブラウザの設定で無効にできますが、一部機能が使えなくなる場合があります。",
            "Display preferences, analytics and affiliate attribution. You can disable cookies in your browser, though some features will stop working.",
          ),
        ],
      },
      {
        heading: p("言語設定について", "Language"),
        paragraphs: [
          p(
            "表示言語は URL のロケール（/ja/ /en/ など）で切り替えており、言語選択のために Cookie を書き込む必要はありません。",
            "Language is selected by the URL locale, so we do not need a cookie to remember it.",
          ),
        ],
      },
    ],
  },
  {
    slug: "copyright",
    title: p("著作権・画像利用方針", "Copyright and image policy"),
    lead: p("権利物の扱いについてです。", "How we handle rights-managed material."),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("映像・写真", "Footage and photographs"),
        paragraphs: [
          p(
            "当サイトは試合映像の配信・転載を行いません。動画は権利者が公開しているものの埋め込みに限ります。違法配信サイトへのリンクは掲載しません。",
            "We do not host or redistribute match footage. Video is limited to rights-holder embeds. We never link to pirate streams.",
          ),
        ],
      },
      {
        heading: p("ロゴ・エンブレム", "Logos and crests"),
        paragraphs: [
          p(
            "チームロゴ・リーグロゴは権利物のため掲載していません。当サイトではチームカラーとイニシャルから自前で生成したモノグラムを使用しています。",
            "Team and league logos are rights-managed, so we do not use them. We render our own monograms from team colours and initials instead.",
          ),
        ],
      },
      {
        heading: p("選手写真", "Player photographs"),
        paragraphs: [
          p(
            "肖像権・利用許諾が必要なため掲載していません。利用許諾のある素材が用意でき次第、順次対応します。",
            "Not published, because they require licensing and personality rights clearance. We will add them once we have proper licences.",
          ),
        ],
      },
      {
        heading: p("外部から取得した画像", "Images sourced from elsewhere"),
        paragraphs: [
          p(
            "掲載する画像は、Wikimedia Commons のファイルページでライセンス・作者・出典を確認できたものに限ります。Wikipediaの記事に載っているという理由だけで転載することはありません。商用利用不可・改変不可・ライセンス不明の画像は使用しません。",
            "We publish an image only when its licence, author and source can be verified on the Wikimedia Commons file page. We never reuse an image merely because it appears in a Wikipedia article, and we do not use non-commercial, no-derivatives or unknown-licence images.",
          ),
          p(
            "使用しているすべての画像の作者・出典・ライセンス・取得日は「画像出典・ライセンス一覧」に掲載しています。適切な画像が無い場合は、無理に画像を使わず自前の生成ビジュアルを表示します。当サイトは Wikimedia Foundation とは無関係であり、公認を受けたものではありません。",
            "The author, source, licence and retrieval date of every image are listed on our image credits page. Where no suitable image exists we show a generated visual rather than forcing one. This site is not affiliated with or endorsed by the Wikimedia Foundation.",
          ),
        ],
      },
      {
        heading: p("試合データ", "Match data"),
        paragraphs: [
          p(
            "データ提供元の利用規約に従って表示します。再配布が禁止されている場合、当サイトから第三者へのデータ提供は行いません。",
            "Displayed under the provider's terms. Where redistribution is prohibited, we do not pass data on.",
          ),
        ],
      },
    ],
  },
  {
    slug: "data-policy",
    title: p("データ利用方針", "Data policy"),
    lead: p("スポーツデータの取得と表示のしかたです。", "How we source and present sports data."),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("取得", "Sourcing"),
        paragraphs: [
          p(
            "外部APIはサーバー側からのみ呼び出します。APIキーがクライアントへ露出することはありません。取得時刻を保存し、画面に表示します。",
            "External APIs are called only from the server. API keys never reach the browser. We store and display the fetch time.",
          ),
        ],
      },
      {
        heading: p("更新頻度", "Refresh rate"),
        paragraphs: [
          p(
            "画面に表示する更新間隔は、実際のポーリング間隔と一致させます。見かけだけ速い数字は出しません。",
            "The refresh interval we display is the interval we actually poll at. We do not advertise a speed we do not deliver.",
          ),
        ],
      },
      {
        heading: p("現在のデータ", "Current data"),
        paragraphs: [
          p(
            "現在はデモデータで動作しています。スコア・順位・料金は実際の値ではなく、選手はすべて架空です。実データへの切り替えは環境変数で行います。",
            "The site currently runs on demo data. Scores, tables and prices are not real, and all players are fictional. Switching to live data is an environment variable.",
          ),
        ],
      },
    ],
  },
  {
    slug: "contact",
    title: p("お問い合わせ", "Contact"),
    lead: p("ご連絡方法です。", "How to reach us."),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("連絡先", "Contact details"),
        paragraphs: [
          p(
            "連絡先は公開前に記載します。現時点では確認済みの窓口がないため、意図的に空欄としています。",
            "Contact details will be published before launch. We leave this blank rather than publish an address that does not work.",
          ),
        ],
      },
      {
        heading: p("お問い合わせの種類", "What to contact us about"),
        bullets: [
          p("掲載内容の誤りのご指摘", "Errors in what we published"),
          p("広告・スポンサーに関するご相談", "Advertising and sponsorship"),
          p("権利に関するご連絡", "Rights enquiries"),
          p("取材・掲載のご依頼", "Press and coverage requests"),
        ],
        paragraphs: [],
      },
    ],
  },
  {
    slug: "correction",
    title: p("情報修正依頼", "Report a correction"),
    lead: p("誤りを見つけたときのご連絡先です。", "Found something wrong? Tell us."),
    updatedAt: "2026-08-01",
    sections: [
      {
        heading: p("お知らせいただきたいこと", "What to include"),
        bullets: [
          p("該当ページのURL", "The URL of the page"),
          p("誤っている箇所", "What is wrong"),
          p("正しい情報と、その情報源", "What is correct, and where that comes from"),
        ],
        paragraphs: [],
      },
      {
        heading: p("対応", "What we do"),
        paragraphs: [
          p(
            "内容を確認のうえ、必要な場合は該当箇所を修正し、更新日を明記します。修正の可否と理由はご連絡します。",
            "We check it, fix it if needed, and stamp the update date. We will tell you either way and explain why.",
          ),
        ],
      },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | undefined {
  return legalPages.find((page) => page.slug === slug);
}
