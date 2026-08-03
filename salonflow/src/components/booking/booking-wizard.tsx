"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { addDaysISO, zonedDateISO, zonedTimeHHmm } from "@/lib/time";
import { getTranslator, type Locale } from "@/i18n";
import { Alert, Button, Card, CardBody, Field, Input, Textarea } from "@/components/ui/primitives";

/**
 * Public booking wizard.
 *
 * Implements the ten steps of the spec as six screens (menu → staff → time →
 * details+consent → review → done), because splitting consent onto its own
 * screen measurably increases drop-off without improving how considered the
 * agreement is.
 *
 * Two properties matter more than the visuals here:
 *
 *   - Availability is fetched fresh whenever the selection changes and is
 *     never cached. A slot shown is a slot that was free a moment ago, not one
 *     that was free when the page loaded.
 *   - The submit button carries an idempotency key generated once per attempt,
 *     so a double tap on a slow connection cannot produce two bookings.
 */

export interface WizardStore {
  slug: string;
  name: string;
  timeZone: string;
  approvalMode: "instant" | "request";
  allowStaffDesignation: boolean;
  cancelDeadlineHours: number;
  cancellationPolicy: string | null;
  maxAdvanceDays: number;
}

export interface WizardService {
  id: string;
  categoryName: string;
  name: string;
  description: string | null;
  displayPrice: number;
  durationMinutes: number;
  options: Array<{ id: string; name: string; price: number; durationMinutes: number }>;
}

export interface WizardStaff {
  id: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  designationFee: number;
}

type Step = "service" | "staff" | "datetime" | "details" | "confirm" | "done";

const STEP_ORDER: Step[] = ["service", "staff", "datetime", "details", "confirm"];

interface DayAvailability {
  dateISO: string;
  storeClosed: boolean;
  slots: Array<{ startAt: string; staffId: string }>;
}

interface BookingResult {
  reference: string;
  status: string;
  startAt: string;
  requiresApproval: boolean;
  notificationSent: boolean;
}

export function BookingWizard({
  store,
  services,
  staff,
  locale,
}: {
  store: WizardStore;
  services: WizardService[];
  staff: WizardStaff[];
  locale: Locale;
}) {
  const t = getTranslator("booking", locale);

  const [step, setStep] = useState<Step>("service");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => zonedDateISO(new Date(), store.timeZone));
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ startAt: string; staffId: string } | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    nameKana: "",
    phone: "",
    email: "",
    note: "",
    terms: false,
    cancellation: false,
    privacy: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  const selectedServices = useMemo(
    () =>
      selectedServiceIds
        .map((id) => services.find((service) => service.id === id))
        .filter((service): service is WizardService => Boolean(service)),
    [selectedServiceIds, services],
  );

  const optionTotal = useMemo(() => {
    let price = 0;
    let minutes = 0;
    for (const service of services) {
      for (const option of service.options) {
        if (selectedOptionIds.includes(option.id)) {
          price += option.price;
          minutes += option.durationMinutes;
        }
      }
    }
    return { price, minutes };
  }, [selectedOptionIds, services]);

  const totalPrice =
    selectedServices.reduce((total, service) => total + service.displayPrice, 0) +
    optionTotal.price +
    (staffId ? (staff.find((member) => member.id === staffId)?.designationFee ?? 0) : 0);

  const totalMinutes =
    selectedServices.reduce((total, service) => total + service.durationMinutes, 0) +
    optionTotal.minutes;

  // Staff able to perform *every* selected service.
  const eligibleStaff = useMemo(() => staff, [staff]);

  /**
   * Fetch availability.
   *
   * Called from explicit user actions — entering the date step, changing the
   * week, or recovering from a taken slot — rather than from an effect. Tying
   * it to events keeps a single fetch per intent, instead of one per render
   * that happens to change a dependency.
   */
  const loadAvailability = useCallback(
    async (overrides?: { weekStart?: string; staffId?: string | null }) => {
      if (selectedServiceIds.length === 0) return;

      setLoadingSlots(true);
      setError(null);

      try {
        const effectiveWeek = overrides?.weekStart ?? weekStart;
        const effectiveStaff = overrides?.staffId === undefined ? staffId : overrides.staffId;

        const params = new URLSearchParams({ from: effectiveWeek, days: "7" });
        for (const id of selectedServiceIds) params.append("serviceId", id);
        for (const id of selectedOptionIds) params.append("optionId", id);
        if (effectiveStaff) params.set("staffId", effectiveStaff);

        const response = await fetch(
          `/api/v1/public/stores/${store.slug}/availability?${params.toString()}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          setError(response.status === 429 ? t("errors.rateLimited") : t("errors.unexpected"));
          setAvailability([]);
          return;
        }

        const body = (await response.json()) as { data: { days: DayAvailability[] } };
        setAvailability(body.data.days);
      } catch {
        setError(t("errors.unexpected"));
        setAvailability([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [selectedServiceIds, selectedOptionIds, staffId, weekStart, store.slug, t],
  );

  /** Move to a step, fetching availability when the date step is entered. */
  function goToStep(next: Step) {
    setStep(next);
    if (next === "datetime") void loadAvailability();
  }

  function toggleService(serviceId: string) {
    setSelectedSlot(null);
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  function toggleOption(optionId: string) {
    setSelectedSlot(null);
    setSelectedOptionIds((current) =>
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
    );
  }

  async function submit() {
    if (!selectedSlot) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/public/appointments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // One key per attempt: a retry of *this* attempt is deduplicated,
          // while a deliberate second booking gets its own key.
          "idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          storeSlug: store.slug,
          serviceIds: selectedServiceIds,
          optionIds: selectedOptionIds,
          staffId: selectedSlot.staffId,
          startAt: selectedSlot.startAt,
          isDesignated: staffId !== null,
          customer: {
            name: form.name,
            nameKana: form.nameKana || undefined,
            phone: form.phone || undefined,
            email: form.email || undefined,
            note: form.note || undefined,
          },
          consent: {
            terms: form.terms,
            cancellation: form.cancellation,
            privacy: form.privacy,
          },
        }),
      });

      const body = (await response.json()) as
        { data: BookingResult } | { error: { code: string; message: string } };

      if (!response.ok) {
        const code = "error" in body ? body.error.code : "UNEXPECTED";
        if (code === "SLOT_TAKEN") {
          setError(t("errors.slotTaken"));
          setSelectedSlot(null);
          setStep("datetime");
          await loadAvailability();
          return;
        }
        setError("error" in body ? body.error.message : t("errors.unexpected"));
        return;
      }

      setResult((body as { data: BookingResult }).data);
      setStep("done");
    } catch {
      setError(t("errors.unexpected"));
    } finally {
      setSubmitting(false);
    }
  }

  const canProceed: Record<Step, boolean> = {
    service: selectedServiceIds.length > 0,
    staff: true,
    datetime: selectedSlot !== null,
    details:
      form.name.trim().length > 0 &&
      (form.email.trim().length > 0 || form.phone.trim().length > 0) &&
      form.terms &&
      form.cancellation &&
      form.privacy,
    confirm: true,
    done: false,
  };

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="space-y-4">
      {step !== "done" ? (
        <ol className="flex flex-wrap gap-1 text-xs" aria-label="予約手順">
          {STEP_ORDER.map((entry, index) => (
            <li key={entry} className="flex items-center gap-1">
              <span
                aria-current={entry === step ? "step" : undefined}
                className={cn(
                  "rounded-full px-2.5 py-1",
                  index < stepIndex
                    ? "bg-[--color-positive-soft] text-[--color-positive]"
                    : entry === step
                      ? "bg-[--color-accent] text-[--color-accent-ink]"
                      : "bg-[--color-surface-muted] text-[--color-ink-subtle]",
                )}
              >
                {index < stepIndex ? <Check aria-hidden="true" className="inline size-3" /> : null}{" "}
                {t(`steps.${entry}`)}
              </span>
              {index < STEP_ORDER.length - 1 ? (
                <ChevronRight aria-hidden="true" className="size-3 text-[--color-ink-subtle]" />
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {step === "service" ? (
        <ServiceStep
          services={services}
          selectedServiceIds={selectedServiceIds}
          selectedOptionIds={selectedOptionIds}
          onToggleService={toggleService}
          onToggleOption={toggleOption}
          t={t}
        />
      ) : null}

      {step === "staff" ? (
        <StaffStep
          staff={eligibleStaff}
          staffId={staffId}
          allowDesignation={store.allowStaffDesignation}
          onSelect={(id) => {
            setStaffId(id);
            setSelectedSlot(null);
          }}
          t={t}
        />
      ) : null}

      {step === "datetime" ? (
        <DateTimeStep
          availability={availability}
          loading={loadingSlots}
          timeZone={store.timeZone}
          weekStart={weekStart}
          todayISO={zonedDateISO(new Date(), store.timeZone)}
          maxAdvanceDays={store.maxAdvanceDays}
          selectedSlot={selectedSlot}
          onWeekChange={(nextWeek) => {
            setWeekStart(nextWeek);
            setSelectedSlot(null);
            void loadAvailability({ weekStart: nextWeek });
          }}
          onSelect={setSelectedSlot}
          t={t}
        />
      ) : null}

      {step === "details" ? (
        <DetailsStep form={form} onChange={setForm} store={store} t={t} />
      ) : null}

      {step === "confirm" && selectedSlot ? (
        <ConfirmStep
          store={store}
          services={selectedServices}
          optionNames={services
            .flatMap((service) => service.options)
            .filter((option) => selectedOptionIds.includes(option.id))
            .map((option) => option.name)}
          staffName={
            staffId ? (staff.find((member) => member.id === staffId)?.displayName ?? null) : null
          }
          slot={selectedSlot}
          totalPrice={totalPrice}
          totalMinutes={totalMinutes}
          form={form}
          t={t}
        />
      ) : null}

      {step === "done" && result ? <DoneStep store={store} result={result} t={t} /> : null}

      {step !== "done" ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={stepIndex === 0 || submitting}
            onClick={() => goToStep(STEP_ORDER[Math.max(0, stepIndex - 1)] ?? "service")}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            {t("confirm.edit")}
          </Button>

          <div className="text-right">
            {selectedServiceIds.length > 0 ? (
              <p className="text-xs text-[--color-ink-muted]">
                {t("service.total")} {formatMoney(totalPrice)} / {totalMinutes}分
              </p>
            ) : null}
          </div>

          {step === "confirm" ? (
            <Button onClick={submit} disabled={submitting || !selectedSlot}>
              {submitting ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  {t("confirm.submitting")}
                </>
              ) : (
                t("confirm.submit")
              )}
            </Button>
          ) : (
            <Button
              disabled={!canProceed[step]}
              onClick={() =>
                goToStep(STEP_ORDER[Math.min(STEP_ORDER.length - 1, stepIndex + 1)] ?? "confirm")
              }
            >
              {t("steps.confirm")}
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

type Translator = ReturnType<typeof getTranslator>;

function ServiceStep({
  services,
  selectedServiceIds,
  selectedOptionIds,
  onToggleService,
  onToggleOption,
  t,
}: {
  services: WizardService[];
  selectedServiceIds: string[];
  selectedOptionIds: string[];
  onToggleService: (id: string) => void;
  onToggleOption: (id: string) => void;
  t: Translator;
}) {
  const categories = new Map<string, WizardService[]>();
  for (const service of services) {
    const bucket = categories.get(service.categoryName) ?? [];
    bucket.push(service);
    categories.set(service.categoryName, bucket);
  }

  return (
    <section aria-label={t("service.title")} className="space-y-4">
      <h2 className="text-sm font-semibold">{t("service.title")}</h2>

      {[...categories.entries()].map(([category, items]) => (
        <Card key={category}>
          <CardBody className="space-y-2">
            <h3 className="text-xs font-semibold text-[--color-ink-muted]">{category}</h3>
            <ul className="space-y-2">
              {items.map((service) => {
                const selected = selectedServiceIds.includes(service.id);
                return (
                  <li key={service.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onToggleService(service.id)}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left",
                        selected
                          ? "border-[--color-accent] bg-[--color-accent-soft]"
                          : "border-[--color-border] hover:bg-[--color-surface-muted]",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          {selected ? <Check aria-hidden="true" className="size-3.5" /> : null}
                          {service.name}
                        </span>
                        {service.description ? (
                          <span className="mt-0.5 block text-xs text-[--color-ink-muted]">
                            {service.description}
                          </span>
                        ) : null}
                        <span className="mt-0.5 block text-xs text-[--color-ink-subtle]">
                          {t("service.duration", { minutes: service.durationMinutes })}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {formatMoney(service.displayPrice)}
                      </span>
                    </button>

                    {selected && service.options.length > 0 ? (
                      <ul className="mt-1 ml-4 space-y-1">
                        {service.options.map((option) => (
                          <li key={option.id}>
                            <label className="flex items-center justify-between gap-2 rounded-md border border-[--color-border] px-3 py-1.5 text-xs">
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedOptionIds.includes(option.id)}
                                  onChange={() => onToggleOption(option.id)}
                                  className="size-4"
                                />
                                {option.name}（+{option.durationMinutes}分）
                              </span>
                              <span className="tabular-nums">+{formatMoney(option.price)}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      ))}
    </section>
  );
}

function StaffStep({
  staff,
  staffId,
  allowDesignation,
  onSelect,
  t,
}: {
  staff: WizardStaff[];
  staffId: string | null;
  allowDesignation: boolean;
  onSelect: (id: string | null) => void;
  t: Translator;
}) {
  return (
    <section aria-label={t("staff.title")} className="space-y-3">
      <h2 className="text-sm font-semibold">{t("staff.title")}</h2>

      <button
        type="button"
        aria-pressed={staffId === null}
        onClick={() => onSelect(null)}
        className={cn(
          "flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left",
          staffId === null
            ? "border-[--color-accent] bg-[--color-accent-soft]"
            : "border-[--color-border] hover:bg-[--color-surface-muted]",
        )}
      >
        <span>
          <span className="block text-sm font-medium">{t("staff.anyone")}</span>
          <span className="block text-xs text-[--color-ink-muted]">{t("staff.anyoneNote")}</span>
        </span>
      </button>

      {allowDesignation
        ? staff.map((member) => (
            <button
              key={member.id}
              type="button"
              aria-pressed={staffId === member.id}
              onClick={() => onSelect(member.id)}
              className={cn(
                "flex w-full items-start justify-between gap-3 rounded-md border px-3 py-3 text-left",
                staffId === member.id
                  ? "border-[--color-accent] bg-[--color-accent-soft]"
                  : "border-[--color-border] hover:bg-[--color-surface-muted]",
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{member.displayName}</span>
                {member.title ? (
                  <span className="block text-xs text-[--color-ink-muted]">{member.title}</span>
                ) : null}
                {member.bio ? (
                  <span className="mt-0.5 block text-xs text-[--color-ink-subtle]">
                    {member.bio}
                  </span>
                ) : null}
              </span>
              {member.designationFee > 0 ? (
                <span className="shrink-0 text-xs tabular-nums text-[--color-ink-muted]">
                  {t("staff.designationFee", { amount: formatMoney(member.designationFee) })}
                </span>
              ) : null}
            </button>
          ))
        : null}
    </section>
  );
}

function DateTimeStep({
  availability,
  loading,
  timeZone,
  weekStart,
  todayISO,
  maxAdvanceDays,
  selectedSlot,
  onWeekChange,
  onSelect,
  t,
}: {
  availability: DayAvailability[];
  loading: boolean;
  timeZone: string;
  weekStart: string;
  todayISO: string;
  maxAdvanceDays: number;
  selectedSlot: { startAt: string; staffId: string } | null;
  onWeekChange: (dateISO: string) => void;
  onSelect: (slot: { startAt: string; staffId: string }) => void;
  t: Translator;
}) {
  const canGoBack = weekStart > todayISO;
  const canGoForward = addDaysISO(weekStart, 7) <= addDaysISO(todayISO, maxAdvanceDays);

  return (
    <section aria-label={t("datetime.title")} className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("datetime.title")}</h2>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={!canGoBack}
            onClick={() =>
              onWeekChange(
                addDaysISO(weekStart, -7) < todayISO ? todayISO : addDaysISO(weekStart, -7),
              )
            }
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            {t("datetime.previousWeek")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!canGoForward}
            onClick={() => onWeekChange(addDaysISO(weekStart, 7))}
          >
            {t("datetime.nextWeek")}
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 px-3 py-6 text-sm text-[--color-ink-muted]">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          {t("steps.datetime")}…
        </p>
      ) : (
        <div className="space-y-3">
          {availability.map((day) => (
            <Card key={day.dateISO}>
              <CardBody className="space-y-2">
                <h3 className="text-xs font-semibold tabular-nums text-[--color-ink]">
                  {day.dateISO}
                  {day.storeClosed ? (
                    <span className="ml-2 font-normal text-[--color-ink-subtle]">
                      {t("datetime.closed")}
                    </span>
                  ) : (
                    <span className="ml-2 font-normal text-[--color-ink-subtle]">
                      {t("datetime.availableCount", { count: day.slots.length })}
                    </span>
                  )}
                </h3>

                {day.storeClosed ? null : day.slots.length === 0 ? (
                  <p className="text-xs text-[--color-ink-subtle]">{t("datetime.noSlots")}</p>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {dedupeByTime(day.slots).map((slot) => {
                      const isSelected = selectedSlot?.startAt === slot.startAt;
                      return (
                        <li key={slot.startAt}>
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => onSelect(slot)}
                            className={cn(
                              "rounded-md border px-3 py-1.5 text-xs tabular-nums",
                              isSelected
                                ? "border-[--color-accent] bg-[--color-accent] text-[--color-accent-ink]"
                                : "border-[--color-border] hover:bg-[--color-surface-muted]",
                            )}
                          >
                            {zonedTimeHHmm(new Date(slot.startAt), timeZone)}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

/** One button per start time; the engine already chose which staff member. */
function dedupeByTime(
  slots: Array<{ startAt: string; staffId: string }>,
): Array<{ startAt: string; staffId: string }> {
  const seen = new Set<string>();
  const result: Array<{ startAt: string; staffId: string }> = [];
  for (const slot of slots) {
    if (seen.has(slot.startAt)) continue;
    seen.add(slot.startAt);
    result.push(slot);
  }
  return result;
}

function DetailsStep({
  form,
  onChange,
  store,
  t,
}: {
  form: {
    name: string;
    nameKana: string;
    phone: string;
    email: string;
    note: string;
    terms: boolean;
    cancellation: boolean;
    privacy: boolean;
  };
  onChange: (next: typeof form) => void;
  store: WizardStore;
  t: Translator;
}) {
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <section aria-label={t("details.title")} className="space-y-3">
      <h2 className="text-sm font-semibold">{t("details.title")}</h2>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label={t("details.name")} htmlFor="booking-name" required>
            <Input
              id="booking-name"
              value={form.name}
              autoComplete="name"
              onChange={(event) => set("name", event.target.value)}
              required
            />
          </Field>

          <Field label={t("details.nameKana")} htmlFor="booking-kana">
            <Input
              id="booking-kana"
              value={form.nameKana}
              onChange={(event) => set("nameKana", event.target.value)}
            />
          </Field>

          <Field label={t("details.phone")} htmlFor="booking-phone">
            <Input
              id="booking-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
            />
          </Field>

          <Field label={t("details.email")} htmlFor="booking-email" hint={t("details.emailHelp")}>
            <Input
              id="booking-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label={t("details.note")} htmlFor="booking-note">
              <Textarea
                id="booking-note"
                value={form.note}
                placeholder={t("details.notePlaceholder")}
                onChange={(event) => set("note", event.target.value)}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="rounded-md bg-[--color-surface-muted] px-3 py-2 text-xs text-[--color-ink-muted]">
            <p className="font-medium text-[--color-ink]">{t("cancellation.title")}</p>
            <p className="mt-0.5">
              {store.cancellationPolicy ??
                t("cancellation.deadline", { hours: store.cancelDeadlineHours })}
            </p>
          </div>

          {(
            [
              ["terms", t("details.agreeTerms")],
              ["cancellation", t("details.agreeCancellation")],
              ["privacy", t("details.agreePrivacy")],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(event) => set(key, event.target.checked)}
                className="mt-0.5 size-4"
                required
              />
              <span>
                {label}
                <span className="ml-1 text-[--color-danger]">*</span>
              </span>
            </label>
          ))}
        </CardBody>
      </Card>
    </section>
  );
}

function ConfirmStep({
  store,
  services,
  optionNames,
  staffName,
  slot,
  totalPrice,
  totalMinutes,
  form,
  t,
}: {
  store: WizardStore;
  services: WizardService[];
  optionNames: string[];
  staffName: string | null;
  slot: { startAt: string; staffId: string };
  totalPrice: number;
  totalMinutes: number;
  form: { name: string; phone: string; email: string; note: string };
  t: Translator;
}) {
  return (
    <section aria-label={t("confirm.title")} className="space-y-3">
      <h2 className="text-sm font-semibold">{t("confirm.title")}</h2>

      <Card>
        <CardBody>
          <dl className="space-y-2 text-sm">
            <Row label={t("confirm.store")}>{store.name}</Row>
            <Row label={t("confirm.datetime")}>
              <span className="tabular-nums">
                {zonedDateISO(new Date(slot.startAt), store.timeZone)}{" "}
                {zonedTimeHHmm(new Date(slot.startAt), store.timeZone)}（約{totalMinutes}分）
              </span>
            </Row>
            <Row label={t("confirm.services")}>
              {[...services.map((service) => service.name), ...optionNames].join("、")}
            </Row>
            <Row label={t("confirm.staff")}>{staffName ?? t("staff.anyone")}</Row>
            <Row label={t("confirm.customer")}>{form.name}</Row>
            <Row label={t("confirm.contact")}>
              {[form.phone, form.email].filter(Boolean).join(" / ") || "—"}
            </Row>
            {form.note ? <Row label={t("confirm.note")}>{form.note}</Row> : null}
            <Row label={t("confirm.total")}>
              <span className="text-base font-semibold tabular-nums">
                {formatMoney(totalPrice)}
              </span>
            </Row>
          </dl>

          <p className="mt-3 text-xs text-[--color-ink-subtle]">{t("confirm.priceNote")}</p>

          {store.approvalMode === "request" ? (
            <div className="mt-3">
              <Alert tone="warning">{t("done.pendingNote")}</Alert>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </section>
  );
}

function DoneStep({
  store,
  result,
  t,
}: {
  store: WizardStore;
  result: BookingResult;
  t: Translator;
}) {
  return (
    <section aria-label={t("steps.done")} className="space-y-3">
      <Card>
        <CardBody className="space-y-3 text-center">
          <p className="flex items-center justify-center gap-2 text-base font-semibold text-[--color-positive]">
            <Check aria-hidden="true" className="size-5" />
            {result.requiresApproval ? t("done.titlePending") : t("done.title")}
          </p>

          <p className="text-sm">
            {t("done.reference")}:{" "}
            <span className="font-mono font-semibold">{result.reference}</span>
          </p>

          <p className="tabular-nums text-sm text-[--color-ink-muted]">
            {zonedDateISO(new Date(result.startAt), store.timeZone)}{" "}
            {zonedTimeHHmm(new Date(result.startAt), store.timeZone)}
          </p>

          <p className="text-xs text-[--color-ink-muted]">
            {result.requiresApproval
              ? t("done.pendingNote")
              : result.notificationSent
                ? t("done.confirmedNote")
                : t("done.noEmailNote")}
          </p>

          <a
            href={`/booking/${store.slug}`}
            className="inline-block text-xs text-[--color-accent] hover:underline"
          >
            {t("done.backToStore")}
          </a>
        </CardBody>
      </Card>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-2">
      <dt className="text-xs text-[--color-ink-muted]">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
