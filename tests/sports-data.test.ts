import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { sports, getSport } from "@/sports/data/sports";
import { leagues, getLeague } from "@/sports/data/leagues";
import { teams, getTeam, venues } from "@/sports/data/teams";
import { players, getPlayer } from "@/sports/data/players";
import { matches } from "@/sports/data/matches";
import { standings } from "@/sports/data/standings";
import { news, authorsById } from "@/sports/data/news";
import { videos } from "@/sports/data/videos";
import { streamingServices, getStreaming } from "@/sports/data/streaming";
import { web3Services, fanTokens } from "@/sports/data/web3";
import { diagnoses } from "@/sports/data/diagnoses";
import { legalPages } from "@/sports/data/legal";
import { affiliateLinks, chatDocuments, faqs, resolveAffiliateUrl } from "@/sports/data/content";
import { locales, localeCodes, defaultLocaleCode } from "@/sports/i18n/locales";
import { ja, en, type Dictionary } from "@/sports/i18n/dictionary";
import { partials } from "@/sports/i18n/partials";
import { getDictionary, text } from "@/sports/i18n";
import { href, swapLocale, alternateUrls, absoluteUrl } from "@/sports/lib/url";
import { searchDocs } from "@/sports/lib/search";
import { answerQuestion } from "@/sports/lib/chat";
import { pickResult, scoreDiagnosis } from "@/sports/lib/diagnosis";
import { sitemapEntries } from "@/app/sports-sitemap.xml/route";
import {
  faqJsonLd,
  newsArticleJsonLd,
  sportsEventJsonLd,
  sportsTeamJsonLd,
  websiteJsonLd,
} from "@/sports/lib/structured-data";

const publicDir = join(process.cwd(), "public");

describe("参照整合性", () => {
  it("試合が参照する競技・リーグ・チーム・会場がすべて存在する", () => {
    for (const match of matches) {
      expect(getSport(match.sportId), match.id).toBeDefined();
      expect(getLeague(match.leagueId), match.id).toBeDefined();
      expect(getTeam(match.homeTeamId), match.id).toBeDefined();
      expect(getTeam(match.awayTeamId), match.id).toBeDefined();
      // 同一チーム同士の対戦にならないこと
      expect(match.homeTeamId, match.id).not.toBe(match.awayTeamId);
      if (match.venueId) {
        expect(
          venues.some((venue) => venue.id === match.venueId),
          match.id,
        ).toBe(true);
      }
      for (const id of match.broadcastIds) {
        expect(getStreaming(id), `${match.id} / ${id}`).toBeDefined();
      }
    }
  });

  it("チームが参照する競技・リーグ・会場が存在する", () => {
    for (const team of teams) {
      expect(getSport(team.sportId), team.id).toBeDefined();
      expect(getLeague(team.leagueId), team.id).toBeDefined();
      if (team.venueId) {
        expect(
          venues.some((venue) => venue.id === team.venueId),
          team.id,
        ).toBe(true);
      }
    }
  });

  it("順位表の行が実在するチームを指す", () => {
    for (const standing of standings) {
      expect(getLeague(standing.leagueId), standing.leagueId).toBeDefined();
      for (const row of standing.rows) {
        expect(getTeam(row.teamId), row.teamId).toBeDefined();
      }
    }
  });

  it("ニュースが参照するチーム・選手・試合・著者が存在する", () => {
    for (const article of news) {
      expect(authorsById.get(article.authorId), article.id).toBeDefined();
      if (article.supervisorId) {
        expect(authorsById.get(article.supervisorId), article.id).toBeDefined();
      }
      for (const id of article.teamIds) expect(getTeam(id), `${article.id} / ${id}`).toBeDefined();
      for (const id of article.playerIds)
        expect(getPlayer(id), `${article.id} / ${id}`).toBeDefined();
      if (article.matchId) {
        expect(
          matches.some((match) => match.id === article.matchId),
          article.id,
        ).toBe(true);
      }
    }
  });

  it("動画が参照する試合・チーム・選手が存在する", () => {
    for (const video of videos) {
      if (video.matchId) {
        expect(
          matches.some((match) => match.id === video.matchId),
          video.id,
        ).toBe(true);
      }
      for (const id of video.teamIds) expect(getTeam(id), `${video.id} / ${id}`).toBeDefined();
      for (const id of video.playerIds) expect(getPlayer(id), `${video.id} / ${id}`).toBeDefined();
    }
  });

  it("配信サービスが参照する競技・リーグが存在する", () => {
    for (const service of streamingServices) {
      for (const id of service.sportIds)
        expect(getSport(id), `${service.id} / ${id}`).toBeDefined();
      for (const id of service.leagueIds)
        expect(getLeague(id), `${service.id} / ${id}`).toBeDefined();
    }
  });

  it("診断の選択肢の加点先が、その診断の結果IDに含まれている", () => {
    for (const diagnosis of diagnoses) {
      const resultIds = new Set(diagnosis.results.map((result) => result.id));
      for (const question of diagnosis.questions) {
        for (const option of question.options) {
          for (const key of Object.keys(option.weights)) {
            expect(resultIds.has(key), `${diagnosis.slug} / ${question.id} / ${key}`).toBe(true);
          }
        }
      }
    }
  });

  it("診断結果が参照するチーム・選手・配信サービスが存在する", () => {
    for (const diagnosis of diagnoses) {
      for (const result of diagnosis.results) {
        for (const id of result.teamIds)
          expect(getTeam(id), `${diagnosis.slug} / ${id}`).toBeDefined();
        for (const id of result.playerIds)
          expect(getPlayer(id), `${diagnosis.slug} / ${id}`).toBeDefined();
        for (const id of result.streamingIds) {
          expect(getStreaming(id), `${diagnosis.slug} / ${id}`).toBeDefined();
        }
      }
    }
  });

  it("ファントークンが参照するチーム・競技が存在する", () => {
    for (const token of fanTokens) {
      expect(getSport(token.sportId), token.id).toBeDefined();
      if (token.teamId) expect(getTeam(token.teamId), token.id).toBeDefined();
    }
  });
});

describe("スラッグ", () => {
  const collections: [string, { slug: string }[]][] = [
    ["sports", sports],
    ["leagues", leagues],
    ["teams", teams],
    ["players", players],
    ["matches", matches],
    ["news", news],
    ["videos", videos],
    ["streaming", streamingServices],
    ["web3", web3Services],
    ["diagnoses", diagnoses],
    ["legal", legalPages],
  ];

  it.each(collections)("%s のスラッグが重複していない", (_name, items) => {
    const slugs = items.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(collections)("%s のスラッグがURLに使える文字だけで構成されている", (_name, items) => {
    for (const item of items) {
      expect(item.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("競技設定", () => {
  it("順位表を持つ競技には必ず列定義がある", () => {
    for (const sport of sports) {
      if (sport.standingsType === "none") continue;
      expect(sport.standingsColumns.length, sport.id).toBeGreaterThan(0);
    }
  });

  it("順位表の値が、その競技の列定義に対応している", () => {
    for (const standing of standings) {
      const league = getLeague(standing.leagueId);
      const sport = getSport(league?.sportId);
      expect(sport, standing.leagueId).toBeDefined();
      const keys = new Set(sport?.standingsColumns.map((column) => column.key));
      for (const row of standing.rows) {
        for (const key of Object.keys(row.values)) {
          expect(keys.has(key), `${standing.leagueId} / ${key}`).toBe(true);
        }
      }
    }
  });

  it("試合スタッツのキーが、その競技のスタッツ定義に含まれている", () => {
    for (const match of matches) {
      const sport = getSport(match.sportId);
      const keys = new Set(sport?.statKeys.map((item) => item.key));
      for (const entry of match.statistics ?? []) {
        expect(keys.has(entry.key), `${match.id} / ${entry.key}`).toBe(true);
      }
    }
  });

  it("21競技すべてが登録されている", () => {
    expect(sports.length).toBeGreaterThanOrEqual(21);
  });
});

describe("事実性", () => {
  it("すべての試合データに取得時刻と情報元が付いている", () => {
    for (const match of matches) {
      expect(match.stamp.fetchedAt, match.id).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(match.stamp.source.length, match.id).toBeGreaterThan(0);
    }
  });

  it("未開始の試合のスコアは 0 ではなく null である", () => {
    for (const match of matches.filter((item) => item.status === "scheduled")) {
      expect(match.homeScore, match.id).toBeNull();
      expect(match.awayScore, match.id).toBeNull();
    }
  });

  it("配信サービスに情報確認日が入っている", () => {
    for (const service of streamingServices) {
      expect(service.verifiedAt, service.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("Web3.0 サービスには必ずリスクの記載がある", () => {
    for (const service of web3Services) {
      expect(service.risks.length, service.id).toBeGreaterThan(0);
    }
  });

  it("ニュースには情報元と確度が付いている", () => {
    for (const article of news) {
      expect(article.sources.length, article.id).toBeGreaterThan(0);
      expect(["official", "report", "rumour"]).toContain(article.confidence);
    }
  });

  it("構造化データに AggregateRating / Review を出力しない", () => {
    const payloads = [
      websiteJsonLd("ja"),
      sportsEventJsonLd("ja", matches[0]),
      sportsTeamJsonLd("ja", teams[0], getSport(teams[0].sportId)),
      newsArticleJsonLd("ja", news[0]),
      faqJsonLd([{ question: "q", answer: "a" }]),
    ];
    const serialised = JSON.stringify(payloads);
    expect(serialised).not.toContain("AggregateRating");
    expect(serialised).not.toContain('"Review"');
    expect(serialised).not.toContain("ratingValue");
  });

  it("SportsEvent の eventStatus が試合状況と一致する", () => {
    const postponed = matches.find((match) => match.status === "postponed");
    expect(postponed).toBeDefined();
    if (postponed) {
      expect(sportsEventJsonLd("ja", postponed).eventStatus).toBe(
        "https://schema.org/EventPostponed",
      );
    }
  });
});

describe("多言語", () => {
  it("15言語に対応している", () => {
    expect(locales.length).toBe(15);
  });

  it("日本語が先頭にあり、アルファベット順に並べ替えられていない", () => {
    expect(locales[0].code).toBe(defaultLocaleCode);
    const sorted = [...localeCodes].sort();
    expect(localeCodes).not.toEqual(sorted);
  });

  it("すべてのロケールに国旗画像が存在する", () => {
    for (const locale of locales) {
      const path = join(publicDir, "images", "flags", `${locale.country}.webp`);
      expect(existsSync(path), `${locale.code} -> ${locale.country}.webp`).toBe(true);
    }
  });

  it("すべてのロケールに、その言語での言語名が設定されている", () => {
    for (const locale of locales) {
      expect(locale.label.trim().length, locale.code).toBeGreaterThan(0);
      expect(locale.labelJa.trim().length, locale.code).toBeGreaterThan(0);
    }
  });

  it("ja と en の辞書がすべてのキーを埋めている", () => {
    const jaKeys = Object.keys(ja).sort();
    const enKeys = Object.keys(en).sort();
    expect(jaKeys).toEqual(enKeys);
    for (const key of jaKeys) {
      expect(String(ja[key as keyof Dictionary]).length, key).toBeGreaterThan(0);
      expect(String(en[key as keyof Dictionary]).length, key).toBeGreaterThan(0);
    }
  });

  it("部分辞書のキーが Dictionary に存在するものだけである", () => {
    const valid = new Set(Object.keys(en));
    for (const [code, dictionary] of Object.entries(partials)) {
      expect(localeCodes, code).toContain(code);
      for (const key of Object.keys(dictionary)) {
        expect(valid.has(key), `${code} / ${key}`).toBe(true);
      }
    }
  });

  it("未翻訳のキーは英語にフォールバックする（空文字にならない）", () => {
    for (const code of localeCodes) {
      const dictionary = getDictionary(code);
      for (const key of Object.keys(en) as (keyof Dictionary)[]) {
        expect(dictionary[key].length, `${code} / ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("多言語テキストは英語→日本語の順にフォールバックする", () => {
    expect(text({ ja: "日本語", en: "English" }, "ko")).toBe("English");
    expect(text({ ja: "日本語", en: "" }, "ko")).toBe("");
    expect(text(undefined, "ja")).toBe("");
  });

  it("RTL 言語に rtl フラグが立っている", () => {
    expect(locales.find((locale) => locale.code === "ar")?.rtl).toBe(true);
  });
});

describe("URL / hreflang", () => {
  it("ロケール付きのパスを組み立てる", () => {
    expect(href("ja", "/")).toBe("/ja");
    expect(href("en", "/matches")).toBe("/en/matches");
    expect(href("zh-cn", "matches/a-vs-b")).toBe("/zh-cn/matches/a-vs-b");
  });

  it("言語切り替えでパスを保持する", () => {
    expect(swapLocale("/ja/matches/a-vs-b", "en")).toBe("/en/matches/a-vs-b");
    expect(swapLocale("/ja", "ko")).toBe("/ko");
    expect(swapLocale("/", "ko")).toBe("/ko");
  });

  it("hreflang に全ロケールと x-default が含まれる", () => {
    const alternates = alternateUrls("/matches");
    for (const locale of locales) {
      expect(alternates[locale.hreflang], locale.code).toBe(absoluteUrl(locale.code, "/matches"));
    }
    expect(alternates["x-default"]).toBe(absoluteUrl(defaultLocaleCode, "/matches"));
  });
});

describe("サイトマップ", () => {
  const entries = sitemapEntries();

  it("パスが重複していない", () => {
    const paths = entries.map((entry) => entry.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("主要ページと詳細ページが含まれる", () => {
    const paths = new Set(entries.map((entry) => entry.path));
    expect(paths.has("/")).toBe(true);
    expect(paths.has("/live")).toBe(true);
    expect(paths.has("/streaming")).toBe(true);
    for (const match of matches) expect(paths.has(`/matches/${match.slug}`), match.slug).toBe(true);
    for (const page of legalPages) expect(paths.has(`/legal/${page.slug}`), page.slug).toBe(true);
  });

  it("管理画面と検索結果はサイトマップに載せない", () => {
    const paths = new Set(entries.map((entry) => entry.path));
    expect(paths.has("/admin")).toBe(false);
    expect(paths.has("/search")).toBe(false);
  });
});

describe("検索", () => {
  it("正式名称・略称・英語表記・日本語表記のいずれでもチームに到達する", () => {
    for (const query of [
      "Manchester United",
      "マンU",
      "Man Utd",
      "MUFC",
      "マンチェスター・ユナイテッド",
    ]) {
      const hits = searchDocs(query, "ja");
      expect(
        hits.some((hit) => hit.href === "/teams/manchester-united"),
        query,
      ).toBe(true);
    }
  });

  it("空文字では何も返さない", () => {
    expect(searchDocs("   ", "ja")).toEqual([]);
  });

  it("競技・リーグ・選手・ニュース・用語を横断して検索する", () => {
    const types = new Set(searchDocs("s", "en").map((hit) => hit.type));
    expect(types.size).toBeGreaterThan(2);
    expect(searchDocs("xG", "ja").some((hit) => hit.type === "glossary")).toBe(true);
  });
});

describe("チャットボット", () => {
  it("勝敗を尋ねられても予言しない", () => {
    const answer = answerQuestion("この試合はどっちが勝ちますか？", "ja");
    expect(answer.document).toBeDefined();
    const body = text(answer.document?.answer, "ja");
    expect(body).toContain("予言");
    expect(body).not.toMatch(/必ず勝|絶対に当た|確実に勝/);
  });

  it("リアルタイム情報を含む回答には realtime フラグが立つ", () => {
    expect(answerQuestion("今日の試合を教えて", "ja").realtime).toBe(true);
  });

  it("該当が無ければ回答を作らず、関連ページのみを返す", () => {
    const answer = answerQuestion("zzzzqqqq", "ja");
    expect(answer.document).toBeUndefined();
  });

  it("参照文書のリンク先がサイト内パスである", () => {
    for (const document of chatDocuments) {
      for (const link of document.links) {
        expect(link.href.startsWith("/"), `${document.id} / ${link.href}`).toBe(true);
      }
    }
  });
});

describe("診断", () => {
  it("回答に応じて結果が変わる", () => {
    const diagnosis = diagnoses.find((item) => item.slug === "your-sport");
    expect(diagnosis).toBeDefined();
    if (!diagnosis) return;

    const pickAll = (optionIndex: number) =>
      Object.fromEntries(
        diagnosis.questions.map((question) => [
          question.id,
          question.options[Math.min(optionIndex, question.options.length - 1)].id,
        ]),
      );

    const first = pickResult(diagnosis, pickAll(0));
    const last = pickResult(diagnosis, pickAll(2));
    expect(first.id).not.toBe(last.id);
  });

  it("未回答でもエラーにならず、結果を1つ返す", () => {
    for (const diagnosis of diagnoses) {
      const result = pickResult(diagnosis, {});
      expect(result, diagnosis.slug).toBeDefined();
      expect(Object.values(scoreDiagnosis(diagnosis, {})).every((score) => score === 0)).toBe(true);
    }
  });

  it("仕様で求められた12種類以上の診断がある", () => {
    expect(diagnoses.length).toBeGreaterThanOrEqual(12);
  });

  it("ベッティング関連の診断には注記が付いている", () => {
    const betting = diagnoses.find((item) => item.slug === "betting-literacy");
    expect(betting?.disclaimer).toBeDefined();
  });
});

describe("収益導線と表示", () => {
  it("アフィリエイトリンクには広告表記が設定されている", () => {
    for (const link of affiliateLinks) {
      expect(link.disclosure, link.id).toBe(true);
    }
  });

  it("配信サービスの affiliateId がリンク管理に存在する", () => {
    const ids = new Set(affiliateLinks.map((link) => link.id));
    for (const service of streamingServices) {
      if (!service.affiliateId) continue;
      expect(ids.has(service.affiliateId), service.id).toBe(true);
    }
  });

  it("言語別のリンク差し替えが効く", () => {
    expect(resolveAffiliateUrl("aff-global-football", "en")).toContain("lang=en");
    expect(resolveAffiliateUrl("aff-global-football", "ja")).not.toContain("lang=en");
    expect(resolveAffiliateUrl("missing", "ja")).toBeUndefined();
  });
});

describe("法務ページ", () => {
  it("必須の固定ページが揃っている", () => {
    const slugs = new Set(legalPages.map((page) => page.slug));
    for (const required of [
      "about",
      "editorial-policy",
      "ad-policy",
      "affiliate-policy",
      "betting-policy",
      "responsible-use",
      "disclaimer",
      "privacy",
      "terms",
      "cookie",
      "copyright",
      "data-policy",
      "contact",
      "correction",
    ]) {
      expect(slugs.has(required), required).toBe(true);
    }
  });

  it("すべての法務ページに更新日と本文がある", () => {
    for (const page of legalPages) {
      expect(page.updatedAt, page.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(page.sections.length, page.slug).toBeGreaterThan(0);
    }
  });

  it("FAQ に広告表記とデータの扱いに関する項目がある", () => {
    const questions = faqs.map((faq) => faq.question.ja).join("");
    expect(questions).toContain("アフィリエイト");
    expect(questions).toContain("更新");
  });
});
