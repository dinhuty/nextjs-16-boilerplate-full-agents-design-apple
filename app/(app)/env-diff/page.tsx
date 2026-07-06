import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { EnvDiff } from "@/components/organisms/env-diff/EnvDiff";
import { BackLink } from "@/components/atoms/BackLink";

export default async function EnvDiffPage() {
  await requireUser();
  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xxs">
        <Link href="/" className="text-caption text-stone hover:underline">
          ← Tools
        </Link>
        <h1 className="text-heading-2 text-ink">Env Diff</h1>
        <p className="text-body-sm text-steel">
          So sánh 2 file .env/config — xử lý ngay trên trình duyệt, không gửi
          nội dung lên server.
        </p>
      </div>
      <EnvDiff />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
