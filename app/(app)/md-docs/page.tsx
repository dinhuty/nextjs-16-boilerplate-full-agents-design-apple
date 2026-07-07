import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mdDocs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { MdDocList } from "@/components/organisms/md-docs/MdDocList";
import { PageHeader } from "@/components/atoms/PageHeader";
import { BackLink } from "@/components/atoms/BackLink";

export default async function MdDocsPage() {
  await requireUser();

  const docs = await db
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
    .orderBy(desc(mdDocs.createdAt), desc(mdDocs.id));

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        backHref="/"
        backLabel="Tools"
        title="Markdown Docs"
        description="Tài liệu markdown dùng chung — render, raw, copy. Mọi user sửa được."
      />
      <MdDocList docs={docs} />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
