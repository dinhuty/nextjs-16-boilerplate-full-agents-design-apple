import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-md">
      <div className="w-full max-w-[24rem] rounded-xl border border-hairline bg-canvas p-xl shadow-sm">
        {children}
      </div>
    </main>
  );
}
