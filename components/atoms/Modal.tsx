"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // "wide" fits large editors (e.g. the two-column procedure builder).
  size?: "default" | "wide";
};

// Lightweight modal: backdrop + centered panel, closes on Escape / backdrop.
export function Modal({ open, onClose, title, children, size = "default" }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-overlay/60" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[90vh] w-full flex-col gap-md overflow-auto rounded-xl border border-hairline bg-canvas p-lg shadow-lg ${
          size === "wide" ? "max-w-[80rem]" : "max-w-[46rem]"
        }`}
      >
        <h2 className="text-heading-5 text-ink">{title}</h2>
        {children}
      </div>
    </div>
  );
}
