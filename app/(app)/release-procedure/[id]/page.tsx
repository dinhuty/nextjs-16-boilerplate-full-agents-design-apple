import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { releaseProcedures } from "@/db/schema";
import { ProcedureView } from "@/components/organisms/release-procedure/ProcedureView";
import { requireUser } from "@/lib/auth/dal";

export default async function ProcedurePage({
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

  return (
    <div className="flex flex-col gap-lg">
      <Link
        href="/release-procedure"
        className="text-caption text-stone hover:underline"
      >
        ← Release Procedure
      </Link>
      <ProcedureView
        id={proc.id}
        title={proc.title}
        language={proc.language}
        blocks={proc.blocks}
        variables={proc.variables}
      />
    </div>
  );
}
