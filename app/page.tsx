import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/organisms/SignOutButton";
import { getMessages, t } from "@/lib/i18n/server";
import { TOOLS } from "@/lib/tools";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { messages } = await getMessages();

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas-dark text-body-on-dark">
      {/* Decorative yellow glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />

      <header className="relative flex items-center justify-between gap-md px-lg py-md border-b border-hairline-on-dark">
        <span className="text-body-strong tracking-tight">
          <span className="text-primary">ad</span>
          <span className="text-on-dark">·manager</span>
        </span>
        <div className="flex items-center gap-md">
          <span className="text-caption text-muted hidden sm:block">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      <section className="relative px-lg py-section max-w-[1100px] mx-auto">
        <h1 className="text-display-lg text-on-dark">
          {t(messages, "dashboard.title")}
        </h1>
        <p className="text-body text-muted mt-sm max-w-[520px]">
          {t(messages, "dashboard.subtitle")}
        </p>

        <div className="mt-xl grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-lg">
          {TOOLS.map((tool) => (
            <Link
              key={tool.key}
              href={tool.href}
              className="group relative overflow-hidden rounded-xl border border-hairline-on-dark bg-surface-card-dark p-lg transition-all duration-200 hover:-translate-y-1 hover:border-primary"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="relative flex items-start gap-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-body-strong font-bold">
                  {tool.badge}
                </div>
                <div className="min-w-0">
                  <h2 className="text-body-strong text-on-dark">
                    {t(messages, tool.nameKey)}
                  </h2>
                  <p className="text-caption text-muted mt-xxs">
                    {t(messages, tool.descKey)}
                  </p>
                </div>
              </div>
              <span className="relative mt-lg inline-flex items-center gap-xxs text-caption-strong text-primary translate-x-0 transition-transform duration-200 group-hover:translate-x-1">
                {t(messages, "dashboard.open")} →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
