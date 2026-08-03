"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInAction, type SignInState } from "@/server/auth/actions";
import { getTranslator } from "@/i18n";
import { Alert, Button, Card, CardBody, Field, Input } from "@/components/ui/primitives";

const t = getTranslator("admin", "ja");

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? t("common.loading") : t("auth.signInButton")}
    </Button>
  );
}

export function SignInForm() {
  const [state, formAction] = useActionState<SignInState, FormData>(signInAction, {});

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="space-y-4" noValidate>
          {state.error ? <Alert tone="danger">{t(state.error)}</Alert> : null}

          <Field label={t("auth.email")} htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              required
              aria-describedby={state.error ? "signin-error" : undefined}
            />
          </Field>

          <Field label={t("auth.password")} htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>

          <SubmitButton />
        </form>
      </CardBody>
    </Card>
  );
}
