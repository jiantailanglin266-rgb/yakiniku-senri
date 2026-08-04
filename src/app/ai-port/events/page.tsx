import type { Metadata } from "next";
import { ArrowUpRight, CalendarDays } from "lucide-react";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { Badge, Disclaimer, GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiEvents, eventKindLabel } from "@/data/ai-port/events";
import { aiPortPath } from "@/data/ai-port/site";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, aiPortFaqJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "AIイベント", path: "/events" },
];

const FAQS = [
  {
    q: "開催日はどこで確認できますか？",
    a: "各イベントの公式サイトでご確認ください。AI PORTでは開催日を掲載していません。日程は毎年変わり、直前に変更されることもあるため、古い日付を載せると来場者に実害が出るからです。",
  },
  {
    q: "オンラインで視聴できるイベントはありますか？",
    a: "NVIDIA GTC・Google I/O・Microsoft Build・WWDC・AWS re:Invent は、基調講演やセッションをオンラインで公開しています。視聴条件は各公式サイトでご確認ください。",
  },
  {
    q: "国内で開催されるAIイベントはありますか？",
    a: "国内では「AI・人工知能EXPO」が春・秋ごろに東京・大阪で開催されています。国内のAI関連サービスが集まる展示会で、導入検討中の企業向けの商談が中心です。",
  },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AIイベント・カンファレンス一覧｜毎年開催の公式イベント",
  description:
    "NVIDIA GTC・Google I/O・Microsoft Build・WWDC・AWS re:Invent・CES・NeurIPS・AI人工知能EXPOなど、毎年継続して開催されているAI関連イベントをまとめています。開催時期の目安と公式サイトへの導線を掲載。",
  path: "/events",
  keywords: ["AIイベント", "AI カンファレンス", "AI 展示会", "AI セミナー", "GTC", "Google I/O"],
});

/**
 * AIイベント一覧。
 *
 * ⚠ 開催日は掲載しません。
 *   毎年変わり、直前に変更されることもあります。古い日付は来場者への実害です。
 *   「毎年おおよそいつ頃か」という季節の目安だけを持ち、確定日程は公式サイトへ送ります。
 * ⚠ Event の構造化データも出しません（startDate が必須で、それを持っていないため）。
 */
export default function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="Events"
        title="毎年開催される"
        highlight="AIイベント"
        description="毎年継続して開催されている公式イベントだけを掲載しています。開催日は年ごとに変わるため、確定日程は必ず各公式サイトでご確認ください。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiEvents.map((event, index) => (
            <Reveal key={event.id} as="li" delay={index * 50}>
              <GlassCard className="group relative flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <Badge accent={event.online ? "mint" : "amber"}>
                    {eventKindLabel[event.kind]}
                  </Badge>
                  <CalendarDays aria-hidden="true" className="text-ai-dim size-4 shrink-0" />
                </div>

                <h2 className="text-ai-white mt-4 text-[1.05rem]" translate="no">
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group-hover:text-ai-cyan transition-colors after:absolute after:inset-0"
                  >
                    {event.name}
                  </a>
                </h2>

                <p className="text-ai-cyan mt-2 text-[0.8rem]">{event.season}</p>
                <p className="text-ai-haze mt-3 text-[0.83rem] leading-[1.9]">{event.summary}</p>

                <dl className="text-ai-dim mt-auto grid gap-1.5 pt-5 text-[0.72rem]">
                  <div className="flex justify-between gap-3">
                    <dt>主催</dt>
                    <dd className="text-ai-mist" translate="no">
                      {event.organizer}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>開催地</dt>
                    <dd className="text-ai-mist">{event.region}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>オンライン視聴</dt>
                    <dd className="text-ai-mist">{event.online ? "あり" : "現地開催"}</dd>
                  </div>
                </dl>

                <p className="text-ai-dim mt-4 flex items-center gap-1.5 text-[0.72rem]">
                  公式サイトで日程を確認
                  <ArrowUpRight aria-hidden="true" className="size-3" />
                </p>
              </GlassCard>
            </Reveal>
          ))}
        </ul>

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.05rem]">よくある質問</h2>
          <dl className="mt-6 grid gap-5 lg:grid-cols-3">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="text-ai-white text-[0.9rem] leading-[1.7]">{faq.q}</dt>
                <dd className="text-ai-haze mt-2 text-[0.83rem] leading-[1.95]">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Disclaimer>
          開催時期は例年の傾向であり、開催を保証するものではありません。参加費・申込方法・開催形式を含め、
          必ず各イベントの公式サイトで最新情報をご確認ください。
        </Disclaimer>

        <RelatedLinks
          items={[
            { href: aiPortPath("/news"), label: "AIニュース一覧" },
            { href: aiPortPath("/youtube"), label: "基調講演の動画を見る" },
            { href: aiPortPath("/jobs"), label: "AIの仕事を探す" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(CRUMBS), aiPortFaqJsonLd(FAQS)]} />
    </>
  );
}
