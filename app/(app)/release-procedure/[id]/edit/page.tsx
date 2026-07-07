import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { releaseProcedures, releaseTemplates } from "@/db/schema";
import { ProcedureBuilder } from "@/components/organisms/release-procedure/ProcedureBuilder";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/atoms/PageHeader";

export default async function EditProcedurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const procId = Number(id);
  if (!Number.isInteger(procId)) notFound();

  const [proc] = await db
    .select()
    .from(releaseProcedures)
    .where(eq(releaseProcedures.id, procId))
    .limit(1);
  if (!proc) notFound();

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
        backHref={`/release-procedure/${proc.id}`}
        backLabel={proc.title}
        title="Edit procedure"
      />
      <ProcedureBuilder
        templates={templates}
        initial={{
          id: proc.id,
          title: proc.title,
          description: proc.description,
          language: proc.language,
          blocks: proc.blocks,
          variables: proc.variables,
        }}
      />
    </div>
  );
}
