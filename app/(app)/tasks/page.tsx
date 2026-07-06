import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks, releaseProcedures } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { TaskManager } from "@/components/organisms/tasks/TaskManager";
import { BackLink } from "@/components/atoms/BackLink";

export default async function TasksPage() {
  const user = await requireUser();

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
      prs: tasks.prs,
      note: tasks.note,
      tags: tasks.tags,
    })
    .from(tasks)
    .where(eq(tasks.userId, user.id))
    .orderBy(desc(tasks.updatedAt));

  const procedures = await db
    .select({ id: releaseProcedures.id, title: releaseProcedures.title })
    .from(releaseProcedures)
    .orderBy(desc(releaseProcedures.updatedAt));

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xxs">
        <Link href="/" className="text-caption text-stone hover:underline">
          ← Tools
        </Link>
        <h1 className="text-heading-2 text-ink">Task Manager</h1>
        <p className="text-body-sm text-steel">
          Lưu thông tin task cá nhân — link Slack, review, release procedure,
          document, note. Riêng tư, chỉ mình bạn thấy.
        </p>
      </div>
      <TaskManager tasks={myTasks} procedures={procedures} />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
