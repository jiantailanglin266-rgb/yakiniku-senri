"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { getTranslator } from "@/i18n";
import { saveRecordAction } from "@/server/modules/medical-records/actions";
import {
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
 * Chart entry form.
 *
 * The industry-specific part of a chart is data, not code: the template
 * supplies its fields and this component renders whatever it is given. Adding
 * "使用ジェルブランド" to the nail template needs no change here.
 */

export interface TemplateField {
  id: string;
  key: string;
  label: string;
  type: string;
  section: string | null;
  options: Array<{ value: string; label: string }>;
  isRequired: boolean;
  helpText: string | null;
  placeholder: string | null;
}

export interface TemplateSummary {
  id: string;
  name: string;
  fields: TemplateField[];
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中…" : label}
    </Button>
  );
}

export function RecordForm({
  customerId,
  storeId,
  appointmentId,
  visitedAtISO,
  templates,
  locale,
  initial,
}: {
  customerId: string;
  storeId: string;
  appointmentId: string | null;
  visitedAtISO: string;
  templates: TemplateSummary[];
  locale: "ja" | "en";
  initial?: {
    recordId?: string;
    templateId?: string;
    serviceSummary?: string | null;
    productsUsed?: string | null;
    cautionNote?: string | null;
    customerRequest?: string | null;
    result?: string | null;
    nextProposal?: string | null;
    staffNote?: string | null;
    values?: Record<string, unknown>;
  };
}) {
  const t = getTranslator("admin", locale);
  const [templateId, setTemplateId] = useState(initial?.templateId ?? templates[0]?.id ?? "");

  const template = templates.find((entry) => entry.id === templateId) ?? templates[0];

  const sections = useMemo(() => {
    const grouped = new Map<string, TemplateField[]>();
    for (const field of template?.fields ?? []) {
      const key = field.section ?? "その他";
      const bucket = grouped.get(key) ?? [];
      bucket.push(field);
      grouped.set(key, bucket);
    }
    return [...grouped.entries()];
  }, [template]);

  return (
    <form action={saveRecordAction} className="space-y-4">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="storeId" value={storeId} />
      {appointmentId ? <input type="hidden" name="appointmentId" value={appointmentId} /> : null}
      {initial?.recordId ? <input type="hidden" name="recordId" value={initial.recordId} /> : null}

      <Card>
        <CardHeader title={t("medicalRecord.title")} />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Field label={t("medicalRecord.visitedAt")} htmlFor="visitedAt" required>
            <Input
              id="visitedAt"
              name="visitedAt"
              type="date"
              defaultValue={visitedAtISO}
              required
            />
          </Field>

          <Field label={t("medicalRecord.template")} htmlFor="templateId" required>
            <Select
              id="templateId"
              name="templateId"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              required
            >
              {templates.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="md:col-span-2">
            <Field label={t("medicalRecord.serviceSummary")} htmlFor="serviceSummary">
              <Textarea
                id="serviceSummary"
                name="serviceSummary"
                defaultValue={initial?.serviceSummary ?? ""}
              />
            </Field>
          </div>

          <Field label={t("medicalRecord.productsUsed")} htmlFor="productsUsed">
            <Input
              id="productsUsed"
              name="productsUsed"
              defaultValue={initial?.productsUsed ?? ""}
            />
          </Field>

          <Field label={t("medicalRecord.cautionNote")} htmlFor="cautionNote">
            <Input id="cautionNote" name="cautionNote" defaultValue={initial?.cautionNote ?? ""} />
          </Field>

          <Field label={t("medicalRecord.customerRequest")} htmlFor="customerRequest">
            <Textarea
              id="customerRequest"
              name="customerRequest"
              defaultValue={initial?.customerRequest ?? ""}
            />
          </Field>

          <Field label={t("medicalRecord.result")} htmlFor="result">
            <Textarea id="result" name="result" defaultValue={initial?.result ?? ""} />
          </Field>

          <Field label={t("medicalRecord.nextProposal")} htmlFor="nextProposal">
            <Textarea
              id="nextProposal"
              name="nextProposal"
              defaultValue={initial?.nextProposal ?? ""}
            />
          </Field>

          <Field label={t("medicalRecord.staffNote")} htmlFor="staffNote">
            <Textarea id="staffNote" name="staffNote" defaultValue={initial?.staffNote ?? ""} />
          </Field>
        </CardBody>
      </Card>

      {sections.map(([section, fields]) => (
        <Card key={section}>
          <CardHeader title={section} />
          <CardBody className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <DynamicField
                key={field.id}
                field={field}
                initialValue={initial?.values?.[field.id]}
              />
            ))}
          </CardBody>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        <SubmitButton label={t("common.save")} />
      </div>
    </form>
  );
}

function DynamicField({ field, initialValue }: { field: TemplateField; initialValue: unknown }) {
  const name = `field:${field.id}`;
  const inputId = `field-${field.id}`;

  const asString = typeof initialValue === "string" ? initialValue : "";
  const asArray = Array.isArray(initialValue) ? initialValue.map(String) : [];

  switch (field.type) {
    case "textarea":
    case "color_formula":
      return (
        <div className="md:col-span-2">
          <Field
            label={field.label}
            htmlFor={inputId}
            required={field.isRequired}
            hint={field.helpText ?? undefined}
          >
            <Textarea
              id={inputId}
              name={name}
              defaultValue={asString}
              placeholder={field.placeholder ?? undefined}
              required={field.isRequired}
            />
          </Field>
        </div>
      );

    case "number":
      return (
        <Field
          label={field.label}
          htmlFor={inputId}
          required={field.isRequired}
          hint={field.helpText ?? undefined}
        >
          <Input
            id={inputId}
            name={name}
            type="number"
            inputMode="numeric"
            defaultValue={asString}
            required={field.isRequired}
          />
        </Field>
      );

    case "date":
      return (
        <Field label={field.label} htmlFor={inputId} required={field.isRequired}>
          <Input
            id={inputId}
            name={name}
            type="date"
            defaultValue={asString}
            required={field.isRequired}
          />
        </Field>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2 pt-5">
          <input
            id={inputId}
            name={name}
            type="checkbox"
            value="true"
            defaultChecked={initialValue === true || asString === "true"}
            className="size-4"
          />
          <label htmlFor={inputId} className="text-sm text-[--color-ink]">
            {field.label}
          </label>
        </div>
      );

    case "select":
      return (
        <Field
          label={field.label}
          htmlFor={inputId}
          required={field.isRequired}
          hint={field.helpText ?? undefined}
        >
          <Select id={inputId} name={name} defaultValue={asString} required={field.isRequired}>
            <option value="">—</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      );

    case "multi_select":
      return (
        <fieldset className="space-y-1 md:col-span-2">
          <legend className="text-xs font-medium text-[--color-ink]">{field.label}</legend>
          <div className="flex flex-wrap gap-3">
            {field.options.map((option) => (
              <label key={option.value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  defaultChecked={asArray.includes(option.value)}
                  className="size-4"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      );

    case "photo":
    case "signature":
      // PLACEHOLDER: file upload is Phase 2. The field is shown so the chart's
      // shape is honest about what it will hold, but it does not pretend to
      // accept a file it cannot store yet.
      return (
        <Field label={field.label} htmlFor={inputId}>
          <p className="rounded-md border border-dashed border-[--color-border] px-3 py-2 text-xs text-[--color-ink-subtle]">
            画像・署名の登録は Phase 2 で対応予定です。
          </p>
        </Field>
      );

    case "text":
    default:
      return (
        <Field
          label={field.label}
          htmlFor={inputId}
          required={field.isRequired}
          hint={field.helpText ?? undefined}
        >
          <Input
            id={inputId}
            name={name}
            defaultValue={asString}
            placeholder={field.placeholder ?? undefined}
            required={field.isRequired}
          />
        </Field>
      );
  }
}
