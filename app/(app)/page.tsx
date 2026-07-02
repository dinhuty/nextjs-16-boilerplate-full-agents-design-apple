import { requireUser } from "@/lib/auth/dal";
import { ToolGrid } from "@/components/organisms/ToolGrid";

export default async function HomePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-xl">
      <section
        className="overflow-hidden rounded-2xl p-section-sm text-on-primary shadow-sm"
        // Themed brand gradient — inline so it can't be dropped by class purging.
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, #006b57 55%, #0a4f42 100%)",
        }}
      >
        <p className="text-micro-uppercase text-on-primary/70">
          Zen · Developer multi-tool
        </p>
        <h1 className="mt-xs text-display-lg text-on-primary">
          Xin chào, {user.username} 👋
        </h1>
        <p className="mt-sm max-w-[38rem] text-subtitle text-on-primary/85">
          Bộ công cụ nội bộ cho anh em dev. Chọn một công cụ bên dưới để bắt
          đầu.
        </p>
      </section>

      <div className="flex flex-col gap-md">
        <h2 className="text-heading-4 text-ink">Công cụ</h2>
        <ToolGrid />
      </div>
    </div>
  );
}
