import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { MobileFixedBar } from "@/components/layout/MobileFixedBar";
import { SkipLink } from "@/components/layout/SkipLink";
import { PageTransition } from "@/components/effects/PageTransition";
import { LoadingScreen } from "@/components/effects/LoadingScreen";
import { ChatBot } from "@/components/chat/ChatBot";
import { GoogleTranslate } from "@/components/i18n/GoogleTranslate";
import { JsonLd } from "@/components/ui/JsonLd";
import { organizationJsonLd, restaurantJsonLd, websiteJsonLd } from "@/lib/structured-data";

/**
 * 焼肉 千里 の共通シェル（背景・ヘッダー・フッター・翻訳・構造化データ）。
 *
 * ルートレイアウトから切り出しています。
 * `<html>` / `<body>` だけをルートに残し、ブランド固有の外枠はここに置きます。
 * 404ページからも同じ外枠を使えるようにコンポーネント化しています。
 */
/**
 * オープニングの黒幕を、描画される前に出し分けるための指定。
 *
 * 本文より先に実行する必要があるため、外部ファイルではなくインラインで置いています
 * （読み込みを待つあいだにサイトが見えてしまうため）。
 * 同じセッションで一度見ている場合だけ、黒幕を消す印を付けます。
 */
const OPENING_FLAG = `try{if(sessionStorage.getItem("senri:loaded")==="1"){document.documentElement.dataset.opening="seen"}}catch(e){}`;

export function SenriShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: OPENING_FLAG }} />
      {/* JavaScript が無効な環境では、黒幕が消えなくなるため最初から出しません */}
      <noscript>
        <style>{`.opening-screen{display:none}`}</style>
      </noscript>

      {/*
        オープニングは <main> の外に置きます。
        PageTransition が初期表示で opacity:0 を当てるため、<main> の中にあると
        JavaScript が動き出すまで黒幕が描かれず、背後のサイトが見えてしまいます。
        （どのページで出すかは LoadingScreen 側で判断します）
      */}
      <LoadingScreen />

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
