"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSnippet,
  updateSnippet,
  deleteSnippet,
  type SnippetInput,
} from "@/app/(app)/sql-runner/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { TextArea } from "@/components/atoms/TextArea";
import { Combobox } from "@/components/atoms/Combobox";
import { Modal } from "@/components/atoms/Modal";
import { Pagination } from "@/components/atoms/Pagination";
import { FormField } from "@/components/molecules/FormField";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { CopyButton } from "@/components/atoms/CopyButton";
import { usePaged } from "@/lib/use-paged";

export type Snippet = {
  id: number;
  category: string;
  title: string;
  body: string;
};

const PARAM_RE = /\$\{(\w+)\}/g;

function detectParams(body: string): string[] {
  const set = new Set<string>();
  for (const m of body.matchAll(PARAM_RE)) set.add(m[1]);
  return [...set];
}

function fillParams(body: string, values: Record<string, string>): string {
  return body.replace(PARAM_RE, (whole, name: string) => {
    const v = values[name];
    return v && v.trim() !== "" ? v : whole;
  });
}

// Heuristic: flag queries that can wipe data — DROP/TRUNCATE, or an
// UPDATE/DELETE with no WHERE anywhere in the body.
function isDestructive(body: string): boolean {
  const sql = body.toUpperCase();
  if (/\b(DROP|TRUNCATE)\b/.test(sql)) return true;
  return /\b(UPDATE|DELETE)\b/.test(sql) && !/\bWHERE\b/.test(sql);
}

export function SnippetLibrary({ snippets }: { snippets: Snippet[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(
    snippets[0]?.id ?? null,
  );
  // Params are stored per named profile (e.g. staging vs production user_id).
  const [profileState, setProfileState] = useState<{
    active: string;
    byName: Record<string, Record<string, string>>;
  }>({ active: "default", byName: { default: {} } });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [wrapTx, setWrapTx] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(true);
  const [edit, setEdit] = useState<
    { mode: "new" } | { mode: "edit"; snippet: Snippet } | null
  >(null);
  const router = useRouter();

  const params = profileState.byName[profileState.active] ?? {};
  function setParam(name: string, value: string) {
    setProfileState((s) => ({
      ...s,
      byName: {
        ...s.byName,
        [s.active]: { ...(s.byName[s.active] ?? {}), [name]: value },
      },
    }));
  }

  // Hydrate profiles + favorites from localStorage (client-only). Migrate the
  // old single-params key into the "default" profile on first run.
  const PROFILES_KEY = "sql-runner:profiles";
  const FAV_KEY = "sql-runner:favorites";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (p?.byName) setProfileState({ active: p.active ?? "default", byName: p.byName });
      } else {
        const old = localStorage.getItem("sql-runner:params");
        if (old) setProfileState({ active: "default", byName: { default: JSON.parse(old) } });
      }
      const fav = localStorage.getItem(FAV_KEY);
      if (fav) setFavorites(JSON.parse(fav));
    } catch {
      // ignore malformed / unavailable storage
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profileState));
    } catch {
      // ignore quota / unavailable storage
    }
  }, [profileState]);
  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  function toggleFavorite(id: number) {
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }

  function addProfile() {
    const name = window.prompt("Tên profile (vd: staging, prod):")?.trim();
    if (!name) return;
    setProfileState((s) => ({
      active: name,
      byName: { ...s.byName, [name]: s.byName[name] ?? {} },
    }));
  }
  function deleteProfile() {
    setProfileState((s) => {
      if (s.active === "default") return s;
      const next = { ...s.byName };
      delete next[s.active];
      return { active: "default", byName: next };
    });
  }

  const categories = useMemo(
    () => [...new Set(snippets.map((s) => s.category).filter(Boolean))].sort(),
    [snippets],
  );

  // Flat, newest-first (server order), search-filtered, favorites pinned to top.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? snippets.filter((s) =>
          `${s.title} ${s.category} ${s.body}`.toLowerCase().includes(q),
        )
      : snippets;
    const favSet = new Set(favorites);
    return [...matched].sort(
      (a, b) => Number(favSet.has(b.id)) - Number(favSet.has(a.id)),
    );
  }, [snippets, query, favorites]);

  const { page, setPage, totalPages, total, pageItems } = usePaged(filtered, 20);

  // Params shared by >= 2 snippets are treated as global "context" (e.g.
  // user_id) — set once, applied to every snippet's ${...}.
  const contextParams = useMemo(() => {
    const count = new Map<string, number>();
    for (const s of snippets) {
      for (const p of new Set(detectParams(s.body))) {
        count.set(p, (count.get(p) ?? 0) + 1);
      }
    }
    return [...count.entries()]
      .filter(([p, n]) => n >= 3 && !/_\d+$/.test(p))
      .map(([p]) => p)
      .sort();
  }, [snippets]);
  const contextSet = new Set(contextParams);

  const selected = snippets.find((s) => s.id === selectedId) ?? null;
  // Per-snippet params = detected params that aren't global context.
  const localParams = selected
    ? detectParams(selected.body).filter((p) => !contextSet.has(p))
    : [];
  const filled = selected ? fillParams(selected.body, params) : "";
  const generated = wrapTx && filled ? `BEGIN;\n\n${filled}\n\nCOMMIT;` : filled;
  // Params still left as ${...} (nothing entered) — warn before copying.
  const unfilled = selected
    ? detectParams(selected.body).filter((p) => !(params[p] ?? "").trim())
    : [];
  const destructive = selected ? isDestructive(selected.body) : false;

  // Keep params across selection so context (user_id, …) persists.
  function select(s: Snippet) {
    setSelectedId(s.id);
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* ---------- Context (shared params) ---------- */}
      {contextParams.length > 0 ? (
        <div className="flex flex-col gap-xs rounded-lg border border-hairline bg-canvas px-md py-sm">
          <button
            type="button"
            onClick={() => setCtxOpen((o) => !o)}
            className="flex items-center justify-between gap-sm text-left"
          >
            <span className="text-body-sm-medium text-ink">
              Context · {contextParams.length}
            </span>
            <span className="text-caption text-stone">
              {ctxOpen ? "Ẩn ▲" : "điền 1 lần, dùng mọi snippet · lưu sẵn ▾"}
            </span>
          </button>
          {ctxOpen ? (
            <div className="flex flex-wrap items-center gap-xs border-t border-hairline-soft pt-xs">
              <span className="text-caption text-stone">Profile:</span>
              {Object.keys(profileState.byName).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setProfileState((s) => ({ ...s, active: name }))
                  }
                  className={`rounded-full px-sm py-xxs text-caption transition-colors ${
                    profileState.active === name
                      ? "bg-primary text-on-primary"
                      : "bg-surface text-steel hover:text-primary"
                  }`}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={addProfile}
                className="rounded-full border border-hairline px-sm py-xxs text-caption text-steel hover:border-primary hover:text-primary"
              >
                + profile
              </button>
              {profileState.active !== "default" ? (
                <button
                  type="button"
                  onClick={deleteProfile}
                  className="text-caption text-brand-error hover:underline"
                >
                  Xoá profile
                </button>
              ) : null}
            </div>
          ) : null}
          {ctxOpen ? (
            <div className="grid grid-cols-2 gap-sm sm:grid-cols-3 lg:grid-cols-4">
              {contextParams.map((name) => (
                <div key={name} className="flex flex-col gap-xxs">
                  <label
                    htmlFor={`ctx-${name}`}
                    className="truncate font-mono text-micro text-stone"
                    title={name}
                  >
                    {name}
                  </label>
                  <input
                    id={`ctx-${name}`}
                    value={params[name] ?? ""}
                    onChange={(e) => setParam(name, e.target.value)}
                    placeholder="…"
                    className="h-9 w-full rounded-md border border-hairline bg-canvas px-sm text-body-sm text-ink outline-none transition-colors hover:border-stone focus:border-primary"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-md lg:grid-cols-[300px_1fr]">
        {/* ---------- Left: list ---------- */}
      <div className="flex flex-col gap-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)]">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm snippet…"
          className="shrink-0"
        />
        <Button
          type="button"
          onClick={() => setEdit({ mode: "new" })}
          className="shrink-0"
        >
          + New snippet
        </Button>
        <div className="shrink-0">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPage={setPage}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto pr-xxs">
          {total === 0 ? (
            <p className="text-body-sm text-stone">Không khớp.</p>
          ) : (
            pageItems.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-xxs rounded-md pr-xs transition-colors ${
                  s.id === selectedId ? "bg-primary/10" : "hover:bg-surface"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFavorite(s.id)}
                  title={favorites.includes(s.id) ? "Bỏ ghim" : "Ghim"}
                  aria-label={favorites.includes(s.id) ? "Bỏ ghim" : "Ghim"}
                  className={`shrink-0 px-xs text-body-sm ${
                    favorites.includes(s.id)
                      ? "text-brand-warn"
                      : "text-stone hover:text-steel"
                  }`}
                >
                  {favorites.includes(s.id) ? "★" : "☆"}
                </button>
                <button
                  type="button"
                  onClick={() => select(s)}
                  className={`flex min-w-0 flex-1 items-center justify-between gap-sm py-xxs text-left text-body-sm ${
                    s.id === selectedId
                      ? "font-medium text-primary"
                      : "text-slate"
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                  {s.category ? (
                    <span className="shrink-0 rounded-full bg-surface px-xs text-micro text-stone">
                      {s.category}
                    </span>
                  ) : null}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---------- Right: preview ---------- */}
      <div className="min-w-0 lg:sticky lg:top-20 lg:h-fit">
        {!selected ? (
          <div className="rounded-lg border border-hairline bg-canvas p-xl text-body-sm text-stone">
            Chọn một snippet ở danh sách bên trái.
          </div>
        ) : (
          <div className="flex flex-col gap-md rounded-lg border border-hairline bg-canvas p-lg">
            <div className="flex flex-wrap items-start justify-between gap-sm">
              <div className="flex flex-col gap-xxs">
                <div className="flex items-center gap-xs">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selected.id)}
                    title={favorites.includes(selected.id) ? "Bỏ ghim" : "Ghim"}
                    className={
                      favorites.includes(selected.id)
                        ? "text-brand-warn"
                        : "text-stone hover:text-steel"
                    }
                  >
                    {favorites.includes(selected.id) ? "★" : "☆"}
                  </button>
                  <h2 className="text-heading-4 text-ink">{selected.title}</h2>
                  {destructive ? (
                    <span className="rounded-full bg-brand-error/12 px-sm py-xxs text-caption font-medium text-brand-error">
                      destructive
                    </span>
                  ) : null}
                </div>
                <span className="text-caption text-stone">
                  {selected.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-xs">
                <CopyButton text={generated} label="Copy SQL" />
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setEdit({ mode: "edit", snippet: selected })}
                >
                  Edit
                </Button>
                <DeleteSnippetButton
                  id={selected.id}
                  onDone={() => {
                    setSelectedId(null);
                    router.refresh();
                  }}
                />
              </div>
            </div>

            {localParams.length > 0 ? (
              <div className="flex flex-col gap-xs rounded-md bg-surface p-sm">
                <p className="text-caption text-stone">
                  Tham số riêng của snippet (bỏ trống thì giữ{" "}
                  <code className="font-mono">{"${param}"}</code>).
                </p>
                <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
                  {localParams.map((name) => (
                    <div key={name} className="flex flex-col gap-xxs">
                      <label
                        htmlFor={`param-${name}`}
                        className="font-mono text-caption text-slate"
                      >
                        {"${" + name + "}"}
                      </label>
                      <Input
                        id={`param-${name}`}
                        value={params[name] ?? ""}
                        onChange={(e) => setParam(name, e.target.value)}
                        placeholder={name}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-sm">
              <label className="flex cursor-pointer items-center gap-xxs text-caption text-steel">
                <input
                  type="checkbox"
                  checked={wrapTx}
                  onChange={(e) => setWrapTx(e.target.checked)}
                />
                Bọc BEGIN/COMMIT
              </label>
              {unfilled.length > 0 ? (
                <span className="text-caption text-brand-warn">
                  Còn {unfilled.length} tham số trống:{" "}
                  {unfilled.map((p) => "${" + p + "}").join(", ")}
                </span>
              ) : null}
            </div>

            <pre className="max-h-[60vh] overflow-auto whitespace-pre rounded-md bg-surface-code p-md font-mono text-code-sm text-on-dark">
              {generated}
            </pre>
          </div>
        )}
        </div>
      </div>

      <Modal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={edit?.mode === "edit" ? "Edit snippet" : "New snippet"}
      >
        {edit ? (
          <SnippetForm
            categories={categories}
            initial={edit.mode === "edit" ? edit.snippet : undefined}
            onDone={() => {
              setEdit(null);
              router.refresh();
            }}
            onCancel={() => setEdit(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

const EMPTY: SnippetInput = { category: "", title: "", body: "" };

function SnippetForm({
  categories,
  initial,
  onDone,
  onCancel,
}: {
  categories: string[];
  initial?: Snippet;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SnippetInput>(
    initial
      ? { category: initial.category, title: initial.title, body: initial.body }
      : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof SnippetInput>(key: K, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = initial
        ? await updateSnippet(initial.id, form)
        : await createSnippet(form);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <FormField label="Category" htmlFor="snip-category">
          <Combobox
            id="snip-category"
            value={form.category}
            onChange={(v) => set("category", v)}
            options={categories}
            placeholder="rental"
          />
        </FormField>
        <FormField label="Title" htmlFor="snip-title">
          <Input
            id="snip-title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="reset-rental"
          />
        </FormField>
      </div>
      <FormField
        label="SQL"
        htmlFor="snip-body"
        hint="Dùng ${param} cho chỗ cần điền (vd ${user_id})."
      >
        <TextArea
          id="snip-body"
          mono
          rows={14}
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          placeholder="SELECT ... ;"
        />
      </FormField>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="flex justify-end gap-xs">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

function DeleteSnippetButton({
  id,
  onDone,
}: {
  id: number;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="danger"
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this snippet?")) return;
        startTransition(async () => {
          await deleteSnippet(id);
          onDone();
        });
      }}
    >
      {pending ? "…" : "Delete"}
    </Button>
  );
}
