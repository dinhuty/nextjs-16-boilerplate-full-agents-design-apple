import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { releaseProcedures } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { Button } from "@/components/atoms/Button";
import { BackLink } from "@/components/atoms/BackLink";
import { ProcedureList } from "@/components/organisms/release-procedure/ProcedureList";

export default async function ReleaseProcedureHome() {
  await requireUser();
  const procedures = await db
    .select({
      id: releaseProcedures.id,
      title: releaseProcedures.title,
      language: releaseProcedures.language,
      updatedAt: releaseProcedures.updatedAt,
    })
    .from(releaseProcedures)
    .orderBy(desc(releaseProcedures.createdAt));

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex flex-col gap-xxs">
          <Link href="/" className="text-caption text-stone hover:underline">
            ← Tools
          </Link>
          <h1 className="text-heading-2 text-ink">Release Procedure</h1>
        </div>
        <div className="flex gap-xs">
          <Link href="/release-procedure/templates">
            <Button variant="secondary" type="button">
              Manage templates
            </Button>
          </Link>
          <Link href="/release-procedure/new">
            <Button type="button">+ New procedure</Button>
          </Link>
        </div>
      </div>

      <ProcedureList procedures={procedures} />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
