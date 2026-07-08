import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { mdTags } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { MdDocEditor } from "@/components/organisms/md-docs/MdDocEditor";

export default async function NewMdDocPage() {
  await requireUser();
  const tags = await db
    .select({ id: mdTags.id, name: mdTags.name, color: mdTags.color })
    .from(mdTags)
    .orderBy(asc(mdTags.name));

  return (
    <div className="flex flex-col gap-md">
      <Link href="/md-docs" className="text-caption text-stone hover:underline">
        ← Markdown Docs
      </Link>
      <h1 className="text-heading-3 text-ink">New doc</h1>
      <MdDocEditor tags={tags} />
    </div>
  );
}
