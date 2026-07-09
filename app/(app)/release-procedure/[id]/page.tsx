import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { releaseProcedures, tasks } from "@/db/schema";
import { ProcedureView } from "@/components/organisms/release-procedure/ProcedureView";
import { TaskLinkPopup } from "@/components/organisms/tasks/TaskLinkPopup";
import { requireUser } from "@/lib/auth/dal";

export default async function ProcedurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const procId = Number(id);
  if (!Number.isInteger(procId)) notFound();

  const [proc] = await db
    .select()
    .from(releaseProcedures)
    .where(eq(releaseProcedures.id, procId))
    .limit(1);
  if (!proc) notFound();

  // The current user's own tasks that link to this procedure (tasks are private).
  const linkedTasks = await db
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
      checklist: tasks.checklist,
      note: tasks.note,
      tags: tasks.tags,
    })
    .from(tasks)
    .where(and(eq(tasks.userId, user.id), eq(tasks.procedureId, procId)))
    .orderBy(desc(tasks.createdAt));

  return (
    <div className="flex flex-col gap-md">
      <Link
        href="/release-procedure"
        className="text-caption text-stone hover:underline"
      >
        ← Release Procedure
      </Link>
      <TaskLinkPopup
        tasks={linkedTasks.map((t) => ({ ...t, docIds: [] }))}
        procTitle={new Map([[proc.id, proc.title]])}
      />
      <ProcedureView
        id={proc.id}
        title={proc.title}
        description={proc.description}
        language={proc.language}
        blocks={proc.blocks}
        variables={proc.variables}
      />
    </div>
  );
}
