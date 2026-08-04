/**
 * Verify the mail configuration before customers depend on it.
 *
 *   npm run mail:check                        # connect and authenticate only
 *   npm run mail:check -- you@example.com     # also send one test message
 *
 * Reads `process.env` directly rather than `src/config/env.ts`, because that
 * module is marked server-only and cannot be imported from a plain script.
 */

import { mailConfigFromEnv, sendMail, verifyMail } from "../src/server/notifications/mail";

async function main(): Promise<void> {
  const config = mailConfigFromEnv();

  console.log(`MAIL_TRANSPORT = ${config.transport}`);

  if (config.transport !== "smtp") {
    console.log("");
    console.log("⚠ このトランスポートは実際にはメールを送信しません。");
    console.log("  console → ログに出力するだけ");
    console.log("  file    → .mailbox/ に書き出すだけ");
    console.log("");
    console.log("顧客に予約確認とリマインドを届けるには MAIL_TRANSPORT=smtp が必要です。");
    return;
  }

  console.log(`SMTP_HOST      = ${config.smtpHost || "(未設定)"}`);
  console.log(`SMTP_PORT      = ${config.smtpPort}`);
  console.log(`SMTP_USER      = ${config.smtpUser ? "(設定済み)" : "(未設定)"}`);
  console.log(`MAIL_FROM      = ${config.from}`);
  console.log("");

  const result = await verifyMail(config);
  if (!result.ok) {
    console.error("✗ SMTP への接続・認証に失敗しました");
    console.error(`  ${result.error}`);
    console.error("");
    console.error("よくある原因:");
    console.error("  - SMTP_USER / SMTP_PASSWORD が違う（多くの事業者は API キーを使います）");
    console.error("  - ポートが違う（465 は暗黙TLS、587 は STARTTLS）");
    console.error("  - 送信元ドメインが事業者側で未認証");
    console.error("  - サーバーから 587/465 への外向き通信が塞がれている");
    console.error("    （クラウドによっては 25/587 が既定で遮断されています）");
    process.exit(1);
  }

  console.log("✓ SMTP への接続と認証に成功しました");

  const recipient = process.argv[2];
  if (!recipient) {
    console.log("");
    console.log("テスト送信するには宛先を指定してください:");
    console.log("  npm run mail:check -- you@example.com");
    return;
  }

  console.log("");
  console.log(`${recipient} へテスト送信します…`);

  const outcome = await sendMail(config, {
    recipient,
    subject: "[SalonFlow] 送信テスト",
    body: [
      "SalonFlow のメール送信設定が正しく動作しています。",
      "",
      "このメールは設定確認のために送信されたものです。",
      "予約やお客様には関係ありません。",
    ].join("\n"),
  });

  console.log(`✓ 送信しました (provider=${outcome.provider}, id=${outcome.messageId ?? "-"})`);
  console.log("");
  console.log("受信箱と迷惑メールフォルダの両方を確認してください。");
  console.log("迷惑メールに入る場合は SPF / DKIM / DMARC の設定が必要です。");
  console.log("これを放置すると、リマインドが顧客に届きません。");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
