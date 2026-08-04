import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findLocale, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { sports, getSportBySlug } from "@/sports/data/sports";
import { leaguesBySport } from "@/sports/data/leagues";
import { matchesBySport } from "@/sports/data/matches";
import { playersBySport } from "@/sports/data/players";
import { newsBySport } from "@/sports/data/news";
import { streamingForSport } from "@/sports/data/streaming";

import { MatchCard } from "@/sports/components/match/MatchParts";
import { LeagueCard, NewsCard, PlayerCard } from "@/sports/components/cards/Cards";
import { WatchOptions } from "@/sports/components/streaming/StreamingTable";
import { Badge, Breadcrumbs, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, howToJsonLd } from "@/sports/lib/structured-data";
import { MediaSlot } from "@/media/components";
import { pageKey } from "@/media/data/usages";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) => sports.map((sport) => ({ locale, slug: sport.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const sport = getSportBySlug(slug);
  if (!info || !sport) return {};
  return sportsMetadata({
    locale: info.code,
    path: `/sports/${sport.slug}`,
    title: text(sport.name, info.code),
    description: `${text(sport.primer, info.code)}`,
  });
}

export default async function SportDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!findLocale(raw)) notFound();
  const sport = getSportBySlug(slug);
  if (!sport) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const leagues = leaguesBySport(sport.id);
  const matches = matchesBySport(sport.id);
  const players = playersBySport(sport.id);
  const news = newsBySport(sport.id);
  const services = streamingForSport(sport.id);

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navLeagues, path: "/leagues" },
    { label: t(sport.name), path: `/sports/${sport.slug}` },
  ];

  const periodLabels: Record<string, { ja: string; en: string }> = {
    half: { ja: "ハーフ", en: "Halves" },
    quarter: { ja: "クォーター／ピリオド", en: "Quarters / periods" },
    set: { ja: "セット", en: "Sets" },
    inning: { ja: "イニング", en: "Innings" },
    round: { ja: "ラウンド", en: "Rounds" },
    race: { ja: "レース", en: "Race" },
    hole: { ja: "ラウンド（ホール）", en: "Rounds (holes)" },
    map: { ja: "マップ", en: "Maps" },
  };

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      {/*
        ライセンス確認済みの画像があればヒーローに使い、無ければ装飾表現にします。
        画像が入った場合もクレジットは MediaSlot の内部で必ず表示されます。
      */}
      <header className="border-edge relative isolate mb-10 overflow-hidden rounded-2xl border">
        {/*
          背景側。前面の見出しは後続の要素なので、そのまま上に重なります。
          高さだけを指定すると比率から幅が逆算されて横幅が足りなくなるため、
          幅と高さの両方をここで固定します。
        */}
        <div className="absolute inset-0 [&_figure]:size-full [&_figure>div]:size-full [&>div]:size-full">
          <MediaSlot
            pageKey={pageKey("sportsport", "sport", sport.slug)}
            slot="hero"
            locale={locale}
            theme="neutral"
            seed={sport.statKeys.length + sport.periodCount}
            sizes="100vw"
            showCaption={false}
            className="size-full"
          />
        </div>
        {/*
          文字を読める濃さは確保しつつ、右側は背景が見える濃度にしています。
          全面を暗くすると、画像を入れても入れなくても同じ見た目になってしまいます。
        */}
        <div className="from-void via-void/75 relative min-h-56 bg-linear-to-r to-transparent px-5 py-12 sm:min-h-64 sm:px-8 sm:py-16">
          <p className="sp-eyebrow mb-2">SPORT</p>
          <h1 className="text-ink flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
            <span aria-hidden="true">{sport.glyph}</span>
            {t(sport.name)}
          </h1>
          <p className="text-ink-dim mt-3 max-w-2xl text-sm leading-relaxed">{t(sport.primer)}</p>
        </div>
      </header>

      {/* 競技設定（この競技の表示ルール） */}
      <section aria-labelledby="sp-config" className="mb-12">
        <SectionHeading
          id="sp-config"
          eyebrow="FORMAT"
          title={locale === "ja" ? "この競技の表示ルール" : "How we display this sport"}
          description={
            locale === "ja"
              ? "試合の区切り方・順位表の列・スタッツ項目は競技ごとの設定に従います。"
              : "Periods, standings columns and stats follow this sport's configuration."
          }
        />
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sp-solid p-4">
            <dt className="sp-eyebrow mb-1">{locale === "ja" ? "試合の区切り" : "Periods"}</dt>
            <dd className="text-ink text-sm">
              {text(periodLabels[sport.periodType], locale)} × {sport.periodCount}
            </dd>
          </div>
          <div className="sp-solid p-4">
            <dt className="sp-eyebrow mb-1">{locale === "ja" ? "引き分け" : "Draws"}</dt>
            <dd className="text-ink text-sm">
              {sport.hasDraw ? (locale === "ja" ? "あり" : "Yes") : locale === "ja" ? "なし" : "No"}
            </dd>
          </div>
          <div className="sp-solid p-4">
            <dt className="sp-eyebrow mb-1">{locale === "ja" ? "順位表の形式" : "Standings"}</dt>
            <dd className="text-ink text-sm">{sport.standingsType}</dd>
          </div>
          <div className="sp-solid p-4">
            <dt className="sp-eyebrow mb-1">{locale === "ja" ? "スタッツ項目" : "Stat keys"}</dt>
            <dd className="text-ink text-sm">{sport.statKeys.length}</dd>
          </div>
        </dl>
        {sport.statKeys.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {sport.statKeys.map((key) => (
              <li key={key.key}>
                <Badge>{t(key.label)}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {leagues.length > 0 ? (
        <section aria-labelledby="sp-leagues" className="mb-12">
          <SectionHeading id="sp-leagues" eyebrow="LEAGUES" title={dict.navLeagues} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <LeagueCard key={league.id} league={league} locale={locale} />
            ))}
          </div>
        </section>
      ) : (
        <p className="sp-solid text-ink-dim mb-12 p-6 text-sm">
          {locale === "ja"
            ? "この競技のリーグ・大会はまだ登録していません。掲載できる情報が揃い次第、追加します。"
            : "No competitions registered for this sport yet. We will add them once we can source reliable data."}
        </p>
      )}

      {matches.length > 0 ? (
        <section aria-labelledby="sp-matches" className="mb-12">
          <SectionHeading id="sp-matches" eyebrow="MATCHES" title={dict.navMatches} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {players.length > 0 ? (
        <section aria-labelledby="sp-players" className="mb-12">
          <SectionHeading id="sp-players" eyebrow="PLAYERS" title={dict.sectionPlayerRanking} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {services.length > 0 ? (
        <section aria-labelledby="sp-watch" className="mb-12">
          <SectionHeading id="sp-watch" eyebrow="WATCH" title={dict.whereToWatch} />
          <WatchOptions services={services} locale={locale} placement="sport-detail" />
        </section>
      ) : null}

      {news.length > 0 ? (
        <section aria-labelledby="sp-news" className="mb-12">
          <SectionHeading id="sp-news" eyebrow="NEWS" title={dict.sectionNews} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((article) => (
              <NewsCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          howToJsonLd(
            locale === "ja"
              ? `${t(sport.name)}の観戦をはじめる`
              : `Start watching ${t(sport.name)}`,
            [
              {
                name: locale === "ja" ? "ルールの要点を知る" : "Learn the basics",
                text: t(sport.primer),
              },
              {
                name: locale === "ja" ? "リーグを選ぶ" : "Pick a competition",
                text:
                  leagues.length > 0
                    ? leagues.map((league) => t(league.name)).join(" / ")
                    : locale === "ja"
                      ? "掲載中のリーグはまだありません。"
                      : "No competitions listed yet.",
              },
              {
                name: locale === "ja" ? "視聴方法を決める" : "Choose how to watch",
                text:
                  services.length > 0
                    ? services.map((service) => service.name).join(" / ")
                    : locale === "ja"
                      ? "配信情報は確認できていません。"
                      : "No broadcaster confirmed.",
              },
            ],
          ),
        ]}
      />
    </>
  );
}
