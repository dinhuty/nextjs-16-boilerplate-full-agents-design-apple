import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  onDark?: boolean;
};

/**
 * Inline text link matching DESIGN.md `text-link` / `text-link-on-dark`.
 * Action Blue on light surfaces, Sky Link Blue on dark.
 */
export function TextLink({
  onDark = false,
  className = "",
  ...rest
}: Props) {
  const color = onDark ? "text-primary-on-dark" : "text-primary";
  return (
    <Link
      className={`${color} text-body hover:underline focus:underline outline-none ${className}`}
      {...rest}
    />
  );
}
