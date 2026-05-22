import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/organisms/SignOutButton";
import { getMessages, t } from "@/lib/i18n/server";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: todos } = await supabase.from("todos").select();
  const { messages } = await getMessages();

  return (
    <main className="min-h-screen bg-canvas-parchment">
      <header className="flex items-center justify-between gap-md px-lg py-md border-b border-hairline bg-canvas">
        <div>
          <h1 className="text-display-md text-ink">
            {t(messages, "home.title")}
          </h1>
          <p className="text-caption text-ink-muted-48 mt-xxs">{user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <section className="px-lg py-xl">
        <ul className="flex flex-col gap-sm max-w-[640px]">
          {todos && todos.length > 0 ? (
            todos.map((todo) => (
              <li
                key={todo.id}
                className="bg-canvas border border-hairline rounded-md p-lg text-body-strong text-ink"
              >
                {todo.name}
              </li>
            ))
          ) : (
            <li className="text-body text-ink-muted-48">
              {t(messages, "home.empty")}
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
