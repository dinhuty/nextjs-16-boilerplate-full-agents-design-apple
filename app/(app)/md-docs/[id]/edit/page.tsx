import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mdDocs, mdTags } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { MdDocEditor } from "@/components/organisms/md-docs/MdDocEditor";

export default async function EditMdDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
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
    })
    .from(mdDocs)
    .where(eq(mdDocs.id, docId))
    .limit(1);
  if (!doc) notFound();

  const tags = await db
    .select({ id: mdTags.id, name: mdTags.name, color: mdTags.color })
    .from(mdTags)
    .orderBy(asc(mdTags.name));

  return (
    <div className="flex flex-col gap-md">
      <Link
        href={`/md-docs/${doc.id}`}
        className="text-caption text-stone hover:underline"
      >
        ← {doc.title}
      </Link>
      <h1 className="text-heading-3 text-ink">Edit doc</h1>
      <MdDocEditor
        tags={tags}
        initial={{
          id: doc.id,
          title: doc.title,
          body: doc.body,
          tags: doc.tags,
          updatedAt: doc.updatedAt.getTime(),
        }}
      />
    </div>
  );
}
