"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { zonedTimeHHmm } from "@/lib/time";
import { getTranslator } from "@/i18n";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { createAppointmentAction } from "@/server/modules/appointments/actions";
import {
  lookupAvailabilityAction,
  searchCustomersAction,
  type AdminSlot,
  type CustomerOption,
} from "@/server/modules/appointments/availability-actions";

/**
 * Staff-facing booking entry.
 *
 * Reception takes bookings over the phone while the customer waits, so the
 * flow is a single screen: pick the customer, pick the menu, see the free
 * slots, confirm. Free slots are re-fetched on every change rather than
 * filtered client-side, because a colleague may have booked the same time
 * thirty seconds ago.
 */
export function NewAppointmentForm({
  storeId,
  timeZone,
  dateISO,
  services,
  staff,
  initialCustomer,
  locale,
}: {
  storeId: string;
  timeZone: string;
  dateISO: string;
  services: Array<{
    id: string;
    name: string;
    categoryName: string;
    displayPrice: number;
    durationMinutes: number;
  }>;
  staff: Array<{ id: string; displayName: string; designationFee: number }>;
  initialCustomer: { id: string; name: string } | null;
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const router = useRouter();

  const [customer, setCustomer] = useState<{ id: string; name: string } | null>(initialCustomer);
  const [guestName, setGuestName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerOption[]>([]);
  const [searching, startSearch] = useTransition();

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [preferredStaffId, setPreferredStaffId] = useState<string>("");
  const [date, setDate] = useState(dateISO);
  const [note, setNote] = useState("");

  const [slots, setSlots] = useState<AdminSlot[] | null>(null);
  const [storeClosed, setStoreClosed] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AdminSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPrice = selectedServiceIds.reduce((total, id) => {
    const service = services.find((entry) => entry.id === id);
    return total + (service?.displayPrice ?? 0);
  }, 0);

  function runSearch() {
    startSearch(async () => {
      setSearchResults(await searchCustomersAction(searchTerm));
    });
  }

  function loadSlots() {
    setError(null);
    setSelectedSlot(null);

    startTransition(async () => {
      const result = await lookupAvailabilityAction({
        storeId,
        dateISO: date,
        serviceIds: selectedServiceIds,
        staffId: preferredStaffId || null,
      });

      if (!result.ok) {
        setError(result.error ?? t("errors.unexpected"));
        setSlots([]);
        return;
      }

      setStoreClosed(result.storeClosed ?? false);
      setSlots(result.slots ?? []);
    });
  }

  function submit() {
    if (!selectedSlot) return;
    if (!customer && guestName.trim().length === 0) {
      setError("顧客を選択するか、氏名を入力してください");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createAppointmentAction({
        storeId,
        customerId: customer?.id,
        guestName: customer ? undefined : guestName.trim(),
        serviceIds: selectedServiceIds,
        staffId: selectedSlot.staffId,
        startAt: selectedSlot.startAt,
        isDesignated: preferredStaffId.length > 0,
        customerNote: note || undefined,
      });

      if (!result.ok) {
        setError(result.error?.includes(".") ? t(result.error) : (result.error ?? null));
        // The slot may have been taken while the form was open; refresh so the
        // operator picks from what is actually free now.
        loadSlots();
        return;
      }

      router.push(`/admin/schedule?store=${storeId}&date=${date}`);
      router.refresh();
    });
  }

  const categories = new Map<string, typeof services>();
  for (const service of services) {
    const bucket = categories.get(service.categoryName) ?? [];
    bucket.push(service);
    categories.set(service.categoryName, bucket);
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardHeader title={t("appointment.customer")} />
        <CardBody className="space-y-3">
          {customer ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-[--color-accent] bg-[--color-accent-soft] px-3 py-2">
              <span className="text-sm font-medium">{customer.name}</span>
              <Button size="sm" variant="ghost" onClick={() => setCustomer(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t("customer.searchPlaceholder")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      runSearch();
                    }
                  }}
                />
                <Button variant="secondary" onClick={runSearch} disabled={searching}>
                  <Search aria-hidden="true" className="size-4" />
                  {t("common.search")}
                </Button>
              </div>

              {searchResults.length > 0 ? (
                <ul className="divide-y divide-[--color-border] rounded-md border border-[--color-border]">
                  {searchResults.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomer({ id: option.id, name: option.name });
                          setSearchResults([]);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[--color-surface-muted]"
                      >
                        {option.name}
                        <span className="ml-2 text-xs text-[--color-ink-subtle]">
                          {[option.nameKana, option.phone].filter(Boolean).join(" / ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <Field
                label={`${t("appointment.guest")}（${t("common.optional")}）`}
                htmlFor="guest-name"
                hint="既存顧客が見つからない場合は氏名のみで予約できます"
              >
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                />
              </Field>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("appointment.services")} />
        <CardBody className="space-y-3">
          {[...categories.entries()].map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-[--color-ink-muted]">{category}</p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {items.map((service) => {
                  const selected = selectedServiceIds.includes(service.id);
                  return (
                    <li key={service.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setSlots(null);
                          setSelectedSlot(null);
                          setSelectedServiceIds((current) =>
                            current.includes(service.id)
                              ? current.filter((id) => id !== service.id)
                              : [...current, service.id],
                          );
                        }}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs",
                          selected
                            ? "border-[--color-accent] bg-[--color-accent] text-[--color-accent-ink]"
                            : "border-[--color-border] hover:bg-[--color-surface-muted]",
                        )}
                      >
                        {service.name}
                        <span className="ml-1 opacity-75">
                          {service.durationMinutes}分 / {formatMoney(service.displayPrice)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {selectedServiceIds.length > 0 ? (
            <p className="text-xs text-[--color-ink-muted]">
              {t("common.total")}: {formatMoney(totalPrice)}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("appointment.startAt")} />
        <CardBody className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t("appointment.startAt")} htmlFor="appointment-date">
              <Input
                id="appointment-date"
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setSlots(null);
                }}
              />
            </Field>

            <Field label={t("appointment.staff")} htmlFor="preferred-staff">
              <Select
                id="preferred-staff"
                value={preferredStaffId}
                onChange={(event) => {
                  setPreferredStaffId(event.target.value);
                  setSlots(null);
                }}
              >
                <option value="">{t("schedule.freeChoice")}</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={loadSlots}
                disabled={selectedServiceIds.length === 0 || isPending}
                className="w-full"
              >
                {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
                空き枠を表示
              </Button>
            </div>
          </div>

          {slots === null ? null : storeClosed ? (
            <p className="text-sm text-[--color-ink-muted]">{t("schedule.closed")}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-[--color-ink-muted]">{t("common.noData")}</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {slots.map((slot) => {
                const isSelected =
                  selectedSlot?.startAt === slot.startAt && selectedSlot?.staffId === slot.staffId;
                return (
                  <li key={`${slot.startAt}:${slot.staffId}`}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs tabular-nums",
                        isSelected
                          ? "border-[--color-accent] bg-[--color-accent] text-[--color-accent-ink]"
                          : "border-[--color-border] hover:bg-[--color-surface-muted]",
                      )}
                    >
                      {zonedTimeHHmm(new Date(slot.startAt), timeZone)}
                      <span className="ml-1 opacity-75">{slot.staffName}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("appointment.customerNote")} />
        <CardBody>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => router.back()} disabled={isPending}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit} disabled={!selectedSlot || isPending}>
          {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          {t("common.create")}
        </Button>
      </div>
    </div>
  );
}
