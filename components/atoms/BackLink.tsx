import Link from "next/link";
import { Button } from "@/components/atoms/Button";

// Back button placed below a list so the user doesn't have to scroll back up.
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="pt-sm">
      <Link href={href}>
        <Button variant="secondary" type="button">
          ← {label}
        </Button>
      </Link>
    </div>
  );
}
