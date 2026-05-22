"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { FormField } from "@/components/molecules/FormField";
import { signUp, type SignUpState } from "@/app/login/actions";
import { useT } from "@/lib/i18n/client";

const INITIAL_STATE: SignUpState = {};

export function SignUpForm() {
  const { t } = useT();
  const [state, formAction, pending] = useActionState(signUp, INITIAL_STATE);

  return (
    <form action={formAction} className="w-full flex flex-col gap-lg">
      <FormField
        label={t("auth.email")}
        name="email"
        type="email"
        placeholder={t("auth.email_placeholder")}
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        disabled={pending}
      />
      <FormField
        label={t("auth.password")}
        name="password"
        type="password"
        placeholder={t("auth.password_placeholder_signup")}
        autoComplete="new-password"
        autoCapitalize="none"
        spellCheck={false}
        minLength={8}
        required
        disabled={pending}
      />
      {state.message ? (
        <p
          role="status"
          aria-live="polite"
          className="text-caption text-ink-muted-80 bg-canvas border border-hairline rounded-md p-sm"
        >
          {state.message}
        </p>
      ) : null}
      <ErrorMessage>{state.error}</ErrorMessage>
      <Button
        type="submit"
        variant="primary-rect"
        disabled={pending}
        className="mt-sm w-full"
      >
        {pending ? t("signup.submit_pending") : t("signup.submit")}
      </Button>
    </form>
  );
}
