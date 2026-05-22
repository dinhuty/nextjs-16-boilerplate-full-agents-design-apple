import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Centered auth template — used by /login and /signup.
 * Canvas-parchment background, narrow column, hero on top.
 */
export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-canvas-parchment px-lg py-section">
      <div className="w-full max-w-[400px] flex flex-col gap-xl">
        <header className="text-center flex flex-col gap-xxs">
          <p className="text-caption-strong text-ink-muted-48 tracking-widest uppercase">
            ad-manager
          </p>
          <h1 className="text-display-md text-ink">{title}</h1>
          {subtitle ? (
            <p className="text-body text-ink-muted-80 mt-xxs">{subtitle}</p>
          ) : null}
        </header>
        {children}
        {footer ? (
          <p className="text-center text-caption text-ink-muted-80">{footer}</p>
        ) : null}
      </div>
    </main>
  );
}
