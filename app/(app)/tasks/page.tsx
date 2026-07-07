import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks, releaseProcedures } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { TaskManager } from "@/components/organisms/tasks/TaskManager";
import { PageHeader } from "@/components/atoms/PageHeader";
import { BackLink } from "@/components/atoms/BackLink";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const user = await requireUser();
  const { task } = await searchParams;
  const openTaskId = task && /^\d+$/.test(task) ? Number(task) : null;

  const myTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      backlogUrl: tasks.backlogUrl,
      slackTaskUrl: tasks.slackTaskUrl,
      slackReviewUrl: tasks.slackReviewUrl,
      procedureId: tasks.procedureId,
      docUrl: tasks.docUrl,
      basicDesignUrl: tasks.basicDesignUrl,
      prs: tasks.prs,
      links: tasks.links,
      note: tasks.note,
      tags: tasks.tags,
    })
    .from(tasks)
    .where(eq(tasks.userId, user.id))
    .orderBy(desc(tasks.createdAt));

  const procedures = await db
    .select({ id: releaseProcedures.id, title: releaseProcedures.title })
    .from(releaseProcedures)
    .orderBy(desc(releaseProcedures.createdAt));

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        backHref="/"
        backLabel="Tools"
        title="Task Manager"
        description="Task cá nhân — Slack, review, procedure, PR, note. Riêng tư."
      />
      <TaskManager
        tasks={myTasks}
        procedures={procedures}
        openTaskId={openTaskId}
      />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
