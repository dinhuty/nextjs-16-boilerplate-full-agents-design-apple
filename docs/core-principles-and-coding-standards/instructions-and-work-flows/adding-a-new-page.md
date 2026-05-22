# Adding a New Page / Route

Step-by-step process for adding a new page (and any new components it needs) to ad-manager.

> Before starting, read the matching guide in `node_modules/next/dist/docs/01-app/01-getting-started/` and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/`. This Next.js version may differ from your training data.

---

## Checklist

1. Decide whether the route is **public** or **protected**.
2. Create the route folder + `page.tsx` under `app/`.
3. Extract reusable UI into atoms / molecules / organisms (see [structure](../structure.md)).
4. If the page mutates data, add a co-located `actions.ts` with Server Actions.
5. If the route is public, update `PUBLIC_PATHS` in [`utils/supabase/middleware.ts`](../../../../utils/supabase/middleware.ts).
6. If the page needs new design tokens, **first** check [DESIGN.md](../../../../DESIGN.md). Tokens are already mapped to Tailwind utilities in [`app/globals.css`](../../../../app/globals.css).
7. If the page needs new DB tables, add a migration under `supabase/migrations/` (next ascending number) — see [Adding a migration](#adding-a-migration) below.
8. Verify: `yarn lint`, `yarn build`, manual check on `http://localhost:3002`.

---

## Step-by-step

### 1. Pick the route path

URL segment = folder name under `app/`. Examples:

- `app/dashboard/page.tsx` → `/dashboard`
- `app/posts/[id]/page.tsx` → `/posts/123` (dynamic, `params` is async — `await` it)
- `app/(marketing)/about/page.tsx` → `/about` (route group, parens don't appear in the URL)

### 2. Build the page

Page files (`page.tsx`) are **Server Components by default**. Keep them thin — orchestrate, then delegate to organisms.

```tsx
// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // defense in depth — middleware also redirects

  // … fetch domain data, then render an organism
  return <main className="…">…</main>;
}
```

For dynamic params:

```tsx
type Props = { params: Promise<{ id: string }> };

export default async function PostPage({ params }: Props) {
  const { id } = await params; // params is async in Next 15+
  …
}
```

### 3. Build the UI bottom-up

Follow the [component hierarchy](../structure.md#component-hierarchy):

1. **Atoms first** — Need a new primitive (e.g. `Avatar`)? Add it under `components/atoms/`. No composition of other components.
2. **Molecules** — Combine atoms into a small reusable composition (e.g. `UserCard` = `Avatar` + `Label`).
3. **Organisms** — Feature-specific blocks (e.g. `UserList`). These may be Client Components (`"use client"`) if they need interactivity.
4. **Page** — Compose organisms in `page.tsx`.

Use design tokens via Tailwind utilities (`bg-primary`, `text-body`, `rounded-pill`, `p-section`, etc.). Do **not** inline hex values; if a token is missing, update [DESIGN.md](../../../../DESIGN.md) and the matching `@theme` block in [`app/globals.css`](../../../../app/globals.css).

### 4. Mutations: Server Actions

If the page submits forms or mutates data, create `actions.ts` next to `page.tsx`:

```ts
// app/dashboard/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function createItem(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("items").insert({ name });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}
```

Pair with `useActionState` in a Client Component to render inline errors — see [`LoginForm`](../../../../components/organisms/LoginForm.tsx) for the canonical example.

### 5. Public vs protected routes

[`utils/supabase/middleware.ts`](../../../../utils/supabase/middleware.ts) (wired in by [`proxy.ts`](../../../../proxy.ts) at the root) redirects unauthenticated users to `/login` unless the path is in `PUBLIC_PATHS`.

- **Protected (default):** do nothing — the proxy handles it.
- **Public:** add the path prefix to `PUBLIC_PATHS`.

### 6. Verify

```bash
yarn lint            # must pass
yarn build           # must succeed (catches type errors and Server/Client boundary mistakes)
yarn dev             # manual smoke test on http://localhost:3002
```

---

## Adding a migration

If the new page touches the database:

1. Create the next-numbered SQL file: `supabase/migrations/NNNN_description.sql`.
2. Enable RLS on every new table in `public`:
   ```sql
   alter table public.<name> enable row level security;
   ```
3. Add explicit policies (do **not** rely on defaults). For owner-only access, use the pattern in [`0001_create_todos.sql`](../../../../supabase/migrations/0001_create_todos.sql) — `to authenticated` + `(select auth.uid()) = user_id` in both `USING` and `WITH CHECK`.
4. Apply via Supabase Dashboard SQL Editor or `supabase db push`.

Read more on RLS gotchas (`auth.role()` deprecation, `SECURITY DEFINER` traps, UPDATE needs SELECT, etc.) in `.agents/skills/supabase/SKILL.md` if available.

---

## Related

- [Structure](../structure.md) — where files live + component hierarchy
- [Coding conventions](../coding-conventions.md) — Server vs Client, fetching, Server Actions
- [DESIGN.md](../../../../DESIGN.md) — design tokens
- [Operation](../../operation.md) — no-bypass rules
