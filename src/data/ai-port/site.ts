/**
 * AI PORT — サイト全体の設定。
 *
 * ■ 分離前の経緯（2026-08-04）
 *   もともと焼肉 千里 のリポジトリに同居し、`/ai-port` 配下で配信していました。
 *   単独リポジトリになったため、サイト内のルートは `/` です。
 *
 * ■ 内部パスと絶対URLで、ベースパスの扱いが違います
 *   - `aiPortPath()`（`<Link href>` 用）はベースパスを**付けません**。
 *     Next.js の `basePath` が自動で前置するため、ここで付けると
 *     `/ai-port/ai-port/news` のように二重になります。
 *   - `aiPortUrl()`（canonical・OGP・sitemap 用）は**自分で付けます**。
 *     こちらは Next.js を通らない、ただの文字列連結だからです。
 *
 *   GitHub Pages では `NEXT_PUBLIC_AI_PORT_URL` に**オリジンだけ**を、
 *   `NEXT_PUBLIC_BASE_PATH` に `/ai-port` を渡します。
 *   前者にリポジトリ名まで入れると、やはり二重になります。
 */

import { basePath } from "@/lib/base-path";

/**
 * サイト内でのルート。
 * 単独リポジトリでは常に `""` です（ベースパスは Next.js が付けます）。
 */
export const AI_PORT_BASE = "";

export const aiPortName = "AI PORT";
export const aiPortNameJa = "AIポート";

export const aiPortTagline = "AIの「今」が集まる港。";

export const aiPortDescription =
  "AI PORT（AIポート）は、AIニュース・AIツール・AIエージェント・Web3の情報を1か所に集めるAIポータルメディアです。公式ソースのRSSを自動収集した最新ニュース、用途別のAIツールデータベースと比較表、無料のAI診断、サイト内を検索して答えるAIチャットを提供します。";

/** 配信オリジン（スキーム＋ホストまで）。末尾スラッシュは落とします。 */
export const aiPortOrigin = (
  process.env.NEXT_PUBLIC_AI_PORT_URL || "https://jiantailanglin266-rgb.github.io"
).replace(/\/$/, "");

/** サイトのルート絶対URL（オリジン＋ベースパス）。 */
export const aiPortBaseUrl = `${aiPortOrigin}${basePath}`;

/** サイト内パス（/tools など）を AI PORT の絶対URLへ変換します。 */
export function aiPortUrl(path = "/"): string {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  return `${aiPortBaseUrl}${clean}`;
}

/** `<Link href>` 用の内部パス。ベースパスは Next.js が付けます。 */
export function aiPortPath(path = "/"): string {
  const clean = path === "/" ? "" : path;
  return `${AI_PORT_BASE}${clean}` || "/";
}

/**
 * 運営者情報。
 * ⚠ 実在しない受賞歴・掲載実績・会員数などは絶対に書かないでください（優良誤認）。
 */
export const publisher = {
  name: aiPortName,
  /** 編集方針ページ。E-E-A-T と LLMO の両方で参照されます。 */
  editorialPolicyPath: "/about",
  contactPath: "/about#contact",
  /** アフィリエイト表示（ステマ規制・景品表示法対応） */
  disclosurePath: "/disclosure",
} as const;

/**
 * SNS。未開設のアカウントを並べると信頼を落とすため、
 * 実在するURLだけを環境変数で入れてください（未設定なら表示しません）。
 */
export const aiPortSocials = [
  { id: "x", label: "X", href: process.env.NEXT_PUBLIC_AI_PORT_X_URL ?? "" },
  { id: "youtube", label: "YouTube", href: process.env.NEXT_PUBLIC_AI_PORT_YOUTUBE_URL ?? "" },
  { id: "note", label: "note", href: process.env.NEXT_PUBLIC_AI_PORT_NOTE_URL ?? "" },
].filter((social) => social.href.length > 0);

/** 免責 — 全ページの下部に出す一文。 */
export const aiPortDisclaimer =
  "掲載している料金・機能・提供状況は変更されることがあります。ご利用前に必ず各サービスの公式サイトで最新情報をご確認ください。";
