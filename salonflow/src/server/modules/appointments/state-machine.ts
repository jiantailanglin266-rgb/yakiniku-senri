/**
 * Appointment state machine.
 *
 * Pure and dependency-free so the transition table can be unit tested and
 * reused by the UI to decide which buttons to show. The server always
 * validates through `assertTransition` — a button hidden in the UI is a
 * convenience, not a control.
 */

export type AppointmentStatus =
  "pending" | "confirmed" | "checked_in" | "in_service" | "completed" | "cancelled" | "no_show";

export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "in_service",
  "completed",
  "cancelled",
  "no_show",
];

/** Allowed transitions, keyed by the current status. */
const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["in_service", "cancelled", "no_show"],
  in_service: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

/**
 * Statuses that still occupy the calendar.
 *
 * When an appointment leaves this set its staff and resource slots are
 * deactivated, which is what frees the time for someone else.
 */
const OCCUPYING: readonly AppointmentStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "in_service",
  "completed",
];

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: AppointmentStatus): readonly AppointmentStatus[] {
  return TRANSITIONS[from];
}

export class InvalidTransitionError extends Error {
  readonly from: AppointmentStatus;
  readonly to: AppointmentStatus;

  constructor(from: AppointmentStatus, to: AppointmentStatus) {
    super(`予約の状態を ${from} から ${to} へ変更することはできません`);
    this.name = "InvalidTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function assertTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

/** True while the appointment still blocks its staff and resources. */
export function occupiesCalendar(status: AppointmentStatus): boolean {
  return OCCUPYING.includes(status);
}

export function isTerminal(status: AppointmentStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/** Timestamp column set when entering each status. */
export function timestampFieldFor(status: AppointmentStatus): string | null {
  switch (status) {
    case "confirmed":
      return "confirmedAt";
    case "checked_in":
      return "checkedInAt";
    case "in_service":
      return "serviceStartedAt";
    case "completed":
      return "completedAt";
    case "cancelled":
      return "cancelledAt";
    default:
      return null;
  }
}

/** Human-facing label. Status is never conveyed by colour alone (WCAG 1.4.1). */
export const STATUS_LABELS: Record<AppointmentStatus, { ja: string; en: string }> = {
  pending: { ja: "リクエスト", en: "Requested" },
  confirmed: { ja: "確定", en: "Confirmed" },
  checked_in: { ja: "来店済", en: "Checked in" },
  in_service: { ja: "施術中", en: "In service" },
  completed: { ja: "完了", en: "Completed" },
  cancelled: { ja: "キャンセル", en: "Cancelled" },
  no_show: { ja: "無断キャンセル", en: "No show" },
};
