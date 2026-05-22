import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALES,
  dictionaries,
  type Locale,
  type MessageKey,
  type Messages,
} from "./dictionaries";

export const LOCALE_COOKIE = "locale";

const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/**
 * Resolve the user's locale.
 *
 * Priority:
 *   1. `locale` cookie (set explicitly via LocaleSwitcher).
 *   2. Accept-Language header — first supported language wins.
 *   3. DEFAULT_LOCALE.
 *
 * NEXT_PUBLIC_SITE_URL / geo IP detection is intentionally not used —
 * Accept-Language reflects the user's stated preference and works in
 * any environment without paid services.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  const h = await headers();
  const accept = h.get("accept-language") ?? "";
  const preferred = accept
    .toLowerCase()
    .split(",")
    .map((part) => part.trim().split(";")[0]);

  for (const lang of preferred) {
    if (lang.startsWith("vi")) return "vi";
    if (lang.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}

export async function getMessages(): Promise<{
  locale: Locale;
  messages: Messages;
}> {
  const locale = await getLocale();
  return { locale, messages: dictionaries[locale] };
}

/** Look up a key in the given messages bag; falls back to the key itself. */
export function t(messages: Messages, key: MessageKey): string {
  return messages[key] ?? key;
}

/** Convenience for Server Components/Actions that don't need the locale. */
export async function tServer(key: MessageKey): Promise<string> {
  const { messages } = await getMessages();
  return t(messages, key);
}
