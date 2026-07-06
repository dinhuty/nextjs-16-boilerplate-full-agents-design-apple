"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/app/(auth)/register/actions";
import type { AuthState } from "@/app/(auth)/login/actions";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUp,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-md">
      <FormField label="Username" htmlFor="username">
        <Input
          id="username"
          name="username"
          placeholder="your-username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          disabled={pending}
          required
        />
      </FormField>
      <FormField label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="at least 4 characters"
          autoComplete="new-password"
          autoCapitalize="none"
          spellCheck={false}
          disabled={pending}
          required
        />
      </FormField>
      <ErrorMessage>{state?.error}</ErrorMessage>
      {state?.message ? (
        <p className="rounded-md bg-brand-green-deep/10 px-md py-sm text-body-sm text-brand-green-deep">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-caption text-stone">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
