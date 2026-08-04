"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getTranslator } from "@/i18n";
import {
  archiveServiceAction,
  createServiceAction,
  updateServiceAction,
} from "@/server/modules/settings/actions";
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

/**
 * Menu editor.
 *
 * Two groups of fields with very different consequences: what the customer
 * sees (name, price, description) and what the scheduler reserves (duration,
 * prep, cleanup, the processing gap). The second group is why a menu screen
 * belongs in this product rather than in a spreadsheet — it is the input to
 * the availability calculation.
 */

export interface ServiceFormValues {
  categoryId: string;
  storeId: string | null;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
  unattendedStartMinute: number | null;
  unattendedMinutes: number | null;
  isOnlineBookable: boolean;
  allowsDesignation: boolean;
  isActive: boolean;
  displayOrder: number;
  staffIds: string[];
}

export const EMPTY_SERVICE: ServiceFormValues = {
  categoryId: "",
  storeId: null,
  name: "",
  description: "",
  price: 0,
  durationMinutes: 60,
  prepMinutes: 0,
  cleanupMinutes: 0,
  unattendedStartMinute: null,
  unattendedMinutes: null,
  isOnlineBookable: true,
  allowsDesignation: true,
  isActive: true,
  displayOrder: 0,
  staffIds: [],
};

export function ServiceForm({
  serviceId,
  initial,
  categories,
  stores,
  staff,
  locale,
}: {
  serviceId?: string;
  initial: ServiceFormValues;
  categories: Array<{ id: string; name: string }>;
  stores: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; displayName: string }>;
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const en = locale === "en";
  const router = useRouter();

  const [values, setValues] = useState<ServiceFormValues>(initial);
  const [hasGap, setHasGap] = useState(initial.unattendedStartMinute !== null);
  const [problems, setProblems] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function numeric(key: keyof ServiceFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = Number(event.target.value);
      set(key, (Number.isFinite(parsed) ? parsed : 0) as never);
    };
  }

  function toggleStaff(id: string) {
    setValues((current) => ({
      ...current,
      staffIds: current.staffIds.includes(id)
        ? current.staffIds.filter((entry) => entry !== id)
        : [...current.staffIds, id],
    }));
  }

  function submit() {
    setProblems([]);

    const payload = {
      ...values,
      description: values.description.trim() === "" ? null : values.description,
      unattendedStartMinute: hasGap ? (values.unattendedStartMinute ?? 0) : null,
      unattendedMinutes: hasGap ? (values.unattendedMinutes ?? 0) : null,
    };

    startTransition(async () => {
      const result = serviceId
        ? await updateServiceAction({ serviceId, ...payload })
        : await createServiceAction(payload);

      if (!result.ok) {
        setProblems(result.problems ?? [result.error ?? "errors.unexpected"]);
        return;
      }
      router.push("/admin/services");
      router.refresh();
    });
  }

  function archive() {
    if (!serviceId) return;
    if (!window.confirm(t("settings.archiveServiceConfirm"))) return;

    startTransition(async () => {
      const result = await archiveServiceAction(serviceId);
      if (!result.ok) {
        setProblems(result.problems ?? [result.error ?? "errors.unexpected"]);
        return;
      }
      router.push("/admin/services");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        title={serviceId ? t("settings.editService") : t("settings.newService")}
        action={
          serviceId ? (
            <Button type="button" variant="ghost" onClick={archive} disabled={pending}>
              {t("settings.archive")}
            </Button>
          ) : null
        }
      />
      <CardBody className="space-y-5">
        {problems.length > 0 ? (
          <Alert tone="danger">
            <ul className="space-y-1">
              {problems.map((code) => (
                <li key={code}>{t(`problems.${code}`)}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("service.name")} required>
            <Input value={values.name} onChange={(e) => set("name", e.target.value)} />
          </Field>

          <Field label={t("settings.category")} required>
            <Select value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">{en ? "Select…" : "選択してください"}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t("store.title")}
            hint={
              en ? "Leave as all stores unless the price differs" : "店舗を限定する場合のみ選択"
            }
          >
            <Select
              value={values.storeId ?? ""}
              onChange={(e) => set("storeId", e.target.value === "" ? null : e.target.value)}
            >
              <option value="">{t("settings.allStores")}</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("service.price")} required>
            <Input type="number" min={0} value={values.price} onChange={numeric("price")} />
          </Field>
        </div>

        <Field label={en ? "Description" : "説明"}>
          <Textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>

        <div className="border-t border-[--color-border] pt-5">
          <h3 className="text-sm font-semibold">
            {en ? "Time this occupies" : "予約枠として押さえる時間"}
          </h3>

          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Field label={t("settings.duration")} required>
              <Input
                type="number"
                min={1}
                value={values.durationMinutes}
                onChange={numeric("durationMinutes")}
              />
            </Field>
            <Field
              label={t("settings.prep")}
              hint={en ? "Staff-only, before the customer" : "施術前のスタッフ作業"}
            >
              <Input
                type="number"
                min={0}
                value={values.prepMinutes}
                onChange={numeric("prepMinutes")}
              />
            </Field>
            <Field
              label={t("settings.cleanup")}
              hint={en ? "Staff-only, after the customer" : "施術後のスタッフ作業"}
            >
              <Input
                type="number"
                min={0}
                value={values.cleanupMinutes}
                onChange={numeric("cleanupMinutes")}
              />
            </Field>
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasGap}
                onChange={(event) => setHasGap(event.target.checked)}
              />
              {t("settings.unattended")}
            </label>
            <p className="text-xs text-[--color-ink-subtle]">{t("settings.unattendedHint")}</p>

            {hasGap ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("settings.unattendedStart")}>
                  <Input
                    type="number"
                    min={0}
                    value={values.unattendedStartMinute ?? 0}
                    onChange={numeric("unattendedStartMinute")}
                  />
                </Field>
                <Field label={t("settings.unattendedLength")}>
                  <Input
                    type="number"
                    min={1}
                    value={values.unattendedMinutes ?? 0}
                    onChange={numeric("unattendedMinutes")}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[--color-border] pt-5">
          <h3 className="text-sm font-semibold">{t("settings.assignedStaff")}</h3>
          <p className="mt-1 text-xs text-[--color-ink-subtle]">
            {t("settings.assignedStaffHint")}
          </p>

          {staff.length === 0 ? (
            <p className="mt-2 text-xs text-[--color-ink-muted]">{t("settings.setupStaffTodo")}</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-3">
              {staff.map((member) => (
                <label key={member.id} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={values.staffIds.includes(member.id)}
                    onChange={() => toggleStaff(member.id)}
                  />
                  {member.displayName}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 border-t border-[--color-border] pt-5 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={values.isOnlineBookable}
              onChange={(e) => set("isOnlineBookable", e.target.checked)}
            />
            {t("settings.onlineBookable")}
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={values.allowsDesignation}
              onChange={(e) => set("allowsDesignation", e.target.checked)}
            />
            {t("settings.allowsDesignation")}
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            {t("settings.isActive")}
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/services")}>
            {t("settings.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? t("settings.saving") : t("settings.save")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
