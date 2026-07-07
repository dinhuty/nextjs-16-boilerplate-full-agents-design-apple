import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { sqlSnippets } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { SnippetLibrary } from "@/components/organisms/sql-runner/SnippetLibrary";
import { PageHeader } from "@/components/atoms/PageHeader";
import { BackLink } from "@/components/atoms/BackLink";

export default async function SqlRunnerPage({
  searchParams,
}: {
  searchParams: Promise<{ snippet?: string }>;
}) {
  await requireUser();
  const { snippet } = await searchParams;
  const openSnippetId = snippet && /^\d+$/.test(snippet) ? Number(snippet) : null;

  const snippets = await db
    .select({
      id: sqlSnippets.id,
      category: sqlSnippets.category,
      title: sqlSnippets.title,
      body: sqlSnippets.body,
    })
    .from(sqlSnippets)
    .orderBy(desc(sqlSnippets.createdAt), desc(sqlSnippets.id));

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        backHref="/"
        backLabel="Tools"
        title="SQL Runner"
        description="Thư viện SQL snippet — copy về máy tự chạy. Mọi user thêm / sửa / xoá."
      />
      <SnippetLibrary snippets={snippets} openSnippetId={openSnippetId} />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
