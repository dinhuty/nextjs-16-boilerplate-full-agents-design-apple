import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/**
 * Apple-style text input.
 *
 * Radius: `rounded-md` (11px per DESIGN.md `rounded.md`).
 * - DESIGN.md does not spec a general form input — the only input it
 *   tokenizes is `search-input` (pill, action-flavored). For non-search
 *   text fields, 11px is the closest token to Apple's actual auth-page
 *   input (~12–14px) and pairs naturally with `button-primary-rect`
 *   and `button-pearl-capsule` which also use rounded-md.
 * - 56px height (`h-14`) — comfortable touch target above iOS 44pt minimum.
 * - Hover darkens the hairline; focus switches to Action Blue. No glow.
 * - Error state uses Tailwind's red (DESIGN.md doesn't tokenize errors).
 *
 * Override with `className="rounded-lg"` (or any radius token) when the
 * surface calls for it — e.g. a search field should pass
 * `className="rounded-pill"` to match DESIGN.md `search-input`.
 */
export function Input({ invalid, className = "", ...rest }: Props) {
  const base =
    "w-full h-14 bg-canvas text-ink text-body border rounded-md px-md outline-none transition-colors placeholder:text-ink-muted-48";
  const state = invalid
    ? "border-red-500 focus:border-red-500"
    : "border-hairline hover:border-ink-muted-48 focus:border-primary";
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`${base} ${state} ${className}`}
      {...rest}
    />
  );
}
