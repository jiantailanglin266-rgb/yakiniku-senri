import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  PlayCircle,
} from "lucide-react";
import { Reveal } from "@/components/ai-port/effects/Reveal";
import {
  Badge,
  Disclaimer,
  GhostLink,
  GlassCard,
  GradientText,
  PrimaryLink,
  SectionHeading,
} from "@/components/ai-port/ui/Primitives";
import { getArticles } from "@/data/ai-port/articles";
import { aiRoles, jobBoards, schools } from "@/data/ai-port/careers";
import { diagnoses } from "@/data/ai-port/diagnosis";
import { aiEvents, eventKindLabel } from "@/data/ai-port/events";
import { siteFaqs } from "@/data/ai-port/faq";
import { aiPortPath } from "@/data/ai-port/site";
import { accentClass, accentText, topicGroups, topics } from "@/data/ai-port/taxonomy";
import type { YoutubeVideo } from "@/lib/ai-port/youtube";
import { cn } from "@/lib/utils";

/** セクションの外枠。すべて同じ余白・最大幅にそろえます。 */
export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:py-24", className)}>
      {children}
    </section>
  );
}

/* ============================================================
   ⑤ YouTube
   ============================================================ */

export function YoutubeSection({ videos }: { videos: YoutubeVideo[] }) {
  return (
    <Section id="youtube">
      <SectionHeading
        eyebrow="Video"
        title={
          <>
            AI公式チャンネルの<GradientText>最新動画</GradientText>
          </>
        }
        description="各社の公式YouTubeチャンネルの配信を自動で収集しています。見出しをクリックするとYouTubeで再生されます。"
        action={{ href: aiPortPath("/youtube"), label: "動画をもっと見る" }}
      />

      {videos.length === 0 ? (
        <GlassCard className="mt-10 px-6 py-10 text-center">
          <p className="text-ai-mist text-[0.9rem]">動画を取得できませんでした。</p>
          <p className="text-ai-dim mt-2.5 text-[0.78rem] leading-[1.9]">
            YouTubeの配信フィードに一時的に接続できていない可能性があります。
          </p>
        </GlassCard>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {videos.slice(0, 8).map((video, index) => (
            <Reveal key={video.id} as="li" delay={index * 60}>
              <article className="ai-glass ai-glass-rim group relative h-full overflow-hidden rounded-2xl">
                <div className="relative aspect-video overflow-hidden bg-white/5">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt=""
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : null}
                  <span className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <PlayCircle aria-hidden="true" className="text-ai-white size-11" />
                  </span>
                </div>

                <div className="p-4">
                  <p className="text-ai-dim text-[0.66rem]" translate="no">
                    {video.channelName}
                  </p>
                  <h3 className="text-ai-white mt-1.5 line-clamp-2 text-[0.86rem] leading-[1.6]">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group-hover:text-ai-cyan transition-colors after:absolute after:inset-0"
                    >
                      {video.title}
                    </a>
                  </h3>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ============================================================
   ⑥ AIイベント
   ============================================================ */

export function EventsSection() {
  return (
    <Section id="events">
      <SectionHeading
        eyebrow="Events"
        title={
          <>
            毎年開催される<GradientText>AIイベント</GradientText>
          </>
        }
        description="毎年継続して開催されている公式イベントだけを掲載しています。開催日は年ごとに変わるため、確定日程は各公式サイトでご確認ください。"
        action={{ href: aiPortPath("/events"), label: "イベント一覧" }}
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {aiEvents.slice(0, 4).map((event, index) => (
          <Reveal key={event.id} as="li" delay={index * 70}>
            <GlassCard className="group relative h-full p-5">
              <div className="flex items-start justify-between gap-3">
                <Badge accent={event.online ? "mint" : "amber"}>{eventKindLabel[event.kind]}</Badge>
                <CalendarDays aria-hidden="true" className="text-ai-dim size-4 shrink-0" />
              </div>

              <h3 className="text-ai-white mt-4 text-[1rem]" translate="no">
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group-hover:text-ai-cyan transition-colors after:absolute after:inset-0"
                >
                  {event.name}
                </a>
              </h3>

              <p className="text-ai-cyan mt-1.5 text-[0.76rem]">{event.season}</p>
              <p className="text-ai-haze mt-3 line-clamp-3 text-[0.8rem] leading-[1.85]">
                {event.summary}
              </p>
              <p className="text-ai-dim mt-4 flex items-center gap-1.5 text-[0.7rem]">
                {event.region}
                <ArrowUpRight aria-hidden="true" className="size-3" />
              </p>
            </GlassCard>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* ============================================================
   ⑦⑧ AI求人・AIスクール
   ============================================================ */

export function CareersSection() {
  return (
    <Section id="careers">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Careers"
            title={
              <>
                AIの<GradientText>仕事</GradientText>を探す
              </>
            }
            description="求人票そのものは掲載していません。職種ごとに何が求められるかと、実際に募集が出ている場所をまとめています。"
            action={{ href: aiPortPath("/jobs"), label: "職種ガイド" }}
          />

          <ul className="mt-8 grid gap-3">
            {aiRoles.slice(0, 3).map((role, index) => (
              <Reveal key={role.id} as="li" delay={index * 70}>
                <GlassCard className="p-5">
                  <div className="flex items-start gap-3">
                    <Briefcase aria-hidden="true" className="text-ai-cyan mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-ai-white text-[0.92rem]">{role.name}</h3>
                      <p className="text-ai-haze mt-1.5 line-clamp-2 text-[0.79rem] leading-[1.85]">
                        {role.summary}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </ul>

          <p className="text-ai-dim mt-4 text-[0.72rem]">
            募集を探す場所：
            {jobBoards.slice(0, 4).map((board, index) => (
              <span key={board.id}>
                {index > 0 ? "・" : " "}
                <a
                  href={board.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ai-mist hover:text-ai-cyan underline underline-offset-4 transition-colors"
                >
                  {board.name}
                </a>
              </span>
            ))}
          </p>
        </div>

        <div>
          <SectionHeading
            eyebrow="Learn"
            title={
              <>
                AIを<GradientText>学ぶ</GradientText>
              </>
            }
            description="まずは無料で確実に学べる公式リソースを掲載しています。有料スクールは、料金と返金条件を確認できたものだけを追加します。"
            action={{ href: aiPortPath("/schools"), label: "学習リソース" }}
          />

          <ul className="mt-8 grid gap-3">
            {schools.slice(0, 3).map((school, index) => (
              <Reveal key={school.id} as="li" delay={index * 70}>
                <GlassCard className="group relative p-5">
                  <div className="flex items-start gap-3">
                    <GraduationCap
                      aria-hidden="true"
                      className="text-ai-violet mt-0.5 size-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-ai-white text-[0.92rem]" translate="no">
                        <a
                          href={school.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group-hover:text-ai-cyan transition-colors after:absolute after:inset-0"
                        >
                          {school.name}
                        </a>
                      </h3>
                      <p className="text-ai-haze mt-1.5 line-clamp-2 text-[0.79rem] leading-[1.85]">
                        {school.summary}
                      </p>
                    </div>
                    {school.free ? <Badge accent="mint">無料</Badge> : null}
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
   ⑨ AI診断
   ============================================================ */

export function DiagnosisSection() {
  return (
    <Section id="diagnosis">
      <SectionHeading
        eyebrow="Diagnosis"
        title={
          <>
            1分でわかる<GradientText>AI診断</GradientText>
          </>
        }
        description="登録不要・無料。回答はブラウザ内だけで処理し、サーバーへは送信していません。結果では次にやることまで示します。"
        action={{ href: aiPortPath("/diagnosis"), label: "診断一覧" }}
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {diagnoses.map((diagnosis, index) => (
          <Reveal key={diagnosis.slug} as="li" delay={index * 60}>
            <Link
              href={aiPortPath(`/diagnosis/${diagnosis.slug}`)}
              className="ai-glass ai-glass-rim group block h-full rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-0.5"
            >
              <span
                className={cn(
                  "font-ai-mono inline-block bg-gradient-to-r bg-clip-text text-[0.62rem] tracking-[0.2em] text-transparent uppercase",
                  accentClass[diagnosis.accent],
                )}
              >
                約{diagnosis.minutes}分 / 全{diagnosis.questions.length}問
              </span>

              <h3 className="text-ai-white group-hover:text-ai-cyan mt-3 text-[1.05rem] transition-colors">
                {diagnosis.title}
              </h3>
              <p className="text-ai-haze mt-2.5 text-[0.82rem] leading-[1.9]">{diagnosis.lead}</p>

              <span className="text-ai-cyan mt-5 inline-flex items-center gap-1.5 text-[0.78rem]">
                診断をはじめる
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* ============================================================
   ⑩ AIチャット
   ============================================================ */

export function ChatSection() {
  return (
    <Section id="chat">
      <GlassCard className="relative overflow-hidden p-8 sm:p-12">
        <div
          aria-hidden="true"
          className="from-ai-cyan/16 pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-gradient-to-br to-transparent blur-3xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="font-ai-mono text-ai-haze flex items-center gap-2 text-[0.64rem] tracking-[0.24em] uppercase">
              <MessageSquare aria-hidden="true" className="size-3.5" />
              AI Chat
            </p>

            <h2 className="mt-4 text-[1.5rem] leading-[1.35] sm:text-[1.9rem]">
              サイト内を検索して答える
              <br />
              <GradientText>AIチャット</GradientText>
            </h2>

            <p className="text-ai-mist mt-4 max-w-2xl text-[0.88rem] leading-[2]">
              AI PORT に掲載しているツール情報・解説記事・診断・よくある質問を検索し、
              その内容にもとづいて回答します。サイトに情報がない質問には、その旨をお答えします。
              OpenAI / Claude / Gemini / OpenRouter を切り替えて利用できます。
            </p>

            <p className="text-ai-dim mt-4 text-[0.74rem] leading-[1.9]">
              ※ 生成AIの回答には誤りが含まれることがあります。重要な判断の前に、
              リンク先の一次情報を必ずご確認ください。
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryLink href={aiPortPath("/chat")}>AIチャットを開く</PrimaryLink>
              <GhostLink href={aiPortPath("/search")}>キーワードで検索</GhostLink>
            </div>
          </div>

          {/* 会話のイメージ（静的な例示。実際の回答ではありません） */}
          <div className="ai-neo w-full max-w-sm rounded-2xl p-5 lg:w-80">
            <p className="text-ai-dim font-ai-mono text-[0.6rem] tracking-[0.18em]">EXAMPLE</p>
            <div className="mt-4 space-y-3">
              <p className="text-ai-white ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-white/10 px-3.5 py-2.5 text-[0.78rem]">
                無料で使える画像生成AIは？
              </p>
              <p className="text-ai-mist border-ai-cyan/25 max-w-[92%] rounded-2xl rounded-bl-sm border bg-white/[0.04] px-3.5 py-2.5 text-[0.78rem] leading-[1.8]">
                サイト内では Stable Diffusion / FLUX / Adobe Firefly
                に無料枠の記載があります。料金は変動するため、公式サイトで最新をご確認ください。
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </Section>
  );
}

/* ============================================================
   ⑪ 編集部が選ぶ記事
   ============================================================ */

export function GuidesSection() {
  const articles = getArticles();

  return (
    <Section id="guides">
      <SectionHeading
        eyebrow="Guides"
        title={
          <>
            編集部の<GradientText>解説記事</GradientText>
          </>
        }
        // ⚠ PVを取得していないため「人気記事」とは表示しません（事実でない見出しは付けない）
        description="AI PORT 編集部が書いた一次コンテンツです。更新日を明記し、確認できた事実だけを載せています。"
        action={{ href: aiPortPath("/guides"), label: "記事一覧" }}
      />

      <ul className="mt-10 grid gap-4 lg:grid-cols-3">
        {articles.slice(0, 3).map((article, index) => (
          <Reveal key={article.slug} as="li" delay={index * 70}>
            <article className="ai-glass ai-glass-rim group relative flex h-full flex-col rounded-2xl p-6">
              <p className="text-ai-dim flex items-center gap-2.5 text-[0.68rem]">
                <time dateTime={article.updated} translate="no">
                  {article.updated} 更新
                </time>
                <span aria-hidden="true">/</span>
                <span translate="no">約{article.minutes}分</span>
              </p>

              <h3 className="text-ai-white mt-3 text-[1.02rem] leading-[1.55]">
                <Link
                  href={aiPortPath(`/guides/${article.slug}`)}
                  className="group-hover:text-ai-cyan transition-colors after:absolute after:inset-0"
                >
                  {article.title}
                </Link>
              </h3>

              <p className="text-ai-haze mt-3 line-clamp-3 text-[0.82rem] leading-[1.9]">
                {article.lead}
              </p>

              <ul className="mt-auto space-y-1.5 pt-5">
                {article.keyPoints.slice(0, 2).map((point) => (
                  <li key={point} className="text-ai-mist flex gap-2 text-[0.76rem] leading-[1.7]">
                    <span aria-hidden="true" className="text-ai-cyan">
                      ―
                    </span>
                    <span className="line-clamp-1">{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* ============================================================
   ⑫ カテゴリー一覧
   ============================================================ */

export function TopicsSection() {
  return (
    <Section id="topics">
      <SectionHeading
        eyebrow="Topics"
        title={
          <>
            分野から<GradientText>探す</GradientText>
          </>
        }
        description="AIの基礎から業界別の活用、Web3まで。各ハブには最新ニュース・関連ツール・想定される質問への回答をまとめています。"
        action={{ href: aiPortPath("/topics"), label: "カテゴリー一覧" }}
      />

      <div className="mt-10 space-y-8">
        {topicGroups.map((group) => (
          <div key={group.id}>
            <h3 className="text-ai-haze text-[0.82rem]">
              {group.label}
              <span className="text-ai-dim ml-2 text-[0.72rem]">{group.description}</span>
            </h3>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topics
                .filter((topic) => topic.group === group.id)
                .map((topic, index) => (
                  <Reveal key={topic.slug} as="li" delay={index * 40}>
                    <Link
                      href={aiPortPath(`/topics/${topic.slug}`)}
                      className="ai-glass ai-glass-rim group block h-full rounded-xl p-4 transition-transform duration-500 hover:-translate-y-0.5"
                    >
                      <span
                        className={cn(
                          "font-ai-mono text-[0.58rem] tracking-[0.2em]",
                          accentText[topic.accent],
                        )}
                      >
                        {topic.nameEn}
                      </span>
                      <span className="text-ai-white group-hover:text-ai-cyan mt-1.5 block text-[0.92rem] transition-colors">
                        {topic.name}
                      </span>
                      <span className="text-ai-haze mt-1.5 line-clamp-2 block text-[0.74rem] leading-[1.7]">
                        {topic.summary}
                      </span>
                    </Link>
                  </Reveal>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================
   FAQ（AEO用。画面に出している内容だけを構造化データにします）
   ============================================================ */

export function FaqSection() {
  return (
    <Section id="faq">
      <SectionHeading
        eyebrow="FAQ"
        title={
          <>
            よくある<GradientText>ご質問</GradientText>
          </>
        }
      />

      <ul className="mt-10 grid gap-3 lg:grid-cols-2">
        {siteFaqs.map((faq, index) => (
          <Reveal key={faq.id} as="li" delay={index * 40}>
            <GlassCard className="h-full p-5">
              <h3 className="text-ai-white flex gap-2.5 text-[0.9rem] leading-[1.7]">
                <span aria-hidden="true" className="text-ai-cyan font-ai-mono shrink-0">
                  Q.
                </span>
                {faq.q}
              </h3>
              <p className="text-ai-haze mt-3 flex gap-2.5 text-[0.82rem] leading-[1.95]">
                <span aria-hidden="true" className="text-ai-violet font-ai-mono shrink-0">
                  A.
                </span>
                <span>
                  {faq.a}
                  {faq.href ? (
                    <>
                      {" "}
                      <Link
                        href={aiPortPath(faq.href)}
                        className="text-ai-cyan underline underline-offset-4"
                      >
                        詳しく見る
                      </Link>
                    </>
                  ) : null}
                </span>
              </p>
            </GlassCard>
          </Reveal>
        ))}
      </ul>

      <Disclaimer>
        AI PORT
        は各AIサービスの提供元ではありません。掲載情報は公開情報にもとづく編集部の整理であり、
        提供元の公式見解ではありません。ご利用条件は各サービスの公式サイトをご確認ください。
      </Disclaimer>
    </Section>
  );
}
