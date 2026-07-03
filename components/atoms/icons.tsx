import type { SVGProps } from "react";

// Bộ icon SVG dùng chung — nét (stroke) theo currentColor để thừa hưởng màu.
// Motif thương hiệu: ensō (vòng tròn thiền hở) cho logo "Zen".

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Logo mark: vòng tròn ensō hở (brush stroke). */
export function LogoMark({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className} {...props}>
      <circle
        cx="16"
        cy="16"
        r="10.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="53 13"
        transform="rotate(35 16 16)"
      />
    </svg>
  );
}

/** Release Procedure — clipboard có dấu tick. */
export function ReleaseIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base} {...props}>
      <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" />
      <path d="M8 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
      <path d="m8.5 13 2.2 2.2L15.5 10.5" />
    </svg>
  );
}

/** SQL Runner — hình trụ database. */
export function SqlIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base} {...props}>
      <ellipse cx="12" cy="5.5" rx="7" ry="3" />
      <path d="M5 5.5v13c0 1.66 3.13 3 7 3s7-1.34 7-3v-13" />
      <path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" />
    </svg>
  );
}

/** Env Diff — hai mũi tên lên/xuống so sánh. */
export function DiffIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base} {...props}>
      <path d="M7 20V5" />
      <path d="m3.5 8.5 3.5-3.5 3.5 3.5" />
      <path d="M17 4v15" />
      <path d="m13.5 15.5 3.5 3.5 3.5-3.5" />
    </svg>
  );
}
