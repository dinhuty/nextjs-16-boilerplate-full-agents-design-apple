import Link from "next/link";
import { SignOutButton } from "@/components/organisms/SignOutButton";
import { CommandHint } from "@/components/organisms/CommandHint";
import { ThemeToggle } from "@/components/organisms/ThemeToggle";
import { LogoMark } from "@/components/atoms/icons";

export function AppHeader({
  username,
  isAdmin,
}: {
  username: string;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[88rem] items-center justify-between px-lg">
        <Link href="/" className="flex items-center gap-xs text-heading-5 text-ink">
          <LogoMark className="h-6 w-6 text-primary" />
          Zen
        </Link>
        <div className="flex items-center gap-sm">
          <CommandHint />
          <ThemeToggle />
          {isAdmin ? (
            <Link
              href="/admin"
              className="text-body-sm text-steel transition-colors hover:text-primary"
            >
              Admin
            </Link>
          ) : null}
          <span className="text-body-sm text-steel">{username}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
