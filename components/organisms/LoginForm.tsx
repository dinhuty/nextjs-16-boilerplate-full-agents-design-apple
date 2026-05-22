"use client";

import { type FormEvent, useActionState, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { FormField } from "@/components/molecules/FormField";
import { signIn, type SignInState } from "@/app/login/actions";
import { useT } from "@/lib/i18n/client";

const INITIAL_STATE: SignInState = {};

type Step = "email" | "password";

const isValidEmail = (value: string) => /.+@.+\..+/.test(value);

type Props = {
  next?: string;
};

export function LoginForm({ next }: Props) {
  const { t } = useT();
  const [state, formAction, pending] = useActionState(signIn, INITIAL_STATE);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  const emailValid = isValidEmail(email);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (step === "email") {
      event.preventDefault();
      if (emailValid) setStep("password");
    }
  };

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-lg"
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {step === "email" ? (
        <>
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
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
          />
          <Button
            type="submit"
            variant="primary-rect"
            disabled={!emailValid || pending}
            className="w-full mt-sm"
          >
            {t("login.continue")}
          </Button>
        </>
      ) : (
        <>
          <input type="hidden" name="email" value={email} />
          <div className="flex items-center justify-between gap-md bg-canvas border border-hairline rounded-md px-md py-sm">
            <span className="text-body text-ink truncate">{email}</span>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-caption-strong text-primary hover:underline outline-none"
            >
              {t("auth.edit")}
            </button>
          </div>
          <FormField
            label={t("auth.password")}
            name="password"
            type="password"
            placeholder={t("auth.password_placeholder_signin")}
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            required
            autoFocus
            disabled={pending}
          />
          <ErrorMessage>{state.error}</ErrorMessage>
          <Button
            type="submit"
            variant="primary-rect"
            disabled={pending}
            className="w-full mt-sm"
          >
            {pending ? t("login.submit_pending") : t("login.submit")}
          </Button>
        </>
      )}
    </form>
  );
}
