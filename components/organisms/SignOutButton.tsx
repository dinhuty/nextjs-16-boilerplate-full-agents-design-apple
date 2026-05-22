"use client";

import { Button } from "@/components/atoms/Button";
import { signOut } from "@/app/login/actions";
import { useT } from "@/lib/i18n/client";

export function SignOutButton() {
  const { t } = useT();
  return (
    <form action={signOut}>
      <Button type="submit" variant="dark-utility">
        {t("home.sign_out")}
      </Button>
    </form>
  );
}
