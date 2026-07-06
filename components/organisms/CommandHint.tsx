"use client";

// Header hint that opens the global Cmd+K palette (via a window event so the
// palette component owns its open state).
export function CommandHint() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("zen:cmdk"))}
      title="Tìm nhanh (⌘K)"
      className="hidden items-center gap-xxs rounded-md border border-hairline px-sm py-xxs text-caption text-stone transition-colors hover:border-primary hover:text-primary sm:flex"
    >
      <span>Tìm nhanh</span>
      <kbd className="rounded bg-surface px-xxs font-mono text-micro text-steel">
        ⌘K
      </kbd>
    </button>
  );
}
