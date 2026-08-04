import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { MobileFixedBar } from "@/components/layout/MobileFixedBar";
import { SkipLink } from "@/components/layout/SkipLink";
import { PageTransition } from "@/components/effects/PageTransition";
import { ChatBot } from "@/components/chat/ChatBot";
import { GoogleTranslate } from "@/components/i18n/GoogleTranslate";
import { JsonLd } from "@/components/ui/JsonLd";
import { organizationJsonLd, restaurantJsonLd, websiteJsonLd } from "@/lib/structured-data";

/**
 * 焼肉 千里 の共通シェル（背景・ヘッダー・フッター・翻訳・構造化データ）。
 *
 * ルートレイアウトから切り出しています。
 * 同じリポジトリで別ブランドのサイト（/ai-port）を配信するため、
 * `<html>` / `<body>` だけをルートに残し、ブランド固有の外枠はここに置きます。
 * 404ページからも同じ外枠を使えるようにコンポーネント化しています。
 */
export function SenriShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 処方A/B — ページ全体で1枚の連続背景。セクション固有背景を持たせない */}
      <div className="bg-canvas" aria-hidden="true" />
      <div className="bg-ornament" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />

      <SkipLink />
      <GlobalHeader />
      <main id="main">
        <PageTransition>{children}</PageTransition>
      </main>
      <GlobalFooter />
      <MobileFixedBar />

      <ChatBot />
      <GoogleTranslate />
      <JsonLd data={[websiteJsonLd, organizationJsonLd, restaurantJsonLd]} />
    </>
  );
}
