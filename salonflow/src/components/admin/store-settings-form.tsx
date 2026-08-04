"use client";

import { useState, useTransition } from "react";

import { getTranslator } from "@/i18n";
import { updateStoreSettingsAction } from "@/server/modules/settings/actions";
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
 * Store profile and booking policy.
 *
 * The booking policy fields are not cosmetic — they feed the availability
 * calculation directly, so each one is explained rather than left as a bare
 * number the operator has to guess at.
 */

export interface StoreSettingsValues {
  name: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  approvalMode: "instant" | "request";
  slotIntervalMinutes: number;
  bookingCutoffMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  bufferMinutes: number;
  cancelDeadlineHours: number;
}

export function StoreSettingsForm({
  storeId,
  slug,
  initial,
  locale,
}: {
  storeId: string;
  slug: string;
  initial: StoreSettingsValues;
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const en = locale === "en";

  const [values, setValues] = useState<StoreSettingsValues>(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof StoreSettingsValues>(key: K, value: StoreSettingsValues[K]) {
    setSaved(false);
    setValues((current) => ({ ...current, [key]: value }));
  }

  function number(key: keyof StoreSettingsValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = Number(event.target.value);
      // NaN would fail the schema with an opaque "validation" code; keeping the
      // previous number until a real one is typed keeps the message useful.
      set(key, (Number.isFinite(parsed) ? parsed : 0) as never);
    };
  }

  function submit() {
    setProblems([]);
    setSaved(false);

    startTransition(async () => {
      const result = await updateStoreSettingsAction({
        storeId,
        name: values.name,
        phone: values.phone || null,
        postalCode: values.postalCode || null,
        prefecture: values.prefecture || null,
        city: values.city || null,
        addressLine: values.addressLine || null,
        approvalMode: values.approvalMode,
        slotIntervalMinutes: values.slotIntervalMinutes,
        bookingCutoffMinutes: values.bookingCutoffMinutes,
        minAdvanceMinutes: values.minAdvanceMinutes,
        maxAdvanceDays: values.maxAdvanceDays,
        bufferMinutes: values.bufferMinutes,
        cancelDeadlineHours: values.cancelDeadlineHours,
      });

      if (!result.ok) {
        setProblems(result.problems ?? [result.error ?? "errors.unexpected"]);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <Card>
      <CardHeader title={t("settings.storeSettings")} description={`/booking/${slug}`} />
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

        {saved ? <Alert tone="positive">{t("settings.saved")}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("store.name")}>
            <Input value={values.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label={en ? "Phone" : "電話番号"}>
            <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label={en ? "Postal code" : "郵便番号"}>
            <Input value={values.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
          </Field>
          <Field label={en ? "Prefecture" : "都道府県"}>
            <Input value={values.prefecture} onChange={(e) => set("prefecture", e.target.value)} />
          </Field>
          <Field label={en ? "City" : "市区町村"}>
            <Input value={values.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label={en ? "Address" : "番地・建物名"}>
            <Input
              value={values.addressLine}
              onChange={(e) => set("addressLine", e.target.value)}
            />
          </Field>
        </div>

        <p className="text-xs text-[--color-ink-subtle]">
          {en
            ? "The public booking URL cannot be changed here — it is printed on cards and posters, and changing it would break every link already handed out."
            : "公開URL（スラッグ）はここでは変更できません。名刺やチラシに印刷済みのリンクが一斉に切れるためです。"}
        </p>

        <div className="border-t border-[--color-border] pt-5">
          <h3 className="text-sm font-semibold">{t("store.bookingPolicy")}</h3>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label={t("store.approvalMode")}>
              <Select
                value={values.approvalMode}
                onChange={(e) => set("approvalMode", e.target.value as "instant" | "request")}
              >
                <option value="instant">{t("store.instant")}</option>
                <option value="request">{t("store.request")}</option>
              </Select>
            </Field>

            <Field
              label={t("store.slotInterval")}
              hint={en ? "Minutes between offered start times" : "予約枠を刻む間隔（分）"}
            >
              <Input
                type="number"
                min={5}
                max={60}
                value={values.slotIntervalMinutes}
                onChange={number("slotIntervalMinutes")}
              />
            </Field>

            <Field
              label={t("store.cutoff")}
              hint={
                en
                  ? "Online booking closes this many minutes before the start time"
                  : "この分数前にオンライン受付を締め切ります"
              }
            >
              <Input
                type="number"
                min={0}
                value={values.bookingCutoffMinutes}
                onChange={number("bookingCutoffMinutes")}
              />
            </Field>

            <Field
              label={en ? "Minimum advance (minutes)" : "最短受付（分前）"}
              hint={
                en
                  ? "Blocks same-minute bookings that leave no preparation time"
                  : "直前すぎる予約を防ぎます"
              }
            >
              <Input
                type="number"
                min={0}
                value={values.minAdvanceMinutes}
                onChange={number("minAdvanceMinutes")}
              />
            </Field>

            <Field
              label={t("store.maxAdvance")}
              hint={en ? "How far ahead customers may book" : "何日先まで予約を受けるか"}
            >
              <Input
                type="number"
                min={1}
                max={365}
                value={values.maxAdvanceDays}
                onChange={number("maxAdvanceDays")}
              />
            </Field>

            <Field
              label={t("store.buffer")}
              hint={
                en
                  ? "Added after every appointment for tidying up"
                  : "各予約の後に確保する片付け時間"
              }
            >
              <Input
                type="number"
                min={0}
                max={120}
                value={values.bufferMinutes}
                onChange={number("bufferMinutes")}
              />
            </Field>

            <Field
              label={t("store.cancelDeadline")}
              hint={
                en
                  ? "Customers cannot cancel online inside this window"
                  : "この時間を切ると顧客側からキャンセルできません"
              }
            >
              <Input
                type="number"
                min={0}
                value={values.cancelDeadlineHours}
                onChange={number("cancelDeadlineHours")}
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? t("settings.saving") : t("settings.save")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
