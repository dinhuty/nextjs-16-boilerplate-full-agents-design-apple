"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { tServer } from "@/lib/i18n/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Build the public origin (e.g. http://localhost:3002) from either the
 * NEXT_PUBLIC_SITE_URL env var or the incoming request headers. Used for
 * Supabase email-confirmation `emailRedirectTo` so the link in the email
 * lands back on this app.
 */
async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("host");
  if (!host) return "http://localhost:3002";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export type SignInState = {
  error?: string;
};

export type SignUpState = {
  error?: string;
  message?: string;
};

const isSafeNext = (next: unknown): next is string =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//");

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = formData.get("next");

  if (!email || !password) {
    return { error: await tServer("auth.error_required") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(isSafeNext(nextRaw) ? nextRaw : "/");
}

export async function signUp(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: await tServer("auth.error_required") };
  }
  if (password.length < 8) {
    return { error: await tServer("auth.error_short_password") };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is enabled in Supabase, `session` is null until
  // the user clicks the confirmation link. Otherwise (Auto Confirm User),
  // the user is signed in immediately.
  if (data.session) {
    redirect("/");
  }

  return {
    message: await tServer("signup.confirmation_sent"),
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
