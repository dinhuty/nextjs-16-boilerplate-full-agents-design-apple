# Coding Style

Formatting, linting, and environment for ad-manager.

## Tools

- **ESLint 9** — flat config in `eslint.config.mjs`, extends `eslint-config-next` (Next.js 16 ruleset).
- **TypeScript 5** — type checking happens during `yarn build` (Next.js compiles + type-checks together).
- **PostCSS / Tailwind CSS 4** — `postcss.config.mjs`.

## Package manager

- **Yarn only** — `yarn.lock` is committed. Do not switch to `npm` or `pnpm`.

## Linting

- Run `yarn lint` after changes. Prefer fixing errors over disabling rules; if you must disable, include a one-line `// eslint-disable-next-line <rule>` and a brief comment why.
- Avoid `any`. Use `unknown` and narrow, or define a proper type.

## Type checking

- Type errors are caught by `yarn build` (Next.js wraps `tsc`). Run it before claiming a change is done — `yarn lint` alone does not type-check.

## Commands

```bash
yarn dev              # Start dev server on http://localhost:3002
yarn lint             # Run ESLint
yarn build            # Compile + type-check (catches type errors)
yarn start            # Start production server on http://localhost:3002 (needs prior yarn build)
```

## Environment

- Local secrets: `.env.local` (gitignored). Access via `process.env.X`.
- Browser-exposed vars: must be prefixed `NEXT_PUBLIC_*`. These end up in the client bundle — never put secrets there.
- The `PORT` env var overrides the `-p` flag if set in the shell.

## Before committing

1. `yarn lint` — fix all errors.
2. `yarn build` — must succeed.
3. For UI changes: `yarn dev` and verify on `http://localhost:3002`.

## Related documentation

- [Coding conventions](coding-conventions.md)
- [Technology](../technology.md)
- [Operation](../operation.md)
