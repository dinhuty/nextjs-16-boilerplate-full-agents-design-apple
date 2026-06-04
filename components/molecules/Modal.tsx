"use client";

import type { ReactNode } from "react";

/**
 * Lightweight centered modal. Click the backdrop or press the close button to
 * dismiss. No portal — rendered inline where used (fine for this single tool).
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-lg"
      onClick={onClose}
    >
      <div
        className="bg-surface-card-dark text-body-on-dark rounded-xl border border-hairline-on-dark w-full max-w-[640px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-md px-lg py-md border-b border-hairline-on-dark shrink-0">
          <h2 className="text-body-strong text-on-dark">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-on-dark text-body-strong leading-none"
          >
            ✕
          </button>
        </header>
        <div className="p-lg overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
