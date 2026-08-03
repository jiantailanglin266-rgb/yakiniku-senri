import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  DoorOpen,
  Scissors,
  UserX,
  XCircle,
} from "lucide-react";

import { Badge } from "./primitives";
import { STATUS_LABELS, type AppointmentStatus } from "@/server/modules/appointments/state-machine";

/**
 * Appointment status indicator.
 *
 * The spec — and WCAG 1.4.1 — require that status is never conveyed by colour
 * alone. Each status therefore carries a distinct icon *and* a text label; the
 * colour is the third, redundant channel.
 */

const STATUS_PRESENTATION: Record<
  AppointmentStatus,
  {
    tone: "neutral" | "accent" | "positive" | "warning" | "danger" | "info";
    Icon: typeof CircleDot;
  }
> = {
  pending: { tone: "warning", Icon: CalendarClock },
  confirmed: { tone: "accent", Icon: CircleDot },
  checked_in: { tone: "info", Icon: DoorOpen },
  in_service: { tone: "info", Icon: Scissors },
  completed: { tone: "positive", Icon: CheckCircle2 },
  cancelled: { tone: "neutral", Icon: XCircle },
  no_show: { tone: "danger", Icon: UserX },
};

export function StatusBadge({
  status,
  locale = "ja",
}: {
  status: AppointmentStatus;
  locale?: "ja" | "en";
}) {
  const presentation = STATUS_PRESENTATION[status];
  const label = STATUS_LABELS[status][locale === "en" ? "en" : "ja"];
  const Icon = presentation.Icon;

  return (
    <Badge tone={presentation.tone}>
      <Icon aria-hidden="true" className="size-3" />
      <span>{label}</span>
    </Badge>
  );
}

/** Colour used for the appointment block on the ledger grid. */
export function statusBlockClass(status: AppointmentStatus): string {
  switch (status) {
    case "pending":
      return "bg-[--color-warning-soft] border-[--color-warning] text-[--color-warning]";
    case "checked_in":
    case "in_service":
      return "bg-[--color-info-soft] border-[--color-info] text-[--color-info]";
    case "completed":
      return "bg-[--color-positive-soft] border-[--color-positive] text-[--color-positive]";
    case "cancelled":
      return "bg-[--color-surface-muted] border-[--color-border-strong] text-[--color-ink-subtle] line-through";
    case "no_show":
      return "bg-[--color-danger-soft] border-[--color-danger] text-[--color-danger]";
    case "confirmed":
    default:
      return "bg-[--color-accent-soft] border-[--color-accent] text-[--color-accent]";
  }
}

const SOURCE_LABELS: Record<string, { ja: string; en: string }> = {
  public_web: { ja: "ネット", en: "Online" },
  phone: { ja: "電話", en: "Phone" },
  walk_in: { ja: "来店", en: "Walk in" },
  next_visit: { ja: "次回", en: "Next visit" },
  staff_entry: { ja: "スタッフ", en: "Staff" },
  external: { ja: "外部", en: "External" },
  imported: { ja: "取込", en: "Imported" },
};

export function SourceBadge({ source, locale = "ja" }: { source: string; locale?: "ja" | "en" }) {
  const label = SOURCE_LABELS[source]?.[locale === "en" ? "en" : "ja"] ?? source;
  return <Badge tone="neutral">{label}</Badge>;
}
