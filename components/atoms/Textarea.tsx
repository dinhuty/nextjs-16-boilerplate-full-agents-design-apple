import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

/**
 * Multi-line text field matching the Input atom's look, with a monospace font
 * since it carries SQL. Resizes vertically only.
 */
export function Textarea({ invalid, className = "", ...rest }: Props) {
  const base =
    "w-full bg-canvas-dark text-on-dark font-mono text-caption border rounded-lg p-md outline-none transition-colors resize-y placeholder:text-muted";
  const state = invalid
    ? "border-trading-down focus:border-trading-down"
    : "border-hairline-on-dark hover:border-muted focus:border-primary";
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`${base} ${state} ${className}`}
      {...rest}
    />
  );
}
