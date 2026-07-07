import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/dal";
import { Button } from "@/components/atoms/Button";
import { PageHeader } from "@/components/atoms/PageHeader";
import { BackLink } from "@/components/atoms/BackLink";
import { approveUser, rejectUser } from "./actions";

export default async function AdminPage() {
  await requireAdmin();

  const pending = await db
    .select({ id: users.id, username: users.username, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.approved, false))
    .orderBy(asc(users.createdAt));

  const approved = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.approved, true))
    .orderBy(asc(users.username));

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        backHref="/"
        backLabel="Tools"
        title="Duyệt đăng ký"
        description="User mới phải được duyệt trước khi đăng nhập. Chỉ admin thấy."
      />

      <section className="flex flex-col gap-sm">
        <h2 className="text-heading-5 text-ink">Chờ duyệt ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-body-sm text-stone">Không có yêu cầu nào.</p>
        ) : (
          <div className="flex flex-col gap-xs">
            {pending.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-sm rounded-lg border border-hairline bg-canvas p-md"
              >
                <div className="flex flex-col">
                  <span className="text-body-md-medium text-ink">
                    {u.username}
                  </span>
                  <span className="text-caption text-stone">
                    {u.createdAt.toLocaleString()}
                  </span>
                </div>
                <div className="flex shrink-0 gap-xs">
                  <form action={approveUser.bind(null, u.id)}>
                    <Button type="submit">Duyệt</Button>
                  </form>
                  <form action={rejectUser.bind(null, u.id)}>
                    <Button variant="danger" type="submit">
                      Từ chối
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="text-heading-5 text-ink">Đã duyệt ({approved.length})</h2>
        <div className="flex flex-wrap gap-xs">
          {approved.map((u) => (
            <span
              key={u.id}
              className="rounded-full bg-surface px-sm py-xxs text-caption text-slate"
            >
              {u.username}
            </span>
          ))}
        </div>
      </section>

      <BackLink href="/" label="Tools" />
    </div>
  );
}
