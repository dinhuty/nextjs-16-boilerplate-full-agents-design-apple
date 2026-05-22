# Instructions and Workflows

Step-by-step instructions for repeatable tasks live here.

## Workflows

_None yet — add per-task workflows as patterns stabilize._

Suggested files to add when the codebase grows:

- `adding-a-new-page.md` — App Router page creation (folder under `app/` + `page.tsx` + optional `loading.tsx` / `error.tsx`).
- `adding-a-new-feature.md` — multi-file feature (page + Server Actions + components + types).
- `adding-an-api-route.md` — Route Handler (`route.ts`) conventions.

## Common small actions

- **Tailwind utility classes** — Use them inline in JSX; global styles go in `app/globals.css`. See [DESIGN.md](../../../DESIGN.md).
- **Server Actions** — `"use server"` at the top of the file (or function). Pair mutations with `revalidatePath` / `revalidateTag`. Read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`.
- **Dynamic params** — `params` and `searchParams` are async; `await` them in Server Components.

## Related

- [Structure](../structure.md)
- [Coding conventions](../coding-conventions.md)
- [AI agent guidelines](../../ai-agent-guidelines.md)
