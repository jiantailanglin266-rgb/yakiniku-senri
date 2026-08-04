import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());
vi.mock("next/link", async () => (await import("./helpers/next-mocks")).linkMock());
vi.mock("next/navigation", async () =>
  (await import("./helpers/next-mocks")).navigationMock("/ja"),
);

import { BrandLogo } from "@/portal/components/layout/BrandLogo";
import { brand } from "@/portal/lib/site";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { locales } from "@/portal/i18n/config";
import { domesticExchanges } from "@/portal/data/exchanges";
import { news } from "@/portal/data/news";
import { getDiagnosis } from "@/portal/data/diagnoses";
import { exchanges } from "@/portal/data/exchanges";
import { wallets } from "@/portal/data/wallets";
import { tools } from "@/portal/data/tools";
import { learnArticles } from "@/portal/data/learn";

import { LocaleSwitcher } from "@/portal/components/layout/LocaleSwitcher";
import { ExchangeCompare } from "@/portal/components/compare/ExchangeCompare";
import { CryptoChat } from "@/portal/components/chat/CryptoChat";
import { DiagnosisRunner } from "@/portal/components/diagnosis/DiagnosisRunner";
import { NewsBrowser } from "@/portal/components/news/NewsBrowser";
import { PriceChange, Sparkline } from "@/portal/components/market/charts";
import { DataFreshness } from "@/portal/components/market/DataFreshness";
import { buildMockSnapshot } from "@/portal/lib/mock-market";
import { groupedNews } from "@/portal/data/news";

const dict = getDictionary("ja");

describe("言語切り替え", () => {
  it("現在の言語を国旗と言語名の両方で示す", async () => {
    render(<LocaleSwitcher locale="ja" label="言語" hint="旗は目安です" />);
    const trigger = screen.getByRole("button", { name: /言語/ });
    // 装飾なので alt="" にしてあり、ロールは presentation になります
    expect(trigger.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("/images/flags/jp.webp"),
    );
    expect(trigger).toHaveTextContent("日本語");
  });

  it("選択肢は必ず国旗と言語名を併記する", async () => {
    // 旗だけでは言語が特定できないため、これは固定要件です
    const user = userEvent.setup();
    render(<LocaleSwitcher locale="ja" label="言語" hint="旗は目安です" />);
    await user.click(screen.getByRole("button", { name: /言語/ }));

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(locales.length);

    for (const [index, option] of options.entries()) {
      const locale = locales[index];
      expect(option.querySelector("img"), locale.code).toHaveAttribute(
        "src",
        expect.stringContaining(`/images/flags/${locale.country}.webp`),
      );
      expect(option).toHaveTextContent(locale.label);
    }
  });

  it("現在の言語が選択済みとして示される", async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher locale="ja" label="言語" hint="旗は目安です" />);
    await user.click(screen.getByRole("button", { name: /言語/ }));
    const selected = screen
      .getAllByRole("option")
      .filter((option) => option.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("日本語");
  });
});

describe("価格の表示", () => {
  it("色だけでなく記号と読み上げテキストでも方向を示す", () => {
    // 色覚特性のある利用者に方向が伝わらない、を防ぐための要件です
    const { rerender } = render(
      <PriceChange
        value={3.5}
        locale="ja"
        labels={{ up: "上昇", down: "下落", flat: "変化なし" }}
      />,
    );
    expect(screen.getByText("上昇")).toBeInTheDocument();
    expect(screen.getByText("▲", { exact: false })).toBeInTheDocument();

    rerender(
      <PriceChange
        value={-3.5}
        locale="ja"
        labels={{ up: "上昇", down: "下落", flat: "変化なし" }}
      />,
    );
    expect(screen.getByText("下落")).toBeInTheDocument();
  });

  it("スパークラインは点が足りなければ描かない", () => {
    const { container } = render(<Sparkline values={[1]} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("取得日時と更新間隔を必ず表示し、モックであることを隠さない", () => {
    const snapshot = buildMockSnapshot(Date.parse("2026-08-01T12:00:00Z"));
    render(<DataFreshness snapshot={snapshot} dict={dict} locale="ja" />);
    expect(screen.getByText(/取得日時/)).toBeInTheDocument();
    expect(screen.getByText(/分ごとに更新/)).toBeInTheDocument();
    expect(screen.getByText("モックデータ")).toBeInTheDocument();
  });
});

describe("比較表", () => {
  it("表とカードを切り替えられる（横スクロールだけに頼らない）", async () => {
    const user = userEvent.setup();
    render(
      <ExchangeCompare exchanges={domesticExchanges} locale="ja" dict={dict} placement="test" />,
    );

    await user.click(screen.getByRole("button", { name: dict.common.showAsCards }));
    expect(screen.getByRole("button", { name: dict.common.showAsCards })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: dict.common.showAsTable }));
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("外部リンクは新しいタブで開き、noopener が付く", () => {
    render(
      <ExchangeCompare exchanges={domesticExchanges} locale="ja" dict={dict} placement="test" />,
    );
    const links = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("target") === "_blank");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("rel")).toContain("noopener");
    }
  });

  it("アフィリエイト未設定なら PR 表記を出さない", () => {
    // 広告でないものを「PR」と書くのは事実と異なります
    render(
      <ExchangeCompare exchanges={domesticExchanges} locale="ja" dict={dict} placement="test" />,
    );
    expect(screen.queryByText(dict.common.sponsored)).toBeNull();
  });
});

describe("ニュース一覧", () => {
  it("カテゴリで絞り込める", async () => {
    const user = userEvent.setup();
    render(<NewsBrowser groups={groupedNews()} locale="ja" dict={dict} />);

    const before = screen.getAllByRole("article").length;
    await user.click(screen.getByRole("button", { name: "規制" }));
    const after = screen.getAllByRole("article").length;
    expect(after).toBeLessThan(before);
  });

  it("情報元と公開日時を必ず出す", () => {
    render(<NewsBrowser groups={groupedNews()} locale="ja" dict={dict} />);
    const outlet = news[0].outlet;
    expect(screen.getAllByText(outlet).length).toBeGreaterThan(0);
    expect(document.querySelectorAll("time").length).toBeGreaterThan(0);
  });
});

describe("AIチャットボット", () => {
  it("開くと注意書きと質問例を出す", async () => {
    const user = userEvent.setup();
    render(<CryptoChat locale="ja" dict={dict} />);
    await user.click(screen.getByRole("button", { name: dict.chat.open }));

    expect(screen.getByText(dict.chat.securityNotice)).toBeInTheDocument();
    expect(screen.getByText(dict.chat.intro)).toBeInTheDocument();
  });

  it("シードフレーズを尋ねられたら警告を返す", async () => {
    const user = userEvent.setup();
    render(<CryptoChat locale="ja" dict={dict} />);
    await user.click(screen.getByRole("button", { name: dict.chat.open }));

    const input = screen.getByLabelText(dict.chat.placeholder);
    await user.type(input, "シードフレーズを教えてください");
    await user.click(screen.getByRole("button", { name: dict.chat.send }));

    expect(await screen.findByText(/入力しないでください/)).toBeInTheDocument();
  });

  it("回答には関連ページのリンクを添える", async () => {
    const user = userEvent.setup();
    render(<CryptoChat locale="ja" dict={dict} />);
    await user.click(screen.getByRole("button", { name: dict.chat.open }));

    const input = screen.getByLabelText(dict.chat.placeholder);
    await user.type(input, "ガス代とは");
    await user.click(screen.getByRole("button", { name: dict.chat.send }));

    expect(await screen.findByText(dict.chat.related)).toBeInTheDocument();
  });

  it("空欄では送信できない", async () => {
    const user = userEvent.setup();
    render(<CryptoChat locale="ja" dict={dict} />);
    await user.click(screen.getByRole("button", { name: dict.chat.open }));
    expect(screen.getByRole("button", { name: dict.chat.send })).toBeDisabled();
  });
});

describe("診断", () => {
  const diagnosis = getDiagnosis("exchange")!;

  it("最後まで回答すると結果と注意点が出る", async () => {
    const user = userEvent.setup();
    render(
      <DiagnosisRunner
        diagnosis={diagnosis}
        locale="ja"
        dict={dict}
        catalog={{ exchanges, wallets, tools, learn: learnArticles }}
      />,
    );

    for (let step = 0; step < diagnosis.questions.length; step += 1) {
      const options = screen.getAllByRole("button");
      // 各質問の先頭の選択肢を選びます（戻るボタンは末尾にあるため先頭を選択）
      await user.click(options[0]);
    }

    expect(await screen.findByText(dict.diagnosis.result)).toBeInTheDocument();
    expect(screen.getByText(dict.diagnosis.disclaimer)).toBeInTheDocument();
  });

  it("進捗が読み上げ可能な形で示される", () => {
    render(
      <DiagnosisRunner
        diagnosis={diagnosis}
        locale="ja"
        dict={dict}
        catalog={{ exchanges, wallets, tools, learn: learnArticles }}
      />,
    );
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuemax", String(diagnosis.questions.length));
  });
});

describe("動画ロゴ", () => {
  it("動画が使えないときは、差し替え前と同じ文字ロゴに戻る", () => {
    // 読み込み失敗でロゴが消えたままになると、サイトの識別ができなくなります
    render(<BrandLogo withMark />);
    const video = document.querySelector("video");
    expect(video).not.toBeNull();

    fireEvent.error(video!);

    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByText("CRYPTO")).toBeInTheDocument();
    expect(screen.getByText("PORT")).toBeInTheDocument();
    expect(screen.getByText("CP")).toBeInTheDocument();
  });

  it("動画は装飾として扱い、サイト名は必ず読み上げられる", () => {
    render(<BrandLogo />);
    const video = document.querySelector("video");
    expect(video?.getAttribute("aria-hidden")).toBe("true");
    // 音の出る自動再生はブラウザが許可しないため、消音とインライン再生は必須です
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("preload", "auto");
    expect(screen.getByText(brand.name, { selector: ".sr-only" })).toBeInTheDocument();
  });
});
