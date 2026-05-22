# Instructions and Workflows

Step-by-step instructions for repeatable tasks live here.

## Workflows

| Task | Document |
|------|----------|
| Add a new page / route (with optional new components and migration) | [adding-a-new-page.md](adding-a-new-page.md) |

Suggested files to add when the codebase grows:

- `adding-a-new-feature.md` — multi-file feature spanning multiple routes / domains.
- `adding-an-api-route.md` — Route Handler (`route.ts`) conventions.

## Common small actions

- **Tailwind utility classes** — Use them inline in JSX; global styles go in `app/globals.css`. See [DESIGN.md](../../../DESIGN.md).
- **Server Actions** — `"use server"` at the top of the file (or function). Pair mutations with `revalidatePath` / `revalidateTag`. Read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`.
- **Dynamic params** — `params` and `searchParams` are async; `await` them in Server Components.

## Related

- [Structure](../structure.md)
- [Coding conventions](../coding-conventions.md)
- [AI agent guidelines](../../ai-agent-guidelines.md)
