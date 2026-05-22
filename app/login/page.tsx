import Link from "next/link";
import { LoginForm } from "@/components/organisms/LoginForm";
import { getMessages, t } from "@/lib/i18n/server";

type SearchParams = Promise<{ next?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  const { messages } = await getMessages();

  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas-parchment px-lg py-section">
      <div className="w-full max-w-[440px] flex flex-col gap-xxl">
        <header className="text-center flex flex-col gap-sm">
          <h1 className="text-hero-display text-ink">
            {t(messages, "login.title")}
          </h1>
          <p className="text-lead-airy text-ink-muted-80">
            {t(messages, "login.subtitle")}
          </p>
        </header>
        <LoginForm next={next} />
        <p className="text-center text-caption text-ink-muted-80">
          {t(messages, "login.no_account")}{" "}
          <Link
            href="/signup"
            className="text-primary hover:underline outline-none"
          >
            {t(messages, "login.create_one")}
          </Link>
        </p>
      </div>
    </main>
  );
}
