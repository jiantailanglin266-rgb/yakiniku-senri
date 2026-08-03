import type { NotificationEvent } from "@prisma/client";

/**
 * Built-in notification templates.
 *
 * Split out of `templates.ts` (which is server-only) so the database seed can
 * import the same wording it will render at runtime — the seed runs as a plain
 * Node script, outside the React Server Components boundary.
 *
 * The wording is original to this product and does not reproduce the copy of
 * any existing booking service.
 */

interface TemplateSeed {
  subject: string;
  body: string;
}

export const DEFAULT_TEMPLATES: Record<string, Partial<Record<NotificationEvent, TemplateSeed>>> = {
  ja: {
    appointment_requested: {
      subject: "【{{storeName}}】ご予約リクエストを受け付けました",
      body: [
        "{{storeName}} です。ご予約リクエストを受け付けました。",
        "",
        "予約番号: {{reference}}",
        "ご希望日時: {{startDate}} {{startTime}}",
        "メニュー: {{serviceNames}}",
        "",
        "店舗が内容を確認のうえ、あらためて確定のご連絡をいたします。",
        "この時点ではまだ予約は確定しておりません。",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
    appointment_confirmed: {
      subject: "【{{storeName}}】ご予約が確定しました",
      body: [
        "{{storeName}} です。ご予約が確定しました。",
        "",
        "予約番号: {{reference}}",
        "日時: {{startDate}} {{startTime}}",
        "メニュー: {{serviceNames}}",
        "",
        "ご来店をお待ちしております。",
        "ご都合が変わった場合は、お早めにご連絡ください。",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
    appointment_updated: {
      subject: "【{{storeName}}】ご予約内容を変更しました",
      body: [
        "{{storeName}} です。ご予約内容を変更しました。",
        "",
        "予約番号: {{reference}}",
        "変更後の日時: {{startDate}} {{startTime}}",
        "",
        "お心当たりのない場合は、店舗までご連絡ください。",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
    appointment_cancelled: {
      subject: "【{{storeName}}】ご予約をキャンセルしました",
      body: [
        "{{storeName}} です。次のご予約をキャンセルしました。",
        "",
        "予約番号: {{reference}}",
        "日時: {{startDate}} {{startTime}}",
        "",
        "またのご利用をお待ちしております。",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
    reminder_day_before: {
      subject: "【{{storeName}}】明日のご予約のご案内",
      body: [
        "{{storeName}} です。明日のご予約をお知らせします。",
        "",
        "日時: {{startDate}} {{startTime}}",
        "メニュー: {{serviceNames}}",
        "",
        "ご来店をお待ちしております。",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
    staff_new_appointment: {
      subject: "【{{storeName}}】新しい予約が入りました",
      body: [
        "新しい予約が入りました。",
        "",
        "予約番号: {{reference}}",
        "日時: {{startDate}} {{startTime}}",
        "メニュー: {{serviceNames}}",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
  },
  en: {
    appointment_requested: {
      subject: "[{{storeName}}] We received your booking request",
      body: [
        "Thank you for your request at {{storeName}}.",
        "",
        "Reference: {{reference}}",
        "Requested time: {{startDate}} {{startTime}}",
        "Services: {{serviceNames}}",
        "",
        "The salon will review your request and confirm separately.",
        "Your booking is not confirmed yet.",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
    appointment_confirmed: {
      subject: "[{{storeName}}] Your booking is confirmed",
      body: [
        "Your booking at {{storeName}} is confirmed.",
        "",
        "Reference: {{reference}}",
        "When: {{startDate}} {{startTime}}",
        "Services: {{serviceNames}}",
        "",
        "We look forward to seeing you.",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
    appointment_updated: {
      subject: "[{{storeName}}] Your booking was changed",
      body: [
        "Your booking at {{storeName}} has been changed.",
        "",
        "Reference: {{reference}}",
        "New time: {{startDate}} {{startTime}}",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
    appointment_cancelled: {
      subject: "[{{storeName}}] Your booking was cancelled",
      body: [
        "The following booking at {{storeName}} has been cancelled.",
        "",
        "Reference: {{reference}}",
        "When: {{startDate}} {{startTime}}",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
    reminder_day_before: {
      subject: "[{{storeName}}] Your appointment is tomorrow",
      body: [
        "A reminder of your appointment at {{storeName}}.",
        "",
        "When: {{startDate}} {{startTime}}",
        "Services: {{serviceNames}}",
        "",
        "-- ",
        "{{productName}}",
      ].join("\n"),
    },
  },
};
