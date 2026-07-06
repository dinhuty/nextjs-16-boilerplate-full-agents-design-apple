import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { sqlSnippets } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { SnippetLibrary } from "@/components/organisms/sql-runner/SnippetLibrary";
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
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xxs">
        <Link href="/" className="text-caption text-stone hover:underline">
          ← Tools
        </Link>
        <h1 className="text-heading-2 text-ink">SQL Runner</h1>
        <p className="text-body-sm text-steel">
          Thư viện SQL snippet — copy về máy tự chạy (không exec trên server).
          Master data, mọi user thêm / sửa / xoá được.
        </p>
      </div>
      <SnippetLibrary snippets={snippets} openSnippetId={openSnippetId} />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
