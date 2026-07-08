import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mdDocs, mdTags, tasks, taskDocs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { MdDocView } from "@/components/organisms/md-docs/MdDocView";

export default async function MdDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const docId = Number(id);
  if (!Number.isInteger(docId)) notFound();

  const [doc] = await db
    .select({
      id: mdDocs.id,
      title: mdDocs.title,
      body: mdDocs.body,
      tags: mdDocs.tags,
      updatedAt: mdDocs.updatedAt,
      updatedByName: users.username,
    })
    .from(mdDocs)
    .leftJoin(users, eq(mdDocs.updatedBy, users.id))
    .where(eq(mdDocs.id, docId))
    .limit(1);
  if (!doc) notFound();

  const tags = await db
    .select({ id: mdTags.id, name: mdTags.name, color: mdTags.color })
    .from(mdTags)
    .orderBy(asc(mdTags.name));

  // The current user's own tasks that link to this doc (tasks are private).
  const linkedTasks = await db
    .select({ id: tasks.id, title: tasks.title })
    .from(taskDocs)
    .innerJoin(tasks, eq(taskDocs.taskId, tasks.id))
    .where(and(eq(taskDocs.docId, docId), eq(tasks.userId, user.id)))
    .orderBy(desc(tasks.createdAt));

  return (
    <div className="flex flex-col gap-md">
      <Link href="/md-docs" className="text-caption text-stone hover:underline">
        ← Markdown Docs
      </Link>
      <MdDocView doc={doc} tags={tags} linkedTasks={linkedTasks} />
    </div>
  );
}
