import { notFound } from "next/navigation";

import { env } from "@/config/env";
import { productName } from "@/config/product";
import {
  getPublicServices,
  getPublicStaff,
  getPublicStore,
} from "@/server/modules/booking/public-service";
import { formatMinuteOfDay } from "@/lib/time";
import { getTranslator, resolveLocale, type Locale } from "@/i18n";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const dynamic = "force-dynamic";

const WEEKDAYS: Record<Locale, string[]> = {
  ja: ["日", "月", "火", "水", "木", "金", "土"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  zh_Hans: ["日", "一", "二", "三", "四", "五", "六"],
  zh_Hant: ["日", "一", "二", "三", "四", "五", "六"],
  ko: ["일", "월", "화", "수", "목", "금", "토"],
};

export async function generateMetadata(props: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await props.params;
  const store = await getPublicStore(storeSlug);
  if (!store) return { title: "店舗が見つかりません" };

  return {
    title: `${store.name} — ネット予約`,
    description: store.description ?? undefined,
    // Demo stores are fictional; they must not be indexed as real businesses.
    robots: { index: false, follow: false },
  };
}

export default async function BookingPage(props: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { storeSlug } = await props.params;
  const { lang } = await props.searchParams;

  const store = await getPublicStore(storeSlug);
  if (!store) notFound();

  const locale = resolveLocale(lang);
  const t = getTranslator("booking", locale);

  const [services, staff] = await Promise.all([
    getPublicServices(store),
    getPublicStaff(store, []),
  ]);

  const weekdays = WEEKDAYS[locale] ?? WEEKDAYS.ja;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      {env().DEMO_MODE ? (
        <p className="mb-4 rounded-md bg-[--color-warning-soft] px-3 py-2 text-center text-xs text-[--color-warning]">
          {t("demo.banner")}
        </p>
      ) : null}

      <header className="mb-6">
        <h1 className="text-xl font-semibold text-[--color-ink]">{store.name}</h1>
        {store.description ? (
          <p className="mt-1 text-sm text-[--color-ink-muted]">{store.description}</p>
        ) : null}

        <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-[--color-ink-muted] sm:grid-cols-2">
          {store.address ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium">{t("store.address")}</dt>
              <dd>{store.address}</dd>
            </div>
          ) : null}
          {store.phone ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium">{t("store.phone")}</dt>
              <dd className="tabular-nums">{store.phone}</dd>
            </div>
          ) : null}
          {store.accessNote ? (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium">{t("store.access")}</dt>
              <dd>{store.accessNote}</dd>
            </div>
          ) : null}
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium">{t("store.hours")}</dt>
            <dd>
              {store.businessHours
                .filter((hour) => !hour.isClosed)
                .map(
                  (hour) =>
                    `${weekdays[hour.dayOfWeek]} ${formatMinuteOfDay(hour.openMinute)}–${formatMinuteOfDay(hour.closeMinute)}`,
                )
                .join(" / ") || "—"}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium">{t("store.closedDays")}</dt>
            <dd>
              {store.businessHours
                .filter((hour) => hour.isClosed)
                .map((hour) => weekdays[hour.dayOfWeek])
                .join("・") || "—"}
            </dd>
          </div>
        </dl>
      </header>

      {services.length === 0 ? (
        <p className="rounded-md border border-[--color-border] bg-[--color-surface] px-4 py-8 text-center text-sm text-[--color-ink-muted]">
          {t("store.notAcceptingOnline")}
        </p>
      ) : (
        <BookingWizard
          store={{
            slug: store.slug,
            name: store.name,
            timeZone: store.timeZone,
            approvalMode: store.approvalMode,
            allowStaffDesignation: store.allowStaffDesignation,
            cancelDeadlineHours: store.cancelDeadlineHours,
            cancellationPolicy: store.cancellationPolicy,
            maxAdvanceDays: store.maxAdvanceDays,
          }}
          services={services}
          staff={staff}
          locale={locale}
        />
      )}

      <footer className="mt-10 border-t border-[--color-border] pt-4 text-xs text-[--color-ink-subtle]">
        <p>
          {productName()}{" "}
          で運営されています。ご入力いただいた情報は予約手続きとご連絡のために利用します。
        </p>
      </footer>
    </main>
  );
}
