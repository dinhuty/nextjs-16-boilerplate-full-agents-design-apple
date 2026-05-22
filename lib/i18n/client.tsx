"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale, MessageKey, Messages } from "./dictionaries";

type IntlContextValue = {
  locale: Locale;
  messages: Messages;
};

const IntlContext = createContext<IntlContextValue | null>(null);

type ProviderProps = IntlContextValue & { children: ReactNode };

/**
 * IntlProvider — rendered once near the root, fed by the server-resolved
 * locale + messages from `lib/i18n/server.ts`. Client components read
 * the current locale + lookup via `useT()`.
 */
export function IntlProvider({ locale, messages, children }: ProviderProps) {
  return (
    <IntlContext.Provider value={{ locale, messages }}>
      {children}
    </IntlContext.Provider>
  );
}

/** Hook returning `t(key)` and the current `locale`. */
export function useT() {
  const ctx = useContext(IntlContext);
  if (!ctx) {
    throw new Error("useT must be used within <IntlProvider>");
  }
  const { locale, messages } = ctx;
  const t = (key: MessageKey): string => messages[key] ?? key;
  return { locale, t };
}
