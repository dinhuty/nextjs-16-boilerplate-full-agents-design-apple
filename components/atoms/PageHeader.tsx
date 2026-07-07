import Link from "next/link";
import type { ReactNode } from "react";

// Compact, consistent page header: a small back link, then title + inline
// description on one row, with an optional actions slot on the right. Keeps the
// header footprint small so list/detail content gets more of the viewport.
export function PageHeader({
  backHref,
  backLabel,
  title,
  description,
  actions,
}: {
  backHref?: string;
  backLabel?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-xxs">
      {backHref ? (
        <Link
          href={backHref}
          className="text-caption text-stone hover:underline"
        >
          ← {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex flex-wrap items-baseline gap-x-sm gap-y-xxs">
          <h1 className="text-heading-3 text-ink">{title}</h1>
          {description ? (
            <p className="text-caption text-stone">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-xs">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
