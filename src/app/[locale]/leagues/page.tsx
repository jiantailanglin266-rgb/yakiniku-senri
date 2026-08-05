import type { Metadata } from "next";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { sports } from "@/sports/data/sports";
import { leagues, leaguesBySport } from "@/sports/data/leagues";

import { LeagueCard, SportCard } from "@/sports/components/cards/Cards";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, itemListJsonLd } from "@/sports/lib/structured-data";
import { text } from "@/sports/i18n";

export function generateStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const info = findLocale(locale);
  if (!info) return {};
  const dict = getDictionary(info.code);
  return sportsMetadata({
    locale: info.code,
    path: "/leagues",
    title: `${dict.navLeagues} / ${dict.sectionSports}`,
    description:
      info.code === "ja"
        ? "対応する競技とリーグ・大会の一覧です。競技ごとに順位表の形式・スタッツ項目・試合形式が切り替わります。"
        : "Every sport and competition we cover. Standings format, stats and match structure follow each sport's configuration.",
  });
}

export default async function LeaguesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navLeagues, path: "/leagues" },
  ];

  const withLeagues = sports.filter((sport) => leaguesBySport(sport.id).length > 0);
  const withoutLeagues = sports.filter((sport) => leaguesBySport(sport.id).length === 0);

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">LEAGUES & SPORTS</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.navLeagues}</h1>
        <p className="text-ink-dim mt-3 max-w-2xl text-sm">
          {locale === "ja"
            ? "競技・リーグはデータ側の設定だけで追加できます。順位表の列や試合スタッツも、競技ごとの定義に従って自動的に切り替わります。"
            : "Sports and leagues are pure data. Standings columns and match stats follow each sport's own definition."}
        </p>
      </header>

      {withLeagues.map((sport) => {
        const list = leaguesBySport(sport.id);
        return (
          <section key={sport.id} aria-labelledby={`lg-${sport.id}`} className="mb-12">
            <SectionHeading
              id={`lg-${sport.id}`}
              eyebrow={sport.glyph}
              title={t(sport.name)}
              description={t(sport.primer)}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((league) => (
                <LeagueCard key={league.id} league={league} locale={locale} />
              ))}
            </div>
          </section>
        );
      })}

      <section aria-labelledby="lg-other" className="mb-12">
        <SectionHeading
          id="lg-other"
          eyebrow="SPORTS"
          title={dict.sectionSports}
          description={
            locale === "ja"
              ? "以下の競技は対応済みですが、掲載するリーグ・大会をまだ登録していません。"
              : "These sports are supported but do not have competitions registered yet."
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {withoutLeagues.map((sport) => (
            <SportCard key={sport.id} sport={sport} locale={locale} />
          ))}
        </div>
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            leagues.map((league) => ({
              name: text(league.name, locale),
              path: `/leagues/${league.slug}`,
            })),
          ),
        ]}
      />
    </>
  );
}
