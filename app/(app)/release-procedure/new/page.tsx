import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { releaseTemplates } from "@/db/schema";
import { ProcedureBuilder } from "@/components/organisms/release-procedure/ProcedureBuilder";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/atoms/PageHeader";

export default async function NewProcedurePage() {
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
    .orderBy(asc(releaseTemplates.category), asc(releaseTemplates.name));

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        backHref="/release-procedure"
        backLabel="Release Procedure"
        title="New procedure"
      />
      <ProcedureBuilder templates={templates} />
    </div>
  );
}
