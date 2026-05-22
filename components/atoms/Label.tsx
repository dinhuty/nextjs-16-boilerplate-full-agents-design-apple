import type { LabelHTMLAttributes } from "react";

export function Label({
  className = "",
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-caption-strong text-ink mb-2 ${className}`}
      {...rest}
    />
  );
}
