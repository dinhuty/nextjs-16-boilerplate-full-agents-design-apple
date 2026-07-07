import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mdDocs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { MdDocList } from "@/components/organisms/md-docs/MdDocList";
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
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xxs">
        <Link href="/" className="text-caption text-stone hover:underline">
          ← Tools
        </Link>
        <h1 className="text-heading-2 text-ink">Markdown Docs</h1>
        <p className="text-body-sm text-steel">
          Lưu trữ tài liệu markdown dùng chung — render, raw, copy. Mọi user thêm
          / sửa / xoá được.
        </p>
      </div>
      <MdDocList docs={docs} />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
