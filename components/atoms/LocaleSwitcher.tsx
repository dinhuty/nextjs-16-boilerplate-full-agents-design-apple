"use client";

import { useTransition } from "react";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import { setLocale } from "@/lib/i18n/actions";
import { useT } from "@/lib/i18n/client";

const LABEL_KEY: Record<Locale, "locale.english" | "locale.vietnamese"> = {
  en: "locale.english",
  vi: "locale.vietnamese",
};

/**
 * Simple text-link locale switcher. Renders the *other* locale's label
 * (e.g. shows "Tiếng Việt" while current is English). Persists via cookie
 * through `setLocale` Server Action, then re-renders the layout.
 */
export function LocaleSwitcher() {
  const { locale, t } = useT();
  const [pending, startTransition] = useTransition();

  const other = LOCALES.find((l) => l !== locale) ?? locale;
  const label = t(LABEL_KEY[other]);

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          void setLocale(other);
        })
      }
      disabled={pending}
      className="text-caption text-ink-muted-80 hover:text-ink underline-offset-4 hover:underline outline-none disabled:opacity-50"
      aria-label={`Switch language to ${label}`}
    >
      {label}
    </button>
  );
}
