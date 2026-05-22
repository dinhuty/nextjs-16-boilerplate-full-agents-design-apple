import Link from "next/link";
import { SignUpForm } from "@/components/organisms/SignUpForm";
import { getMessages, t } from "@/lib/i18n/server";

export default async function SignUpPage() {
  const { messages } = await getMessages();
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas-parchment px-lg py-section">
      <div className="w-full max-w-[440px] flex flex-col gap-xxl">
        <header className="text-center flex flex-col gap-sm">
          <h1 className="text-hero-display text-ink">
            {t(messages, "signup.title")}
          </h1>
          <p className="text-lead-airy text-ink-muted-80">
            {t(messages, "signup.subtitle")}
          </p>
        </header>

        <SignUpForm />

        <p className="text-center text-caption text-ink-muted-80">
          {t(messages, "signup.have_account")}{" "}
          <Link
            href="/login"
            className="text-primary hover:underline outline-none"
          >
            {t(messages, "signup.sign_in")}
          </Link>
        </p>
      </div>
    </main>
  );
}
