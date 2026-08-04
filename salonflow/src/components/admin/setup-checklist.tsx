import Link from "next/link";

import type { SetupStatus } from "@/server/modules/settings/setup-status";
import { getTranslator } from "@/i18n";
import { Card, CardBody, CardHeader } from "@/components/ui/primitives";

/**
 * What is still missing before the store can take a booking.
 *
 * Shown until all four items are done, then it disappears. A permanent
 * checklist becomes furniture; this one is meant to be finished and forgotten.
 */
export function SetupChecklist({
  status,
  storeId,
  locale,
}: {
  status: SetupStatus;
  storeId: string;
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);

  if (status.complete) return null;

  const items = [
    {
      done: status.hasOpenDay,
      label: t("settings.setupHoursTodo"),
      href: `/admin/stores/${storeId}`,
    },
    { done: status.hasService, label: t("settings.setupServiceTodo"), href: "/admin/services" },
    { done: status.hasStaff, label: t("settings.setupStaffTodo"), href: "/admin/staff" },
    { done: status.hasUpcomingShift, label: t("settings.setupShiftTodo"), href: "/admin/staff" },
  ];

  return (
    <Card>
      <CardHeader title={t("settings.setupChecklist")} description={t("settings.setupIntro")} />
      <CardBody>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span
                aria-hidden
                className={item.done ? "text-[--color-positive]" : "text-[--color-warning]"}
              >
                {item.done ? "✓" : "•"}
              </span>
              {item.done ? (
                <span className="text-[--color-ink-muted] line-through">{item.label}</span>
              ) : (
                <Link href={item.href} className="text-[--color-accent] hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
