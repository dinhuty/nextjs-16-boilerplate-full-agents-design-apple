import { requireUser } from "@/lib/auth/dal";
import { ToolGrid } from "@/components/organisms/ToolGrid";

export default async function HomePage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xxs">
        <h1 className="text-heading-2 text-ink">Công cụ</h1>
        <p className="text-subtitle text-steel">
          Chọn một công cụ để bắt đầu.
        </p>
      </div>
      <ToolGrid />
    </div>
  );
}
