import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { pageMetadata } from "@/lib/seo";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "Cookieポリシー", href: "/cookie" },
];

export const metadata: Metadata = pageMetadata({
  title: "Cookieポリシー",
  description: `${store.name}公式サイトにおけるCookieの利用について説明しています。`,
  path: "/cookie",
});

export default function CookiePage() {
  return (
    <LegalLayout
      en="COOKIE POLICY"
      ja="Cookieポリシー"
      lead="本サイトにおけるCookie等の取り扱いについてご説明します。"
      crumbs={crumbs}
      updatedAt="2026-08-03"
    >
      <section>
        <h2>1. Cookieとは</h2>
        <p>
          Cookieとは、ウェブサイトの利用時にブラウザへ保存される小さなテキストファイルです。サイトの利用状況の把握や、表示の最適化に用いられます。
        </p>
      </section>

      <section>
        <h2>2. 本サイトでの利用</h2>
        <p>
          本サイトは、サイトの利用状況を把握し改善するために、アクセス解析ツールを利用する場合があります。この場合、Cookieによって収集される情報は匿名であり、個人を特定するものではありません。
        </p>
        <p>
          また、本サイトにはGoogle
          Mapsおよび動画配信サービスの埋め込みを利用している箇所があります。これらのコンテンツを表示した際、提供元によりCookieが設定される場合があります。各サービスの取り扱いについては、提供元のプライバシーポリシーをご確認ください。
        </p>
      </section>

      <section>
        <h2>3. Cookieの無効化</h2>
        <p>
          Cookieはブラウザの設定から無効にすることができます。無効にした場合でも本サイトの主要な機能はご利用いただけますが、一部の表示が正しく行われない可能性があります。
        </p>
      </section>

      <section>
        <h2>4. お問い合わせ</h2>
        <p>
          Cookieの取り扱いに関するお問い合わせは、<Link href="/contact">お問い合わせページ</Link>
          に記載の連絡先までご連絡ください。
        </p>
      </section>
    </LegalLayout>
  );
}
