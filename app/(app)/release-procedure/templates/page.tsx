import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { releaseTemplates } from "@/db/schema";
import { TemplateManager } from "@/components/organisms/release-procedure/TemplateManager";
import { requireUser } from "@/lib/auth/dal";
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
    })
    .from(releaseTemplates)
    .orderBy(desc(releaseTemplates.updatedAt), desc(releaseTemplates.id));

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xxs">
        <Link
          href="/release-procedure"
          className="text-caption text-stone hover:underline"
        >
          ← Release Procedure
        </Link>
        <h1 className="text-heading-2 text-ink">Templates</h1>
        <p className="text-body-sm text-steel">
          Shared master data — any user can add, edit, or delete templates.
        </p>
      </div>
      <TemplateManager templates={templates} />
      <BackLink href="/release-procedure" label="Release Procedure" />
    </div>
  );
}
