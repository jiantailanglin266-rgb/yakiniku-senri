import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/data/site";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "利用規約", href: "/terms" },
];

export const metadata: Metadata = pageMetadata({
  title: "利用規約",
  description: `${store.name}公式サイトのご利用にあたっての規約です。`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalLayout
      en="TERMS OF USE"
      ja="利用規約"
      lead="本サイトのご利用にあたっては、以下の内容にご同意いただいたものとみなします。"
      crumbs={crumbs}
      updatedAt="2026-08-03"
    >
      <p className="text-gold/80 text-[0.78rem]">
        ※ 本ページの [ ] 部分は公開前に確定した内容へ差し替えてください。
      </p>

      <section>
        <h2>第1条（適用）</h2>
        <p>
          本規約は、[運営事業者名]（以下「当店」といいます）が運営する本サイト（{siteUrl}
          ）のご利用に関する条件を定めるものです。
        </p>
      </section>

      <section>
        <h2>第2条（掲載情報）</h2>
        <p>
          当店は、本サイトに掲載する情報の正確性の維持に努めますが、その完全性・正確性・有用性を保証するものではありません。営業時間、定休日、メニュー内容および価格は予告なく変更される場合があります。ご来店前にお電話（
          {store.phone}）にてご確認ください。
        </p>
      </section>

      <section>
        <h2>第3条（禁止事項）</h2>
        <p>本サイトのご利用にあたり、次の行為を禁止します。</p>
        <ul>
          <li>法令または公序良俗に違反する行為</li>
          <li>当店または第三者の権利、利益、名誉を損なう行為</li>
          <li>本サイトの運営を妨げる行為、サーバーに過度の負荷をかける行為</li>
          <li>不正アクセスその他これに類する行為</li>
        </ul>
      </section>

      <section>
        <h2>第4条（著作権）</h2>
        <p>
          本サイトに掲載されている文章、画像、動画、ロゴその他のコンテンツの著作権は、当店または正当な権利者に帰属します。権利者の許諾なく複製、転載、改変、再配布することはできません。
        </p>
      </section>

      <section>
        <h2>第5条（リンク）</h2>
        <p>
          本サイトへのリンクは原則として自由です。ただし、当店の信用を毀損するおそれのある場合、リンクをお断りすることがあります。本サイトから遷移する外部サイトの内容について、当店は責任を負いません。
        </p>
      </section>

      <section>
        <h2>第6条（免責）</h2>
        <p>
          本サイトのご利用またはご利用ができなかったことにより生じた損害について、当店は一切の責任を負いません。ただし、当店の故意または重過失による場合はこの限りではありません。
        </p>
      </section>

      <section>
        <h2>第7条（準拠法・管轄）</h2>
        <p>
          本規約は日本法に準拠します。本サイトに関して紛争が生じた場合、[管轄裁判所名]を第一審の専属的合意管轄裁判所とします。
        </p>
      </section>
    </LegalLayout>
  );
}
