import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mdDocs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { MdDocView } from "@/components/organisms/md-docs/MdDocView";

export default async function MdDocPage({
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
      updatedByName: users.username,
    })
    .from(mdDocs)
    .leftJoin(users, eq(mdDocs.updatedBy, users.id))
    .where(eq(mdDocs.id, docId))
    .limit(1);
  if (!doc) notFound();

  return (
    <div className="flex flex-col gap-lg">
      <Link href="/md-docs" className="text-caption text-stone hover:underline">
        ← Markdown Docs
      </Link>
      <MdDocView doc={doc} />
    </div>
  );
}
