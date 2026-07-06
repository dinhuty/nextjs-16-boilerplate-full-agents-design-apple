import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { releaseProcedures, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { ToolGrid } from "@/components/organisms/ToolGrid";

export default async function HomePage() {
  const user = await requireUser();

  const recentProcedures = await db
    .select({ id: releaseProcedures.id, title: releaseProcedures.title })
    .from(releaseProcedures)
    .orderBy(desc(releaseProcedures.createdAt))
    .limit(5);

  const recentTasks = await db
    .select({ id: tasks.id, title: tasks.title })
    .from(tasks)
    .where(eq(tasks.userId, user.id))
    .orderBy(desc(tasks.createdAt))
    .limit(5);

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xxs">
        <h1 className="text-heading-2 text-ink">Công cụ</h1>
        <p className="text-subtitle text-steel">
          Chọn một công cụ để bắt đầu.
        </p>
      </div>
      <ToolGrid />

      {recentProcedures.length > 0 || recentTasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          <RecentCard
            title="Release procedure gần đây"
            moreHref="/release-procedure"
            items={recentProcedures.map((p) => ({
              key: p.id,
              label: p.title,
              href: `/release-procedure/${p.id}`,
            }))}
          />
          <RecentCard
            title="Task gần đây"
            moreHref="/tasks"
            items={recentTasks.map((t) => ({
              key: t.id,
              label: t.title,
              href: `/tasks?task=${t.id}`,
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}

function RecentCard({
  title,
  moreHref,
  items,
}: {
  title: string;
  moreHref: string;
  items: { key: number; label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-sm rounded-lg border border-hairline bg-canvas p-md">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-5 text-ink">{title}</h2>
        <Link href={moreHref} className="text-caption text-primary hover:underline">
          Tất cả →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-body-sm text-stone">Chưa có.</p>
      ) : (
        <div className="flex flex-col">
          {items.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className="truncate rounded-md px-sm py-xxs font-mono text-body-sm text-slate transition-colors hover:bg-surface hover:text-primary"
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
