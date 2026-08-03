import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { pageMetadata } from "@/lib/seo";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "特定商取引法に基づく表記", href: "/legal" },
];

export const metadata: Metadata = pageMetadata({
  title: "特定商取引法に基づく表記",
  description: `${store.name}の特定商取引法に基づく表記です。`,
  path: "/legal",
});

export default function LegalPage() {
  return (
    <LegalLayout
      en="LEGAL NOTICE"
      ja="特定商取引法に基づく表記"
      crumbs={crumbs}
      updatedAt="2026-08-03"
    >
      <div className="border-gold/25 border p-6">
        <p className="text-ivory/90 mt-0 text-[0.84rem]">
          本サイトは店舗情報の案内を目的としており、オンラインでの商品販売・決済は行っておりません。
          ご予約およびテイクアウトのご注文は、お電話にて承り、店頭でのお受け渡し・お支払いとなります。
        </p>
        <p className="text-gray text-[0.78rem]">
          そのため、通信販売に関する販売価格・送料・支払方法・返品条件等の表示は行っておりません。
          将来オンライン販売を開始する際は、本ページに必要事項を追記してください。
        </p>
      </div>

      <p className="text-gold/80 text-[0.78rem]">
        ※ 以下の [ ] 部分は公開前に確定した内容へ差し替えてください。
      </p>

      <section>
        <h2>事業者情報</h2>
        <ul>
          <li>事業者名：[運営事業者名]</li>
          <li>代表者名：[代表者名]</li>
          <li>所在地：{store.addressFull}</li>
          <li>電話番号：{store.phone}</li>
          <li>メールアドレス：[メールアドレス]</li>
          <li>
            営業時間：本サイトの<Link href="/access">アクセス・店舗情報</Link>ページをご確認ください
          </li>
          <li>定休日：{store.closed}</li>
        </ul>
      </section>

      <section>
        <h2>店頭でのご注文について</h2>
        <ul>
          <li>
            販売価格：本サイトの<Link href="/menu">お品書き</Link>に記載の価格（税込表記）
          </li>
          <li>お支払い方法：[お支払方法]</li>
          <li>お支払い時期：店頭でのお受け渡し時</li>
          <li>商品のお引き渡し時期：ご注文時にお伝えするお受け取り時間</li>
          <li>
            キャンセルについて：食品の性質上、調理後のキャンセル・返品はお受けできません。やむを得ない事情がある場合はお電話にてご相談ください。
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}
