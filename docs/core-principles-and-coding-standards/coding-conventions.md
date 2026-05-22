# Coding Conventions

Conventions for routing, components, data flow, styling, and config in ad-manager.

> Before writing Next.js code, read the matching guide in `node_modules/next/dist/docs/01-app/`. This version may differ from your training data.

## General principles

- **Readability first** — Code should be self-documenting; reach for a comment only when the *why* is non-obvious.
- **Consistency** — Follow existing patterns in `app/` and this docs/ folder before inventing new ones.
- **Surgical changes** — Touch only what the task requires; don't refactor adjacent code unless asked.

## Routing (App Router)

- Define routes by creating folders under `app/`; add `page.tsx` to expose a URL.
- Use `loading.tsx` / `error.tsx` / `not-found.tsx` for the standard async + failure UX instead of hand-rolling state.
- Client-side navigation: `<Link href="...">` from `next/link`; programmatic from `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`).
- `params` and `searchParams` are **async** — `await` them in Server Components.

## Components

- **Server by default.** Add `"use client"` only when the file needs state, effects, event handlers, or browser APIs.
- **Compose, don't dump.** Break large pages into smaller components; keep route files (`page.tsx`, `layout.tsx`) lean.
- **TypeScript:** type props explicitly; avoid `any` — prefer `unknown` and narrow.

## Data fetching

- Fetch in Server Components with `fetch()` — Next.js extends `fetch` with caching options (`cache: 'force-cache' | 'no-store'`, `next: { revalidate, tags }`). Read `06-fetching-data.md` and `08-caching.md`.
- Don't fetch in Client Components when a parent Server Component can fetch and pass data down.
- Don't use `getServerSideProps` / `getStaticProps` — those are Pages Router and not available here.

## Mutations and forms

- Use **Server Actions** (`"use server"` functions). Forms submit directly to Server Actions; pair with `revalidatePath` / `revalidateTag` to refresh caches.
- Read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` before implementing forms.

## API endpoints

- For HTTP endpoints inside the app, create `app/<segment>/route.ts` with `GET` / `POST` / etc. exports. Reference: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`.
- Don't introduce a new HTTP client wrapper unless the codebase needs one across many call sites.

## Styling

- **Tailwind CSS 4.** Use utility classes in JSX; global styles go in `app/globals.css`.
- Follow [DESIGN.md](../../DESIGN.md) (project root, managed by `getdesign` CLI) for tokens, spacing scale, typography, and component-level conventions.
- Avoid inline `style={{ ... }}` for things Tailwind can express. Reserve it for truly dynamic values.

## Form patterns (Apple HIG)

Form UI in this project follows Apple HIG conventions for text fields. Reference: [Apple HIG — Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields). The same rules are baked into [`Input`](../../../components/atoms/Input.tsx) and [`FormField`](../../../components/molecules/FormField.tsx).

- **Label above the field.** Do not use placeholder text as the primary label. Placeholder is for *helper / example content* (e.g. `name@example.com`).
- **Always provide a placeholder.** Helps users know what shape of input is expected, especially for email and dates. Keep it concise and concrete.
- **Use `rounded-md` (11px) for inputs**, not `rounded-pill`. Pill radius is reserved for action buttons and search inputs per DESIGN.md.
- **Input height 48px** (`h-12`) — comfortable touch target above the iOS 44pt minimum.
- **Hover state** darkens the hairline border (`hover:border-ink-muted-48`); **focus** switches to Action Blue (`focus:border-primary`). No glow / ring — Apple is subtle.
- **Autocomplete hints are mandatory** for any field a browser can autofill:
  - Email: `autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}`
  - Sign-in password: `autoComplete="current-password" autoCapitalize="none" spellCheck={false}`
  - Sign-up / change password: `autoComplete="new-password"` (same other attributes)
  - Name / address fields: see the [WHATWG autocomplete token list](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill).
- **Errors render below the field** in red caption text via [`ErrorMessage`](../../../components/atoms/ErrorMessage.tsx). Use inline server-side errors from `useActionState`; do not block the UI on errors.
- **Disabled state during submission.** Disable all inputs + the submit button while `pending` is true so the form can't be double-submitted. The submit button label switches to a progress phrase (`"Signing in…"`).
- **Server Actions** are co-located with the route that uses them (`app/<segment>/actions.ts`). Return `{ error?: string; message?: string }` shape; redirect on success.

See the canonical implementations in [`LoginForm`](../../../components/organisms/LoginForm.tsx) and [`SignUpForm`](../../../components/organisms/SignUpForm.tsx).

## Configuration

- All Next.js config in `next.config.ts`. Validate options against `node_modules/next/dist/docs/01-app/03-api-reference/05-config/` — long-removed flags (e.g. `experimental.appDir`) must not be re-introduced.
- Port is **not** a `next.config.ts` option. It is set in `package.json` scripts (`next dev -p 3002`, `next start -p 3002`) or via the `PORT` env var.

## Internationalization (i18n)

The app ships English (`en`) and Vietnamese (`vi`). All user-facing strings live in [`lib/i18n/dictionaries.ts`](../../../lib/i18n/dictionaries.ts). Hard-coding visible text in components is a code smell — use the helpers below.

### How locale is resolved

[`lib/i18n/server.ts`](../../../lib/i18n/server.ts) `getLocale()` picks, in order:

1. The `locale` cookie (set when the user clicks the [`LocaleSwitcher`](../../../components/atoms/LocaleSwitcher.tsx)).
2. The first supported language in the `Accept-Language` header.
3. `DEFAULT_LOCALE` (`"en"`).

The resolved locale flows through `<IntlProvider>` in [`app/layout.tsx`](../../../app/layout.tsx) so every client component can call `useT()`.

### Reading translations

**Server Components / Route Handlers / Server Actions:**

```tsx
import { getMessages, t, tServer } from "@/lib/i18n/server";

// Read multiple keys at once
const { messages } = await getMessages();
<h1>{t(messages, "login.title")}</h1>

// Single key, no need to keep the messages object
const error = await tServer("auth.error_required");
```

**Client Components:**

```tsx
"use client";
import { useT } from "@/lib/i18n/client";

const { locale, t } = useT();
return <button>{t("login.continue")}</button>;
```

### Adding a new string

1. Add the key to `en` and `vi` in [`lib/i18n/dictionaries.ts`](../../../lib/i18n/dictionaries.ts). TypeScript will reject the file if `vi` is missing a key that `en` has.
2. Use it via `t()` / `useT()` as above.
3. Group keys by surface (`login.*`, `signup.*`, `home.*`, `auth.*`, …) so the file stays scannable.

### Adding a new locale

1. Add it to `LOCALES` in `dictionaries.ts`.
2. Add the matching dictionary.
3. Extend the `Accept-Language` matcher in `server.ts → getLocale()` so the browser-detection fallback covers it.

### Caveats

- **Supabase auth error messages** (e.g. "Invalid login credentials") come back from Supabase in English — they are not localized. If you want a localized version, map them to a `MessageKey` in the relevant Server Action before returning.
- **Time / number formatting** is not abstracted. Use the platform `Intl.DateTimeFormat` / `Intl.NumberFormat` with the current `locale` if needed.

## Environment variables

- Server-side secrets: `.env.local` (gitignored). Access via `process.env.MY_SECRET`.
- Browser-exposed: must be prefixed `NEXT_PUBLIC_*`. Treat anything `NEXT_PUBLIC_*` as public — never put secrets there.
- Do not commit real secrets. `.env.local` should be in `.gitignore`.

## Logging

- No dedicated logger required at this stage. Use `console.error` for genuine errors; avoid logging tokens, PII, or full request bodies.

## Security

- Never expose secrets via `NEXT_PUBLIC_*`.
- Validate user input at every Server Action / Route Handler boundary (manual checks or a schema lib if one is added later).
- Do not run untrusted code in Server Components — they have full server access.

## Related documentation

- [Structure](structure.md)
- [Coding style](coding-style.md)
- [Design system](../../DESIGN.md)
- [Technology](../technology.md)
