"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALES, type Locale } from "./dictionaries";
import { LOCALE_COOKIE } from "./server";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/**
 * Persist the user's locale preference for one year and re-render the
 * whole tree so server-rendered text picks up the new locale.
 */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
