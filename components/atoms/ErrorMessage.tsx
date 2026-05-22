import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  className?: string;
};

export function ErrorMessage({ children, className = "" }: Props) {
  if (!children) return null;
  return (
    <p
      role="alert"
      aria-live="polite"
      className={`text-caption text-red-600 mt-2 ${className}`}
    >
      {children}
    </p>
  );
}
