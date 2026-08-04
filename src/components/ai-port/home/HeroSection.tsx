import Link from "next/link";
import { Radio } from "lucide-react";
import { Ticker } from "@/components/ai-port/effects/Ticker";
import { GhostLink, GradientText, PrimaryLink } from "@/components/ai-port/ui/Primitives";
import { aiPortPath } from "@/data/ai-port/site";
import { tools } from "@/data/ai-port/tools";
import { topics } from "@/data/ai-port/taxonomy";
import { diagnoses } from "@/data/ai-port/diagnosis";
import { relativeTime, type NewsItem } from "@/lib/ai-port/news";
import { HeroSearch } from "./HeroSearch";
import { HeroOrb } from "./HeroOrb";
import { HeroLogoVideo } from "./HeroLogoVideo";

/**
 * トップページのヒーロー。
 *
 * ■ 数字は実測値だけ
 *   「掲載数」「カテゴリー数」はデータ配列の長さから出しています。
 *   会員数・PV・満足度などの持っていない数字は一切出しません。
 *
 * ■ ニュースティッカー
 *   取得できた最新ニュースだけを流します。0件のときは帯ごと出しません
 *   （空の帯が出ていると「壊れている」ように見えるため）。
 */
export function HeroSection({ news }: { news: NewsItem[] }) {
  const ticker = news.slice(0, 12);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[88rem] gap-14 px-5 pt-16 pb-14 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:pt-24 lg:pb-20">
        <div className="min-w-0">
          {/* 動くロゴ。見出しの上に置きます（出せない環境では何も出しません） */}
          <HeroLogoVideo className="mb-6 block h-16 w-auto sm:h-20" />

          <p className="font-ai-mono text-ai-haze flex items-center gap-2.5 text-[0.66rem] tracking-[0.26em] uppercase">
            <span className="relative flex size-2">
              <span className="bg-ai-cyan absolute inset-0 animate-ping rounded-full opacity-70" />
              <span className="bg-ai-cyan relative size-2 rounded-full" />
            </span>
            AI PORT — AI / WEB3 PORTAL
          </p>

          <h1 className="mt-6 text-[2.1rem] leading-[1.24] sm:text-[2.9rem] lg:text-[3.35rem]">
            AIの「今」が、
            <br />
            <GradientText flow>ここに集まる。</GradientText>
          </h1>

          <p className="text-ai-mist mt-6 max-w-xl text-[0.92rem] leading-[2.05]">
            AIニュース・AIツール・AIエージェント・Web3を1か所に。
            公式ブログのRSSを自動収集した最新ニュース、用途別のツールデータベースと比較表、
            無料のAI診断、サイト内を検索して答えるAIチャットを提供します。
          </p>

          <div className="mt-9">
            <HeroSearch />
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <PrimaryLink href={aiPortPath("/tools")}>AIツールを探す</PrimaryLink>
            <GhostLink href={aiPortPath("/diagnosis")}>無料でAI診断</GhostLink>
          </div>

          <dl className="mt-11 grid max-w-lg grid-cols-3 gap-4">
            <HeroStat value={tools.length} unit="件" label="掲載AIツール" />
            <HeroStat value={topics.length} unit="分野" label="トピックハブ" />
            <HeroStat value={diagnoses.length} unit="種類" label="無料AI診断" />
          </dl>
        </div>

        <div className="relative min-w-0">
          <HeroOrb />
        </div>
      </div>

      {ticker.length > 0 ? (
        <div className="relative border-y border-white/8 bg-white/[0.02]">
          <div className="mx-auto flex max-w-[88rem] items-center">
            <p className="font-ai-mono text-ai-cyan hidden shrink-0 items-center gap-2 border-r border-white/10 px-6 py-3.5 text-[0.62rem] tracking-[0.2em] sm:flex">
              <Radio aria-hidden="true" className="ai-pulse size-3.5" />
              LIVE
            </p>

            <Ticker className="min-w-0 flex-1 py-3.5" duration={64}>
              {ticker.map((item) => (
                <a
                  key={item.link}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ai-mist hover:text-ai-cyan flex shrink-0 items-center gap-3 px-6 text-[0.8rem] transition-colors"
                >
                  <span className="bg-ai-violet size-1 shrink-0 rounded-full" aria-hidden="true" />
                  <span className="max-w-[42ch] truncate">{item.title}</span>
                  <span className="text-ai-dim shrink-0 text-[0.68rem]" translate="no">
                    {relativeTime(item.isoDate)}
                  </span>
                </a>
              ))}
            </Ticker>

            <Link
              href={aiPortPath("/news")}
              className="text-ai-haze hover:text-ai-cyan hidden shrink-0 border-l border-white/10 px-6 py-3.5 text-[0.74rem] transition-colors lg:block"
            >
              すべて見る
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function HeroStat({ value, unit, label }: { value: number; unit: string; label: string }) {
  return (
    <div className="border-l border-white/10 pl-4">
      <dd
        className="font-ai-display text-ai-white text-[1.5rem] leading-none font-semibold"
        translate="no"
      >
        {value}
        <span className="text-ai-haze ml-1 text-[0.78rem] font-normal">{unit}</span>
      </dd>
      <dt className="text-ai-dim mt-2 text-[0.7rem]">{label}</dt>
    </div>
  );
}
