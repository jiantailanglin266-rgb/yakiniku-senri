import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { pageMetadata } from "@/lib/seo";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "プライバシーポリシー", href: "/privacy" },
];

export const metadata: Metadata = pageMetadata({
  title: "プライバシーポリシー",
  description: `${store.name}における個人情報の取り扱いについて定めたプライバシーポリシーです。`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalLayout
      en="PRIVACY POLICY"
      ja="プライバシーポリシー"
      lead="当店は、お客様の個人情報の重要性を認識し、適切に取り扱うよう努めます。"
      crumbs={crumbs}
      updatedAt="2026-08-03"
    >
      <p className="text-gold/80 text-[0.78rem]">
        ※ 本ページの [ ] 部分は公開前に確定した内容へ差し替えてください。
      </p>

      <section>
        <h2>1. 事業者情報</h2>
        <ul>
          <li>事業者名：[運営事業者名]</li>
          <li>代表者名：[代表者名]</li>
          <li>所在地：{store.addressFull}</li>
          <li>電話番号：{store.phone}</li>
          <li>個人情報に関するお問い合わせ先：[メールアドレス]</li>
        </ul>
      </section>

      <section>
        <h2>2. 取得する情報</h2>
        <p>
          当店は、ご予約・お問い合わせ・テイクアウトのご注文にあたり、お名前、電話番号、ご来店日時、ご注文内容など、対応に必要な範囲の情報を取得します。
        </p>
        <p>
          また、本サイトの利用状況を把握するため、アクセスログ・Cookie等の情報を取得する場合があります。詳細は
          <Link href="/cookie">Cookieポリシー</Link>をご確認ください。
        </p>
      </section>

      <section>
        <h2>3. 利用目的</h2>
        <ul>
          <li>ご予約・ご注文の受付および確認のため</li>
          <li>お問い合わせへの回答のため</li>
          <li>当店のサービス向上および本サイトの改善のため</li>
          <li>法令に基づく対応のため</li>
        </ul>
      </section>

      <section>
        <h2>4. 第三者提供</h2>
        <p>
          当店は、次の場合を除き、あらかじめご本人の同意を得ることなく個人情報を第三者に提供しません。
        </p>
        <ul>
          <li>法令に基づく場合</li>
          <li>
            人の生命、身体または財産の保護のために必要がある場合であって、ご本人の同意を得ることが困難であるとき
          </li>
          <li>
            利用目的の達成に必要な範囲で業務委託先に提供する場合（この場合、委託先を適切に監督します）
          </li>
        </ul>
      </section>

      <section>
        <h2>5. 安全管理措置</h2>
        <p>
          当店は、取得した個人情報の漏えい、滅失またはき損の防止その他の安全管理のために、必要かつ適切な措置を講じます。
        </p>
      </section>

      <section>
        <h2>6. 開示・訂正・利用停止等のご請求</h2>
        <p>
          ご本人からの個人情報の開示、訂正、追加、削除、利用停止等のご請求については、上記のお問い合わせ先までご連絡ください。法令に従い、速やかに対応いたします。
        </p>
      </section>

      <section>
        <h2>7. 本ポリシーの変更</h2>
        <p>
          当店は、法令の改正その他の理由により、本ポリシーを変更することがあります。変更後の内容は本ページに掲載した時点から適用されます。
        </p>
      </section>
    </LegalLayout>
  );
}
