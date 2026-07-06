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

/** Task Manager — icon nhiều màu (gradient tím→hồng) cho nổi bật. */
export function TaskIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...props}>
      <defs>
        <linearGradient id="zen-task-grad" x1="2" y1="2" x2="22" y2="22"
          gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="0.55" stopColor="#d946ef" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5.5" fill="url(#zen-task-grad)" />
      <path d="M6.8 9.1l1.5 1.5 3-3.2" stroke="#fff" strokeWidth="1.7" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.6 8.4h3.6" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.7"
        strokeLinecap="round" />
      <path d="M6.8 14.9l1.5 1.5 3-3.2" stroke="#bbf7d0" strokeWidth="1.7" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.6 14.2h3.6" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.7"
        strokeLinecap="round" />
    </svg>
  );
}

/** Backlog — chữ "b" trắng trên nền xanh (ticket Backlog). */
export function BacklogIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...props}>
      <rect width="24" height="24" rx="6" fill="#22a06b" />
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="15"
        fontWeight="700"
        fill="#ffffff"
      >
        b
      </text>
    </svg>
  );
}

/** List view — các hàng ngang có dấu đầu dòng. */
export function ListIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base} {...props}>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  );
}

/** Grid view — lưới 2×2 ô. */
export function GridIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base} {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
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
