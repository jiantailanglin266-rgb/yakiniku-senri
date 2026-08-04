import { describe, expect, it } from "vitest";
import { matchIntent, normalize } from "@/lib/chat-match";
import { chatIntents } from "@/data/chatbot";

const idFor = (input: string) => matchIntent(input, chatIntents)?.intent.id ?? null;

describe("normalize", () => {
  it("全角・大文字・空白・記号を吸収する", () => {
    expect(normalize("ＴＡＫＥ　ＯＵＴ！")).toBe("takeout");
    expect(normalize("営業時間は、何時ですか？")).toBe("営業時間は何時ですか");
  });
});

describe("matchIntent", () => {
  it("代表的な日本語の質問を正しい意図へ振り分ける", () => {
    expect(idFor("営業時間は何時までですか")).toBe("hours");
    expect(idFor("定休日を教えてください")).toBe("closed");
    expect(idFor("予約したいのですが")).toBe("reserve");
    expect(idFor("駐車場はありますか")).toBe("parking");
    expect(idFor("おすすめのメニューは？")).toBe("menu");
    expect(idFor("もみシリーズって何ですか")).toBe("momi");
    expect(idFor("テイクアウトできますか")).toBe("takeout");
    expect(idFor("お店はどこにありますか")).toBe("access");
  });

  it("英語の入力も主要な意図なら拾える", () => {
    expect(idFor("What are your opening hours?")).toBe("hours");
    expect(idFor("Is parking available?")).toBe("parking");
    expect(idFor("I want to make a reservation")).toBe("reserve");
  });

  it("表記ゆれを吸収する", () => {
    expect(idFor("よやくおねがいします")).toBe("reserve");
    expect(idFor("お持ち帰りできますか")).toBe("takeout");
    expect(idFor("ちゅうしゃじょう")).toBe(null); // ひらがなのみは未登録（想定内）
  });

  it("サイトに情報がない話題も意図としては拾う", () => {
    expect(idFor("個室はありますか")).toBe("seats");
    expect(idFor("クレジットカードは使えますか")).toBe("payment");
    expect(idFor("子連れでも大丈夫ですか")).toBe("kids");
    expect(idFor("アレルギー対応はできますか")).toBe("allergy");
    expect(idFor("コースはありますか")).toBe("course");
  });

  it("無関係な入力や空文字では null を返す", () => {
    expect(idFor("")).toBe(null);
    expect(idFor("   ")).toBe(null);
    expect(idFor("あ")).toBe(null);
    expect(idFor("今日の天気")).toBe(null);
  });

  it("未確認の話題の回答には、必ず電話番号が含まれる", () => {
    for (const id of ["seats", "payment", "kids", "allergy", "course"]) {
      const intent = chatIntents.find((i) => i.id === id)!;
      expect(intent.answer).toContain("03-3418-7496");
    }
  });

  it("すべての意図にキーワードと回答がある", () => {
    for (const intent of chatIntents) {
      expect(intent.keywords.length).toBeGreaterThan(0);
      expect(intent.answer.length).toBeGreaterThan(0);
      expect(intent.label.length).toBeGreaterThan(0);
    }
  });
});
