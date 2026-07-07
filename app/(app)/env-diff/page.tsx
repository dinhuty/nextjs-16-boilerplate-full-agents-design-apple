import { requireUser } from "@/lib/auth/dal";
import { EnvDiff } from "@/components/organisms/env-diff/EnvDiff";
import { PageHeader } from "@/components/atoms/PageHeader";
import { BackLink } from "@/components/atoms/BackLink";

export default async function EnvDiffPage() {
  await requireUser();
  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        backHref="/"
        backLabel="Tools"
        title="Env Diff"
        description="Dán 2 file .env/config → so sánh key. Xử lý trên trình duyệt, không gửi server."
      />
      <EnvDiff />
      <BackLink href="/" label="Tools" />
    </div>
  );
}
