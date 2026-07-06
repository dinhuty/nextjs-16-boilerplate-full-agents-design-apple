import type { ReactNode } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { releaseProcedures, tasks, sqlSnippets } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { AppHeader } from "@/components/organisms/AppHeader";
import { CommandPalette } from "@/components/organisms/CommandPalette";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  // Lightweight lists for the global Cmd+K palette.
  const [procedures, myTasks, snippets] = await Promise.all([
    db
      .select({ id: releaseProcedures.id, title: releaseProcedures.title })
      .from(releaseProcedures)
      .orderBy(desc(releaseProcedures.createdAt))
      .limit(50),
    db
      .select({ id: tasks.id, title: tasks.title })
      .from(tasks)
      .where(eq(tasks.userId, user.id))
      .orderBy(desc(tasks.createdAt))
      .limit(50),
    db
      .select({
        id: sqlSnippets.id,
        title: sqlSnippets.title,
        category: sqlSnippets.category,
      })
      .from(sqlSnippets)
      .orderBy(desc(sqlSnippets.createdAt))
      .limit(100),
  ]);

  return (
    <div className="min-h-screen bg-surface-soft">
      <AppHeader username={user.username} />
      <main className="mx-auto max-w-[88rem] px-lg py-xl">{children}</main>
      <CommandPalette
        procedures={procedures}
        tasks={myTasks}
        snippets={snippets}
      />
    </div>
  );
}
