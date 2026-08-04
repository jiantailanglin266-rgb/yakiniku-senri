#!/usr/bin/env node
/**
 * 外部リンクの生存確認（リンク切れ検知）。
 *
 * ■ 何を見るか
 *   CRYPTO PORT が案内している取引所・ウォレット・ツール・銘柄公式サイトのURLです。
 *   管理画面の `outboundLinks()` と同じ一覧です（画面に出しているリンクと一致します）。
 *
 * ■ HEAD だけで判断しない
 *   HEAD を弾く（405 / 403 を返す）サイトが少なくありません。
 *   HEAD が失敗したら GET で再確認し、それでも駄目なときだけ「要確認」にします。
 *   HEAD の結果だけで「リンク切れ」と報告すると、生きているリンクを大量に誤検知します。
 *
 * ■ 判定を断定しない
 *   到達できなかった理由は、リンク切れ・地域制限・Bot 遮断・一時障害のいずれもあり得ます。
 *   このスクリプトは「要確認」を出すところまでで、削除は人が判断します。
 *
 * 使い方:
 *   npm run check:links
 *   npm run check:links -- --kind=exchange   # 種別を絞る
 *   npm run check:links -- --json            # 結果をJSONで出す（CI向け）
 *
 * TypeScript のデータを直接読むため、型剥がしを有効にして実行します
 * （npm script 側で指定済みです）。
 *
 * 終了コード:
 *   0 = 全件到達 / 1 = 要確認あり
 */
import process from "node:process";

const args = process.argv.slice(2);
const kindFilter = args.find((arg) => arg.startsWith("--kind="))?.slice("--kind=".length) ?? null;
const asJson = args.includes("--json");

/** 一度に投げる本数。相手側に負荷をかけないよう絞ります */
const CONCURRENCY = 6;
const TIMEOUT_MS = 15_000;

/**
 * リンク一覧の読み込み。
 *
 * データ定義（TypeScript）を直接読み、型は Node の型剥がしで落とします。
 * ビルド成果物や別の一覧に依存させないため、画面に出しているデータと常に一致します。
 * （`src/portal/lib/admin.ts` は `@/` エイリアスを使っており素の Node では解決できないため、
 *   同じ組み立てをここで行っています。追加時は両方に足してください）
 */
async function loadLinks() {
  const [exchanges, wallets, tools, coins] = await Promise.all([
    import("../src/portal/data/exchanges.ts"),
    import("../src/portal/data/wallets.ts"),
    import("../src/portal/data/tools.ts"),
    import("../src/portal/data/coins.ts"),
  ]);

  return [
    ...exchanges.exchanges.map((entry) => ({
      label: entry.name,
      url: entry.officialUrl,
      kind: "exchange",
    })),
    ...wallets.wallets.map((entry) => ({
      label: entry.name,
      url: entry.officialUrl,
      kind: "wallet",
    })),
    ...tools.tools.map((entry) => ({ label: entry.name, url: entry.officialUrl, kind: "tool" })),
    ...coins.coins.flatMap((coin) =>
      Object.entries(coin.links)
        .filter(([, url]) => Boolean(url))
        .map(([key, url]) => ({ label: `${coin.symbol} ${key}`, url, kind: "coin" })),
    ),
  ].filter((entry) => typeof entry.url === "string" && entry.url.startsWith("http"));
}

async function probe(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      // 既定の User-Agent だと Bot として弾くサイトがあるため、素性を明示します
      headers: { "user-agent": "crypto-port-linkcheck/1.0 (+site health check)" },
    });
    return { status: response.status, finalUrl: response.url };
  } catch (error) {
    return { status: 0, error: error.name === "AbortError" ? "timeout" : error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function check(entry) {
  // まず HEAD。弾かれることがあるので、失敗したら GET で確かめ直します
  let result = await probe(entry.url, "HEAD");
  if (result.status === 0 || result.status === 403 || result.status === 405) {
    result = await probe(entry.url, "GET");
  }

  const ok = result.status >= 200 && result.status < 400;
  return {
    ...entry,
    status: result.status,
    finalUrl: result.finalUrl ?? null,
    // 同じドメイン内の正規化リダイレクトは移転扱いにしません
    redirected:
      Boolean(result.finalUrl) && new URL(result.finalUrl).host !== new URL(entry.url).host,
    error: result.error ?? null,
    ok,
  };
}

/** 同時実行数を絞って順に処理します */
async function runAll(entries) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < entries.length) {
      const current = entries[index];
      index += 1;
      results.push(await check(current));
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, entries.length) }, worker));
  return results;
}

async function main() {
  let links = await loadLinks();
  if (kindFilter) links = links.filter((entry) => entry.kind === kindFilter);

  // 同じURLが複数ページから参照されていても、確認は1回で十分です
  const seen = new Set();
  const unique = links.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });

  if (unique.length === 0) {
    console.log("対象がありません。");
    return;
  }

  if (!asJson) console.log(`確認 ${unique.length} 件（同時 ${CONCURRENCY} 本）\n`);

  const results = await runAll(unique);
  results.sort((a, b) => Number(a.ok) - Number(b.ok) || a.label.localeCompare(b.label));

  const failed = results.filter((entry) => !entry.ok);
  const moved = results.filter((entry) => entry.ok && entry.redirected);

  if (asJson) {
    console.log(JSON.stringify({ checked: results.length, failed, moved, results }, null, 2));
  } else {
    for (const entry of failed) {
      const reason = entry.error ?? `HTTP ${entry.status}`;
      console.log(
        `要確認  [${entry.kind}] ${entry.label}\n        ${entry.url}\n        ${reason}`,
      );
    }
    for (const entry of moved) {
      console.log(
        `移転?   [${entry.kind}] ${entry.label}\n        ${entry.url}\n        → ${entry.finalUrl}`,
      );
    }
    console.log(`\n到達 ${results.length - failed.length} / ${results.length} 件`);
    if (moved.length > 0) console.log(`別ドメインへの転送 ${moved.length} 件`);
    if (failed.length > 0) {
      console.log(
        "\n到達できない理由は、リンク切れ・地域制限・Bot 遮断・一時障害のいずれもあり得ます。",
      );
      console.log("URLを直接開いて確認してから、データを更新してください。");
    }
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
