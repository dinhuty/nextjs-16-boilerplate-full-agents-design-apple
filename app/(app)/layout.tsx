import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/dal";
import { AppHeader } from "@/components/organisms/AppHeader";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-surface-soft">
      <AppHeader username={user.username} />
      <main className="mx-auto max-w-[64rem] px-md py-xl">{children}</main>
    </div>
  );
}
