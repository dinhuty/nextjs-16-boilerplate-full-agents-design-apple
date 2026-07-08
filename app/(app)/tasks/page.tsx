import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks, taskDocs, releaseProcedures, mdDocs } from "@/db/schema";
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

  const docs = await db
    .select({ id: mdDocs.id, title: mdDocs.title })
    .from(mdDocs)
    .orderBy(asc(mdDocs.title));

  // Which md docs each of the user's tasks links to (M:N via task_docs).
  const links = await db
    .select({ taskId: taskDocs.taskId, docId: taskDocs.docId })
    .from(taskDocs)
    .innerJoin(tasks, eq(taskDocs.taskId, tasks.id))
    .where(eq(tasks.userId, user.id));
  const docIdsByTask = new Map<number, number[]>();
  for (const l of links) {
    const arr = docIdsByTask.get(l.taskId);
    if (arr) arr.push(l.docId);
    else docIdsByTask.set(l.taskId, [l.docId]);
  }
  const tasksWithDocs = myTasks.map((t) => ({
    ...t,
    docIds: docIdsByTask.get(t.id) ?? [],
  }));

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        backHref="/"
        backLabel="Tools"
        title="Task Manager"
        description="Task cá nhân — Slack, review, procedure, PR, note. Riêng tư."
      />
      <TaskManager
        tasks={tasksWithDocs}
        procedures={procedures}
        docs={docs}
        openTaskId={openTaskId}
      />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
