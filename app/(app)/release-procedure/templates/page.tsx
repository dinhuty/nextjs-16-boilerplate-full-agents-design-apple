import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { releaseTemplates, users } from "@/db/schema";
import { TemplateManager } from "@/components/organisms/release-procedure/TemplateManager";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/atoms/PageHeader";
import { BackLink } from "@/components/atoms/BackLink";

export default async function TemplatesPage() {
  await requireUser();
  const templates = await db
    .select({
      id: releaseTemplates.id,
      category: releaseTemplates.category,
      name: releaseTemplates.name,
      repo: releaseTemplates.repo,
      bodyJa: releaseTemplates.bodyJa,
      bodyEn: releaseTemplates.bodyEn,
      bodyVi: releaseTemplates.bodyVi,
      updatedAt: releaseTemplates.updatedAt,
      updatedByName: users.username,
    })
    .from(releaseTemplates)
    .leftJoin(users, eq(releaseTemplates.updatedBy, users.id))
    .orderBy(desc(releaseTemplates.createdAt), desc(releaseTemplates.id));

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        backHref="/release-procedure"
        backLabel="Release Procedure"
        title="Templates"
        description="Master data dùng chung — mọi user thêm / sửa / xoá."
      />
      <TemplateManager templates={templates} />
      <BackLink href="/release-procedure" label="Release Procedure" />
    </div>
  );
}
