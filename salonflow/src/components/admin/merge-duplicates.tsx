"use client";

import { useState, useTransition } from "react";

import { getTranslator } from "@/i18n";
import { mergeCustomersAction } from "@/server/modules/customers/actions";
import { Alert, Badge, Button, Card, CardBody, CardHeader } from "@/components/ui/primitives";

interface Candidate {
  id: string;
  name: string;
  nameKana: string | null;
  phone: string | null;
  email: string | null;
  score: number;
  lastVisitAt: string | null;
}

/**
 * Duplicate customer merge.
 *
 * The system only ever *suggests*; a merge moves years of history and is not
 * reversible through the UI, so it always requires an explicit human decision
 * plus a confirmation.
 */
export function MergeDuplicates({
  targetId,
  targetName,
  candidates,
  locale,
}: {
  targetId: string;
  targetName: string;
  candidates: Candidate[];
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function merge(sourceId: string) {
    if (!window.confirm(t("customer.mergeConfirm"))) return;

    setError(null);
    startTransition(async () => {
      const result = await mergeCustomersAction({ targetId, sourceId });
      if (!result.ok) setError(result.error ?? t("errors.unexpected"));
    });
  }

  return (
    <Card>
      <CardHeader
        title={t("customer.duplicates")}
        description={`${targetName} と同一人物の可能性がある顧客`}
      />
      <CardBody className="space-y-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <ul className="space-y-2">
          {candidates.map((candidate) => (
            <li
              key={candidate.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[--color-border] px-3 py-2"
            >
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  {candidate.name}
                  {candidate.nameKana ? (
                    <span className="ml-2 text-xs text-[--color-ink-subtle]">
                      {candidate.nameKana}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-[--color-ink-muted]">
                  {[candidate.phone, candidate.email, candidate.lastVisitAt]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={candidate.score >= 80 ? "danger" : "warning"}>
                  一致度 {candidate.score}
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => merge(candidate.id)}
                >
                  {t("customer.merge")}
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-xs text-[--color-ink-subtle]">{t("customer.mergeConfirm")}</p>
      </CardBody>
    </Card>
  );
}
