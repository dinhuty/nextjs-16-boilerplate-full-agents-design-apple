"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Lite = { id: number; title: string; category?: string };
type Item = { label: string; sub: string; href: string };

const TOOLS: Item[] = [
  { label: "Release Procedure", sub: "Tool", href: "/release-procedure" },
  { label: "SQL Runner", sub: "Tool", href: "/sql-runner" },
  { label: "Task Manager", sub: "Tool", href: "/tasks" },
  { label: "Env Diff", sub: "Tool", href: "/env-diff" },
  { label: "Templates", sub: "Tool", href: "/release-procedure/templates" },
];

// Global Cmd/Ctrl+K palette: jump to a tool or straight to a saved procedure /
// task / snippet. Mounted once in the app shell.
export function CommandPalette({
  procedures,
  tasks,
  snippets,
}: {
  procedures: Lite[];
  tasks: Lite[];
  snippets: Lite[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-subscribed on each open toggle so the handlers read a fresh `open`.
  // (setState inside event handlers is fine — only setState *in an effect body*
  // is discouraged.)
  useEffect(() => {
    function reset() {
      setQuery("");
      setActive(0);
      setOpen(true);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else reset();
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("zen:cmdk", reset);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("zen:cmdk", reset);
    };
  }, [open]);

  // Focus the input when the palette opens (no state change → safe in effect).
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const all = useMemo<Item[]>(
    () => [
      ...TOOLS,
      ...procedures.map((p) => ({
        label: p.title,
        sub: "Procedure",
        href: `/release-procedure/${p.id}`,
      })),
      ...tasks.map((t) => ({
        label: t.title,
        sub: "Task",
        href: `/tasks?task=${t.id}`,
      })),
      ...snippets.map((s) => ({
        label: s.title,
        sub: s.category ? `Snippet · ${s.category}` : "Snippet",
        href: `/sql-runner?snippet=${s.id}`,
      })),
    ],
    [procedures, tasks, snippets],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? all.filter((i) => `${i.label} ${i.sub}`.toLowerCase().includes(q))
      : all;
    return list.slice(0, 30);
  }, [all, query]);

  function go(item: Item) {
    setOpen(false);
    router.push(item.href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-md pt-[12vh]">
      <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
      <div className="relative z-10 flex w-full max-w-[40rem] flex-col overflow-hidden rounded-xl border border-hairline bg-canvas shadow-lg">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              go(results[active]);
            }
          }}
          placeholder="Đi tới tool / procedure / task / snippet…"
          className="h-12 w-full border-b border-hairline bg-canvas px-md text-body-md text-ink outline-none placeholder:text-muted"
        />
        <div className="max-h-[50vh] overflow-auto py-xs">
          {results.length === 0 ? (
            <p className="px-md py-sm text-body-sm text-stone">Không khớp.</p>
          ) : (
            results.map((it, i) => (
              <button
                key={`${it.href}-${it.label}-${i}`}
                type="button"
                onClick={() => go(it)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between gap-sm px-md py-sm text-left text-body-sm transition-colors ${
                  i === active ? "bg-primary/10 text-primary" : "text-slate"
                }`}
              >
                <span className="truncate">{it.label}</span>
                <span className="shrink-0 text-caption text-stone">
                  {it.sub}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
