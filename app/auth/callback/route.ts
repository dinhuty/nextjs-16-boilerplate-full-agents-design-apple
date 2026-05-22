import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Supabase email-confirmation / OAuth callback.
 *
 * Supabase appends `?code=...&next=...` to the URL we registered as the
 * email-confirmation redirect target. We exchange that code for a session
 * (sets the auth cookies) and then forward the user to `next` (default `/`).
 *
 * Triggered by:
 *   • email signUp confirmation link
 *   • magic-link sign-in
 *   • OAuth providers (when added)
 *
 * Requires `/auth` to be in `PUBLIC_PATHS` in utils/supabase/middleware.ts
 * so the user can reach this route while still unauthenticated.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
