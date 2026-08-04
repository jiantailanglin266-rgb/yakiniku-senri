"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { EmploymentType } from "@prisma/client";

import { getTranslator } from "@/i18n";
import {
  archiveStaffAction,
  createStaffAction,
  updateStaffAction,
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
} from "@/components/ui/primitives";

/**
 * Staff editor.
 *
 * A staff member here is a person the schedule can assign, not a login. Most
 * stylists never sign in, so nothing on this form asks for a password.
 */

/**
 * Re-exported from the schema rather than hand-written. A locally maintained
 * union silently drops values when the enum grows — `trainee` was missed
 * exactly that way.
 */
export type { EmploymentType } from "@prisma/client";

export interface StaffFormValues {
  name: string;
  nameKana: string;
  displayName: string;
  title: string;
  employmentType: EmploymentType;
  designationFee: number;
  /** Percent as shown to the operator; converted to basis points on submit. */
  commissionPercent: string;
  maxConcurrent: number;
  maxDailyAppointments: string;
  isBookable: boolean;
  isPubliclyVisible: boolean;
  displayOrder: number;
  storeIds: string[];
}

export const EMPTY_STAFF: StaffFormValues = {
  name: "",
  nameKana: "",
  displayName: "",
  title: "",
  employmentType: "full_time",
  designationFee: 0,
  commissionPercent: "",
  maxConcurrent: 1,
  maxDailyAppointments: "",
  isBookable: true,
  isPubliclyVisible: true,
  displayOrder: 0,
  storeIds: [],
};

export function StaffForm({
  staffId,
  initial,
  stores,
  locale,
}: {
  staffId?: string;
  initial: StaffFormValues;
  stores: Array<{ id: string; name: string }>;
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const en = locale === "en";
  const router = useRouter();

  const [values, setValues] = useState<StaffFormValues>(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleStore(id: string) {
    setValues((current) => ({
      ...current,
      storeIds: current.storeIds.includes(id)
        ? current.storeIds.filter((entry) => entry !== id)
        : [...current.storeIds, id],
    }));
  }

  function payload() {
    const percent = values.commissionPercent.trim();
    const daily = values.maxDailyAppointments.trim();

    return {
      name: values.name,
      nameKana: values.nameKana.trim() || null,
      // Falling back to the legal name keeps the booking page from showing a
      // blank where a stylist should be.
      displayName: values.displayName.trim() || values.name.trim(),
      title: values.title.trim() || null,
      employmentType: values.employmentType,
      designationFee: values.designationFee,
      // Basis points: 12.5% is 1250, which an integer percent field would lose.
      commissionBps: percent === "" ? null : Math.round(Number(percent) * 100),
      maxConcurrent: values.maxConcurrent,
      maxDailyAppointments: daily === "" ? null : Number(daily),
      isBookable: values.isBookable,
      isPubliclyVisible: values.isPubliclyVisible,
      displayOrder: values.displayOrder,
      storeIds: values.storeIds,
    };
  }

  function submit() {
    setProblems([]);
    setWarnings([]);

    const data = payload();

    if (data.commissionBps !== null && !Number.isFinite(data.commissionBps)) {
      setProblems(["staff.commission_out_of_range"]);
      return;
    }
    if (data.maxDailyAppointments !== null && !Number.isFinite(data.maxDailyAppointments)) {
      setProblems(["staff.max_daily_invalid"]);
      return;
    }

    startTransition(async () => {
      const result = staffId
        ? await updateStaffAction({ staffId, ...data })
        : await createStaffAction(data);

      if (!result.ok) {
        setProblems(result.problems ?? [result.error ?? "errors.unexpected"]);
        return;
      }
      router.push("/admin/staff");
      router.refresh();
    });
  }

  function archive() {
    if (!staffId) return;
    if (!window.confirm(t("settings.archiveStaffConfirm"))) return;

    startTransition(async () => {
      const result = await archiveStaffAction(staffId);
      if (!result.ok) {
        setProblems(result.problems ?? [result.error ?? "errors.unexpected"]);
        return;
      }

      // Archiving succeeded but future appointments are still assigned. Keep
      // the operator here to read that rather than bouncing them to the list.
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
        return;
      }

      router.push("/admin/staff");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        title={staffId ? t("settings.editStaff") : t("settings.newStaff")}
        action={
          staffId ? (
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

        {warnings.map((code) => {
          const [key, count] = code.split(":");
          return (
            <Alert key={code} tone="warning">
              {t(`problems.${key}`).replace("{count}", count ?? "")}
            </Alert>
          );
        })}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={en ? "Name" : "氏名"} required>
            <Input value={values.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label={en ? "Name (kana)" : "ふりがな"}>
            <Input value={values.nameKana} onChange={(e) => set("nameKana", e.target.value)} />
          </Field>
          <Field
            label={t("staff.displayName")}
            hint={en ? "Shown to customers. Defaults to the name." : "予約ページに表示される名前"}
          >
            <Input
              value={values.displayName}
              onChange={(e) => set("displayName", e.target.value)}
            />
          </Field>
          <Field label={en ? "Title" : "肩書き"}>
            <Input value={values.title} onChange={(e) => set("title", e.target.value)} />
          </Field>

          <Field label={t("staff.employmentType")}>
            <Select
              value={values.employmentType}
              onChange={(e) => set("employmentType", e.target.value as EmploymentType)}
            >
              <option value="full_time">{en ? "Full time" : "正社員"}</option>
              <option value="part_time">{en ? "Part time" : "アルバイト・パート"}</option>
              <option value="contract">{en ? "Contract" : "契約"}</option>
              <option value="freelance">{en ? "Freelance" : "業務委託"}</option>
              <option value="trainee">{en ? "Trainee" : "研修生"}</option>
            </Select>
          </Field>

          <Field label={t("staff.designationFee")}>
            <Input
              type="number"
              min={0}
              value={values.designationFee}
              onChange={(e) => set("designationFee", Number(e.target.value) || 0)}
            />
          </Field>

          <Field
            label={t("settings.commission")}
            hint={en ? "Leave empty if not applicable" : "該当しない場合は空欄"}
          >
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={values.commissionPercent}
              onChange={(e) => set("commissionPercent", e.target.value)}
            />
          </Field>

          <Field
            label={t("settings.maxConcurrent")}
            hint={
              en
                ? "Above 1 lets this person hold overlapping appointments"
                : "2 以上にすると同時進行の予約を持てます"
            }
          >
            <Input
              type="number"
              min={1}
              max={10}
              value={values.maxConcurrent}
              onChange={(e) => set("maxConcurrent", Number(e.target.value) || 1)}
            />
          </Field>

          <Field label={t("settings.maxDaily")} hint={en ? "Optional" : "任意"}>
            <Input
              type="number"
              min={1}
              value={values.maxDailyAppointments}
              onChange={(e) => set("maxDailyAppointments", e.target.value)}
            />
          </Field>

          <Field label={t("settings.displayOrder")}>
            <Input
              type="number"
              value={values.displayOrder}
              onChange={(e) => set("displayOrder", Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <div className="border-t border-[--color-border] pt-5">
          <h3 className="text-sm font-semibold">{t("staff.stores")}</h3>
          <p className="mt-1 text-xs text-[--color-ink-subtle]">
            {en
              ? "The first one selected becomes the home store."
              : "最初に選んだ店舗が所属店舗になります。"}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {stores.map((store) => (
              <label key={store.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.storeIds.includes(store.id)}
                  onChange={() => toggleStore(store.id)}
                />
                {store.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 border-t border-[--color-border] pt-5 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={values.isBookable}
              onChange={(e) => set("isBookable", e.target.checked)}
            />
            {t("settings.isBookable")}
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={values.isPubliclyVisible}
              onChange={(e) => set("isPubliclyVisible", e.target.checked)}
            />
            {t("settings.isPubliclyVisible")}
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/staff")}>
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
