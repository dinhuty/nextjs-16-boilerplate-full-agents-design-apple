"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/atoms/icons";

// Flips the `.dark` class on <html> and remembers the choice. The initial
// class is set before paint by the no-flash script in the root layout.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Light" : "Dark"}
      aria-label="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-md text-steel transition-colors hover:text-primary"
    >
      {dark ? (
        <SunIcon className="h-[18px] w-[18px]" />
      ) : (
        <MoonIcon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
