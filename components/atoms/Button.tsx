import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Button variants mirror DESIGN.md `components` keys where possible.
 *
 * | variant         | matches DESIGN.md component   | radius   | use case |
 * |-----------------|-------------------------------|----------|----------|
 * | `primary`       | `button-primary`              | pill     | Action-Blue capsule CTAs on marketing / product surfaces ("Buy", "Learn more") |
 * | `primary-rect`  | (custom — not in DESIGN.md)   | rounded  | Primary Action-Blue button on auth surfaces (sign-in "Continue" / "Sign in"). Larger 18px label per `button-large`. |
 * | `secondary`     | `button-secondary-pill`       | pill     | Ghost pill — outlined primary, used alongside `primary` |
 * | `dark-utility`  | `button-dark-utility`*        | md       | Compact dark rect — Sign Out, Bag, Sign In in global nav. Radius bumped from DESIGN.md sm (8px) to md (11px) so it lines up with `primary-rect` / input radius across the app. |
 * | `pearl`         | `button-pearl-capsule`        | md       | Pearl capsule on product cards (secondary action over light surface) |
 */
type Variant =
  | "primary"
  | "primary-rect"
  | "secondary"
  | "dark-utility"
  | "pearl";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary text-body rounded-pill px-[22px] py-[11px]",
  "primary-rect":
    "bg-primary text-on-primary text-button-large rounded-md px-[28px] py-[14px]",
  secondary:
    "bg-canvas text-primary text-body rounded-pill px-[22px] py-[11px] border border-primary",
  "dark-utility":
    "bg-ink text-on-dark text-button-utility rounded-md px-[15px] py-[8px]",
  pearl:
    "bg-surface-pearl text-ink-muted-80 text-caption rounded-md px-[14px] py-[8px] border border-divider-soft",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`${VARIANTS[variant]} inline-flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-focus focus-visible:outline-offset-2 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
