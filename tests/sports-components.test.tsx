import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());
vi.mock("next/link", async () => (await import("./helpers/next-mocks")).linkMock());
vi.mock("next/navigation", async () =>
  (await import("./helpers/next-mocks")).navigationMock("/sports-port/ja/matches"),
);

import { LocaleSwitcher } from "@/sports/components/layout/LocaleSwitcher";
import { Header } from "@/sports/components/layout/Header";
import { Footer } from "@/sports/components/layout/Footer";
import { StandingsTable } from "@/sports/components/standings/StandingsTable";
import { StreamingTable } from "@/sports/components/streaming/StreamingTable";
import { DiagnosisRunner } from "@/sports/components/diagnosis/DiagnosisRunner";
import { SportsChat } from "@/sports/components/chat/SportsChat";
import { MatchCard, Scoreboard } from "@/sports/components/match/MatchParts";
import { LiveTicker } from "@/sports/components/live/LiveTicker";

import { locales, getLocale } from "@/sports/i18n/locales";
import { getDictionary } from "@/sports/i18n";
import { standings } from "@/sports/data/standings";
import { getSport } from "@/sports/data/sports";
import { streamingServices } from "@/sports/data/streaming";
import { diagnoses } from "@/sports/data/diagnoses";
import { matches } from "@/sports/data/matches";

const ja = getLocale("ja");
const dict = getDictionary("ja");

describe("言語切り替え", () => {
  it("国旗と、その言語での言語名を必ず併記する", async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher current={ja} />);

    await user.click(screen.getByRole("button", { name: /表示言語/ }));
    const list = screen.getByRole("listbox");

    for (const locale of locales) {
      // 言語名（自称）が読める
      expect(within(list).getByText(locale.label), locale.code).toBeInTheDocument();
    }

    // 国旗画像が全言語分ある（旗だけにしない、が要件なので両方を確認します）
    const flags = within(list).getAllByRole("presentation", { hidden: true });
    expect(flags.length).toBeGreaterThanOrEqual(locales.length);
  });

  it("国旗のパスがロケールの国コードと一致する", async () => {
    const user = userEvent.setup();
    const { container } = render(<LocaleSwitcher current={ja} />);
    await user.click(screen.getByRole("button", { name: /表示言語/ }));

    const sources = Array.from(container.querySelectorAll("img")).map((img) =>
      img.getAttribute("src"),
    );
    for (const locale of locales) {
      expect(
        sources.some((src) => src?.includes(`/images/flags/${locale.country}.webp`)),
        locale.code,
      ).toBe(true);
    }
  });

  it("リンク先が現在のパスを保ったまま言語だけを差し替える", async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher current={ja} />);
    await user.click(screen.getByRole("button", { name: /表示言語/ }));

    expect(screen.getByRole("option", { name: /English/ })).toHaveAttribute(
      "href",
      "/sports-port/en/matches",
    );
    expect(screen.getByRole("option", { name: /한국어/ })).toHaveAttribute(
      "href",
      "/sports-port/ko/matches",
    );
  });

  it("言語名は機械翻訳の対象外にする", () => {
    const { container } = render(<LocaleSwitcher current={ja} />);
    expect(container.querySelector('[translate="no"]')).not.toBeNull();
  });
});

describe("ヘッダー / フッター", () => {
  it("主要ナビゲーションと検索への導線がある", () => {
    render(<Header locale={ja} />);
    const nav = screen.getAllByRole("navigation")[0];
    expect(within(nav).getByRole("link", { name: dict.navLive })).toHaveAttribute(
      "href",
      "/sports-port/ja/live",
    );
    expect(screen.getByRole("link", { name: dict.search })).toHaveAttribute(
      "href",
      "/sports-port/ja/search",
    );
  });

  it("フッターに法務ページが揃っている", () => {
    render(<Footer locale={ja} />);
    for (const label of [
      dict.footerAbout,
      dict.footerEditorial,
      dict.footerAdPolicy,
      dict.footerAffiliate,
      dict.footerBettingPolicy,
      dict.footerResponsible,
      dict.footerDisclaimer,
      dict.footerPrivacy,
      dict.footerTerms,
      dict.footerCookie,
      dict.footerCopyright,
    ]) {
      expect(screen.getByRole("link", { name: label }), label).toBeInTheDocument();
    }
  });

  it("フッターでアフィリエイト利用を明示している", () => {
    render(<Footer locale={ja} />);
    expect(screen.getByText(dict.affiliateDisclosure)).toBeInTheDocument();
  });
});

describe("順位表", () => {
  const standing = standings[0];
  const sport = getSport("football");

  it("競技設定の列がそのまま見出しになる", () => {
    if (!sport) throw new Error("sport not found");
    render(<StandingsTable standing={standing} sport={sport} locale="ja" />);
    for (const column of sport.standingsColumns) {
      expect(screen.getAllByText(column.label.ja).length, column.key).toBeGreaterThan(0);
    }
  });

  it("表とカードの表示を切り替えられる", async () => {
    if (!sport) throw new Error("sport not found");
    const user = userEvent.setup();
    render(<StandingsTable standing={standing} sport={sport} locale="ja" />);

    const cardsButton = screen.getByRole("button", { name: dict.viewAsCards });
    expect(cardsButton).toHaveAttribute("aria-pressed", "false");
    await user.click(cardsButton);
    expect(cardsButton).toHaveAttribute("aria-pressed", "true");
  });
});

describe("配信サービス比較", () => {
  it("情報確認日と注意書きを必ず表示する", () => {
    render(<StreamingTable services={streamingServices.slice(0, 3)} locale="ja" />);
    expect(screen.getByText(dict.streamingNote)).toBeInTheDocument();
    for (const service of streamingServices.slice(0, 3)) {
      expect(screen.getAllByText(service.verifiedAt).length).toBeGreaterThan(0);
    }
  });

  it('アフィリエイトリンクに rel="sponsored nofollow" と広告表記が付く', () => {
    const { container } = render(
      <StreamingTable services={streamingServices.slice(0, 3)} locale="ja" />,
    );
    const sponsored = Array.from(container.querySelectorAll('a[data-affiliate="true"]'));
    expect(sponsored.length).toBeGreaterThan(0);
    for (const link of sponsored) {
      expect(link.getAttribute("rel")).toContain("sponsored");
      expect(link.getAttribute("rel")).toContain("nofollow");
      expect(link.textContent).toContain(dict.adLabel);
    }
  });
});

describe("試合表示", () => {
  const live = matches.find((match) => match.status === "live");
  const scheduled = matches.find((match) => match.status === "scheduled");

  it("未開始の試合はスコアを 0 と表示しない", () => {
    if (!scheduled) throw new Error("no scheduled match");
    render(<MatchCard match={scheduled} locale="ja" />);
    expect(screen.queryAllByText("0")).toHaveLength(0);
  });

  it("試合中はライブ表示と経過時間を出す", () => {
    if (!live) throw new Error("no live match");
    render(<Scoreboard match={live} locale="ja" />);
    expect(screen.getByText(dict.statusLive, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(live.clock ?? "")).toBeInTheDocument();
  });
});

describe("ライブティッカー", () => {
  const item = {
    id: "m-1",
    slug: "a-vs-b",
    status: "live",
    clock: "67'",
    league: "EPL",
    home: "ARS",
    away: "LIV",
    homeScore: 2,
    awayScore: 1,
    accent: "#22d3ee",
    fetchedAt: "2026-08-04T12:39:00.000Z",
    refreshIntervalSec: 30,
  };

  it("更新間隔と最終更新時刻を表示する", () => {
    render(<LiveTicker items={[item]} locale="ja" />);
    expect(screen.getByText(/30秒更新/)).toBeInTheDocument();
    expect(screen.getByText(/最終更新/)).toBeInTheDocument();
  });

  it("試合が無いときは空表示にする", () => {
    render(<LiveTicker items={[]} locale="ja" />);
    expect(screen.getByRole("status")).toHaveTextContent(dict.noMatchesToday);
  });
});

describe("診断", () => {
  it("回答すると結果と注意書きが出る", async () => {
    const user = userEvent.setup();
    const diagnosis = diagnoses.find((item) => item.slug === "viewer-level");
    if (!diagnosis) throw new Error("diagnosis not found");

    render(<DiagnosisRunner diagnosis={diagnosis} locale="ja" />);

    for (let index = 0; index < diagnosis.questions.length; index += 1) {
      const question = diagnosis.questions[index];
      await user.click(screen.getByRole("button", { name: question.options[0].label.ja }));
    }

    expect(screen.getByText(dict.yourResult)).toBeInTheDocument();
    expect(screen.getByText(dict.diagnosisNote)).toBeInTheDocument();
  });
});

describe("AIチャットボット", () => {
  it("勝敗を尋ねられても予言せず、関連ページを案内する", async () => {
    const user = userEvent.setup();
    render(<SportsChat locale="ja" />);

    await user.click(screen.getByRole("button", { name: dict.chatOpen }));
    await user.type(screen.getByRole("textbox"), "この試合はどっちが勝ちますか？");
    await user.click(screen.getByRole("button", { name: dict.chatSend }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/予言することはできません/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/必ず勝/)).toBeNull();
  });

  it("リアルタイム情報を含む回答には取得時刻を添える", async () => {
    const user = userEvent.setup();
    render(<SportsChat locale="ja" />);

    await user.click(screen.getByRole("button", { name: dict.chatOpen }));
    await user.type(screen.getByRole("textbox"), "今日の試合を教えて");
    await user.click(screen.getByRole("button", { name: dict.chatSend }));

    expect(within(screen.getByRole("dialog")).getByText(/データ取得/)).toBeInTheDocument();
  });
});
