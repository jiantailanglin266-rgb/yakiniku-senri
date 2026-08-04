import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { pageMetadata } from "@/lib/seo";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "サイト利用上の注意", href: "/notes" },
];

export const metadata: Metadata = pageMetadata({
  title: "サイト利用上の注意",
  description: `${store.name}公式サイトをご利用いただく際の注意事項です。`,
  path: "/notes",
});

export default function NotesPage() {
  return (
    <LegalLayout
      en="NOTES"
      ja="サイト利用上の注意"
      lead="本サイトをご覧いただく際に、あらかじめご確認いただきたい事項です。"
      crumbs={crumbs}
      updatedAt="2026-08-03"
    >
      <section>
        <h2>掲載情報について</h2>
        <p>
          営業時間、定休日、メニュー内容および価格は、予告なく変更となる場合があります。最新の情報は
          <Link href="/news">お知らせ</Link>をご確認いただくか、お電話（{store.phone}
          ）にてお問い合わせください。
        </p>
      </section>

      <section>
        <h2>写真・動画について</h2>
        <p>
          本サイトに掲載している写真・動画は、実際の商品や店内の様子と異なる場合があります。盛り付けや内容は仕入れ状況により変わることがあります。
        </p>
      </section>

      <section>
        <h2>アレルギー・食材について</h2>
        <p>
          食材やアレルギーに関するご不安がある場合は、ご注文前にスタッフまでお申し付けください。同一の厨房で調理しているため、微量の混入を完全に避けることはできない点をご了承ください。
        </p>
      </section>

      <section>
        <h2>推奨環境</h2>
        <p>
          本サイトは、各ブラウザの最新版でのご利用を推奨しています。ブラウザの設定によっては、一部の機能や表示が正しく動作しない場合があります。
        </p>
      </section>

      <section>
        <h2>アニメーション表示について</h2>
        <p>
          本サイトでは控えめなアニメーションを使用しています。OSの「視差効果を減らす」「アニメーションを減らす」設定を有効にしている場合、アニメーションは自動的に無効になります。
        </p>
      </section>
    </LegalLayout>
  );
}
