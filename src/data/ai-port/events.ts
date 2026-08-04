/**
 * AI PORT — AIイベント。
 *
 * ⚠⚠ 日付は書きません。
 *   開催日は毎年変わり、直前に変更されることもあります。
 *   古い日付を載せると来場者に実害が出るため、このサイトでは
 *   「毎年おおよそいつ頃か」という季節の目安だけを持ち、
 *   確定日程は必ず公式サイトへ送ります。
 *
 * ⚠ ここに載せてよいのは「毎年継続して開催されている公式イベント」だけです。
 *   単発イベント・未確認のセミナーは載せないでください。
 */

export type EventKind = "conference" | "keynote" | "expo" | "developer";

export type AiEvent = {
  id: string;
  name: string;
  organizer: string;
  /** 開催時期の目安（例: 毎年3月ごろ） */
  season: string;
  kind: EventKind;
  /** オンライン視聴できるか */
  online: boolean;
  region: string;
  summary: string;
  /** 公式サイト（日程はここで確認してもらいます） */
  url: string;
};

export const eventKindLabel: Record<EventKind, string> = {
  conference: "カンファレンス",
  keynote: "基調講演",
  expo: "展示会",
  developer: "開発者向け",
};

export const aiEvents: AiEvent[] = [
  {
    id: "gtc",
    name: "NVIDIA GTC",
    organizer: "NVIDIA",
    season: "毎年3月ごろ",
    kind: "conference",
    online: true,
    region: "米国／オンライン",
    summary: "GPU・AIインフラの発表が集中する開発者会議。基調講演はオンラインで無料視聴できます。",
    url: "https://www.nvidia.com/gtc/",
  },
  {
    id: "google-io",
    name: "Google I/O",
    organizer: "Google",
    season: "毎年5月ごろ",
    kind: "developer",
    online: true,
    region: "米国／オンライン",
    summary: "Gemini をはじめとする Google の AI 製品が発表される開発者イベント。",
    url: "https://io.google/",
  },
  {
    id: "ms-build",
    name: "Microsoft Build",
    organizer: "Microsoft",
    season: "毎年5月ごろ",
    kind: "developer",
    online: true,
    region: "米国／オンライン",
    summary: "Copilot と Azure AI の新機能が公開される開発者会議。",
    url: "https://build.microsoft.com/",
  },
  {
    id: "wwdc",
    name: "WWDC",
    organizer: "Apple",
    season: "毎年6月ごろ",
    kind: "developer",
    online: true,
    region: "米国／オンライン",
    summary: "OS に組み込まれる AI 機能の方向性が示される、Apple の開発者会議。",
    url: "https://developer.apple.com/wwdc/",
  },
  {
    id: "reinvent",
    name: "AWS re:Invent",
    organizer: "Amazon Web Services",
    season: "毎年11〜12月ごろ",
    kind: "conference",
    online: true,
    region: "米国／オンライン",
    summary: "クラウド基盤側から見た生成AIの実装・運用に関する発表が中心です。",
    url: "https://reinvent.awsevents.com/",
  },
  {
    id: "ces",
    name: "CES",
    organizer: "CTA",
    season: "毎年1月ごろ",
    kind: "expo",
    online: false,
    region: "米国",
    summary: "AIを載せたハードウェア製品が一斉に披露される、世界最大級の技術見本市。",
    url: "https://www.ces.tech/",
  },
  {
    id: "neurips",
    name: "NeurIPS",
    organizer: "NeurIPS Foundation",
    season: "毎年12月ごろ",
    kind: "conference",
    online: false,
    region: "開催地は年により変動",
    summary: "機械学習分野の主要な国際学会。論文は会期前後に公開されます。",
    url: "https://neurips.cc/",
  },
  {
    id: "ai-expo-japan",
    name: "AI・人工知能EXPO",
    organizer: "RX Japan",
    season: "毎年春・秋ごろ",
    kind: "expo",
    online: false,
    region: "日本（東京・大阪）",
    summary: "国内のAI関連サービスが集まる展示会。導入検討中の企業向けの商談が中心です。",
    url: "https://www.nextech-week.jp/",
  },
];
