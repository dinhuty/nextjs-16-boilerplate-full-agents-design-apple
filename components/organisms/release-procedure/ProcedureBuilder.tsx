"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type {
  ProcedureBlock,
  ProcedureLanguage,
  ReleaseBranch,
} from "@/db/schema";
import {
  createProcedure,
  updateProcedure,
  type ProcedureInput,
} from "@/app/(app)/release-procedure/actions";
import {
  LANGUAGES,
  detectVariables,
  procedureToMarkdown,
} from "@/lib/release-procedure/markdown";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { TextArea } from "@/components/atoms/TextArea";
import { Label } from "@/components/atoms/Label";
import { Select } from "@/components/atoms/Select";
import { Combobox } from "@/components/atoms/Combobox";
import { Modal } from "@/components/atoms/Modal";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { KNOWN_REPOS } from "@/lib/release-procedure/constants";
import { MarkdownPreview } from "@/components/organisms/release-procedure/MarkdownPreview";

export type TemplateLite = {
  id: number;
  category: string;
  name: string;
  repo: string;
  bodyJa: string;
  bodyEn: string;
  bodyVi: string;
};

type Props = {
  templates: TemplateLite[];
  initial?: {
    id: number;
    title: string;
    description: string;
    language: ProcedureLanguage;
    blocks: ProcedureBlock[];
    variables: { branches: ReleaseBranch[]; vars: Record<string, string> };
  };
};

const TITLE_PREFIX = "AIRCLOSET-";

function bodyFor(t: TemplateLite, lang: ProcedureLanguage): string {
  return lang === "ja" ? t.bodyJa : lang === "en" ? t.bodyEn : t.bodyVi;
}

export function ProcedureBuilder({ templates, initial }: Props) {
  const [rest, setRest] = useState(
    initial ? initial.title.replace(new RegExp(`^${TITLE_PREFIX}`), "") : "",
  );
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [language, setLanguage] = useState<ProcedureLanguage>(
    initial?.language ?? "ja",
  );
  const [blocks, setBlocks] = useState<ProcedureBlock[]>(initial?.blocks ?? []);
  const [branches, setBranches] = useState<ReleaseBranch[]>(
    initial?.variables.branches ?? [],
  );
  const [vars, setVars] = useState<Record<string, string>>(
    initial?.variables.vars ?? {},
  );
  const [pickId, setPickId] = useState<string>("");
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dragIndex = useRef<number | null>(null);
  // SQL modal: which block index is being edited (null = closed) + the draft.
  const [sqlFor, setSqlFor] = useState<number | null>(null);
  const [sqlDraft, setSqlDraft] = useState("");
  // Which block bodies are collapsed (by index). The header toggle collapses/
  // expands all; each block also has its own toggle.
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(
    new Set(),
  );
  const allCollapsed =
    blocks.length > 0 && blocks.every((_, i) => collapsedBlocks.has(i));
  function toggleBlock(i: number) {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }
  // Last caret/selection per block textarea → "+ Chèn SQL" inserts right there.
  const selRef = useRef<Record<number, { start: number; end: number }>>({});

  function insertSql() {
    if (sqlFor === null) return;
    const i = sqlFor;
    const sql = sqlDraft.replace(/\n+$/, "").replace(/^\n+/, "");
    if (!sql) {
      setSqlFor(null);
      return;
    }
    setBlocks((prev) =>
      prev.map((x, j) => {
        if (j !== i) return x;
        const body = x.body;
        const sel = selRef.current[i];
        const start = Math.min(sel?.start ?? body.length, body.length);
        const end = Math.min(sel?.end ?? body.length, body.length);
        // Indent continuation lines to the caret line's indentation so a
        // multi-line paste stays valid inside a (possibly nested) code fence.
        const lineStart = body.lastIndexOf("\n", start - 1) + 1;
        const indent = body.slice(lineStart).match(/^[ \t]*/)?.[0] ?? "";
        const inserted = sql
          .split("\n")
          .map((ln, idx) => (idx === 0 ? ln : indent + ln))
          .join("\n");
        return {
          ...x,
          body: body.slice(0, start) + inserted + body.slice(end),
        };
      }),
    );
    setSqlFor(null);
    setSqlDraft("");
  }

  const fullTitle = `${TITLE_PREFIX}${rest.trim()}`;
  const customVars = useMemo(() => detectVariables(blocks), [blocks]);
  const markdown = useMemo(
    () => procedureToMarkdown(fullTitle, blocks, { branches, vars }),
    [fullTitle, blocks, branches, vars],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, TemplateLite[]>();
    for (const t of templates) {
      const key = t.category || "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return [...map.entries()];
  }, [templates]);

  function addTemplate() {
    const id = Number(pickId);
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setBlocks((prev) => [
      ...prev,
      { templateId: t.id, name: t.name, repo: t.repo, body: bodyFor(t, language) },
    ]);
    if (t.repo && !branches.some((b) => b.repo === t.repo)) {
      setBranches((prev) => [...prev, { repo: t.repo, branch: "", pr: "" }]);
    }
    setPickId("");
  }

  function changeLanguage(lang: ProcedureLanguage) {
    setLanguage(lang);
    // Re-fill unedited blocks from their source template in the new language.
    setBlocks((prev) =>
      prev.map((b) => {
        const t = templates.find((x) => x.id === b.templateId);
        return t ? { ...b, body: bodyFor(t, lang) } : b;
      }),
    );
  }

  function moveBlock(from: number, to: number) {
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function save() {
    if (!rest.trim()) {
      setError("Enter a task number/name after the AIRCLOSET- prefix.");
      return;
    }
    if (blocks.length === 0) {
      setError("Add at least one template block.");
      return;
    }
    setError(null);
    const payload: ProcedureInput = {
      title: fullTitle,
      description: desc.trim(),
      language,
      blocks,
      variables: {
        branches: branches.filter(
          (b) => b.repo.trim() || b.branch.trim() || b.pr.trim(),
        ),
        vars,
      },
    };
    startTransition(async () => {
      if (initial) await updateProcedure(initial.id, payload);
      else await createProcedure(payload);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
      {/* ---------- Editor ---------- */}
      <div className="flex flex-col gap-lg">
        {/* Title + language */}
        <div className="flex flex-col gap-sm rounded-lg border border-hairline bg-canvas p-md">
          <div className="flex flex-col gap-xxs">
            <Label htmlFor="title">Task</Label>
            <div className="flex items-center rounded-md border border-hairline bg-canvas focus-within:border-primary">
              <span className="pl-sm text-body-md text-stone">{TITLE_PREFIX}</span>
              <input
                id="title"
                value={rest}
                onChange={(e) => setRest(e.target.value)}
                placeholder="129956 / feature-name"
                className="h-12 w-full rounded-md bg-transparent pr-sm pl-xxs text-body-md text-ink outline-none placeholder:text-muted"
              />
            </div>
          </div>
          <div className="flex flex-col gap-xxs">
            <Label htmlFor="desc">Mô tả</Label>
            <TextArea
              id="desc"
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Release này làm về gì…"
            />
          </div>
          <div className="flex flex-col gap-xxs">
            <Label>Language</Label>
            <div className="flex gap-xs">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => changeLanguage(l.value)}
                  className={`rounded-md border px-sm py-xxs text-body-sm transition-colors ${
                    language === l.value
                      ? "border-primary bg-primary text-on-primary"
                      : "border-hairline bg-canvas text-steel hover:bg-surface"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Release branches */}
        <div className="flex flex-col gap-sm rounded-lg border border-hairline bg-canvas p-md">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-5 text-ink">Release branches</h2>
            <Button
              variant="secondary"
              type="button"
              onClick={() =>
                setBranches((p) => [...p, { repo: "", branch: "", pr: "" }])
              }
            >
              + Branch
            </Button>
          </div>
          <p className="text-caption text-stone">
            Nhập repo + số PR → tự điền{" "}
            <code className="font-mono">{"${pr_list}"}</code>,{" "}
            <code className="font-mono">{"${pr_url}"}</code>,{" "}
            <code className="font-mono">{"${pr}"}</code> (theo repo). Script git
            giữ nguyên branch gốc của template.
          </p>
          {branches.length === 0 ? (
            <p className="text-body-sm text-muted">Chưa có branch nào.</p>
          ) : (
            <div className="flex flex-col gap-xs">
              {branches.map((b, i) => (
                <div key={i} className="flex gap-xs">
                  <Combobox
                    value={b.repo}
                    onChange={(v) =>
                      setBranches((p) =>
                        p.map((x, j) => (j === i ? { ...x, repo: v } : x)),
                      )
                    }
                    options={KNOWN_REPOS}
                    placeholder="repo (acm-api)"
                  />
                  <Input
                    value={b.pr}
                    onChange={(e) =>
                      setBranches((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, pr: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Số PR (vd: 335)"
                    className="max-w-[12rem]"
                  />
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() =>
                      setBranches((p) => p.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template picker */}
        <div className="flex flex-col gap-sm rounded-lg border border-hairline bg-canvas p-md">
          <h2 className="text-heading-5 text-ink">Add template block</h2>
          <div className="flex gap-xs">
            <Select
              value={pickId}
              onChange={setPickId}
              placeholder="Chọn template…"
              groups={grouped.map(([cat, list]) => ({
                label: cat,
                options: list.map((t) => ({
                  value: String(t.id),
                  label: t.name,
                })),
              }))}
            />
            <Button type="button" onClick={addTemplate} disabled={!pickId}>
              Add
            </Button>
          </div>
          {templates.length === 0 ? (
            <p className="text-caption text-stone">
              Chưa có template nào.{" "}
              <Link href="/release-procedure/templates" className="underline">
                Tạo template
              </Link>
              .
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-sm border-t border-hairline pt-sm">
            <p className="text-caption text-stone">
              Hoặc thêm block trống để tự nhập nội dung.
            </p>
            <Button
              variant="secondary"
              type="button"
              onClick={() =>
                setBlocks((p) => [
                  ...p,
                  { templateId: null, name: "New block", repo: "", body: "" },
                ])
              }
            >
              + Blank block
            </Button>
          </div>
        </div>

        {/* Blocks (drag to reorder) */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between gap-sm">
            <h2 className="text-heading-5 text-ink">
              Steps ({blocks.length}) — drag to reorder
            </h2>
            {blocks.length > 0 ? (
              <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  setCollapsedBlocks(
                    allCollapsed
                      ? new Set()
                      : new Set(blocks.map((_, i) => i)),
                  )
                }
              >
                {allCollapsed ? "Mở rộng tất cả" : "Thu gọn tất cả"}
              </Button>
            ) : null}
          </div>
          {blocks.map((block, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const from = dragIndex.current;
                if (from !== null && from !== i) moveBlock(from, i);
                dragIndex.current = null;
              }}
              className="flex flex-col gap-xs rounded-lg border border-hairline bg-canvas p-md"
            >
              <div className="flex items-center gap-xs">
                <span className="cursor-grab text-stone" title="Kéo để đổi thứ tự">
                  ⠿
                </span>
                <button
                  type="button"
                  onClick={() => toggleBlock(i)}
                  className="shrink-0 rounded px-xxs text-stone hover:text-ink"
                  title={collapsedBlocks.has(i) ? "Mở rộng" : "Thu gọn"}
                  aria-label={collapsedBlocks.has(i) ? "Mở rộng block" : "Thu gọn block"}
                >
                  {collapsedBlocks.has(i) ? "▸" : "▾"}
                </button>
                <Input
                  value={block.name}
                  onChange={(e) =>
                    setBlocks((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="Tên block"
                  className="flex-1"
                />
                <div className="w-40 shrink-0">
                  <Combobox
                    value={block.repo}
                    onChange={(v) =>
                      setBlocks((p) =>
                        p.map((x, j) => (j === i ? { ...x, repo: v } : x)),
                      )
                    }
                    options={KNOWN_REPOS}
                    placeholder="repo (tùy chọn)"
                  />
                </div>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setBlocks((p) => p.filter((_, j) => j !== i))}
                >
                  Remove
                </Button>
              </div>
              {!collapsedBlocks.has(i) ? (
                <>
                  <TextArea
                    mono
                    rows={Math.min(
                      16,
                      Math.max(4, block.body.split("\n").length),
                    )}
                    value={block.body}
                    onSelect={(e) => {
                      selRef.current[i] = {
                        start: e.currentTarget.selectionStart,
                        end: e.currentTarget.selectionEnd,
                      };
                    }}
                    onBlur={(e) => {
                      selRef.current[i] = {
                        start: e.currentTarget.selectionStart,
                        end: e.currentTarget.selectionEnd,
                      };
                    }}
                    onChange={(e) =>
                      setBlocks((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, body: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  {/sql/i.test(block.name) ? (
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          setSqlDraft("");
                          setSqlFor(i);
                        }}
                      >
                        + Chèn SQL
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          ))}
        </div>

        {/* Custom variables */}
        {customVars.length > 0 ? (
          <div className="flex flex-col gap-sm rounded-lg border border-hairline bg-canvas p-md">
            <h2 className="text-heading-5 text-ink">Variables</h2>
            {customVars.map((name) => (
              <div key={name} className="flex flex-col gap-xxs">
                <Label htmlFor={`var-${name}`}>{"${" + name + "}"}</Label>
                <Input
                  id={`var-${name}`}
                  value={vars[name] ?? ""}
                  onChange={(e) =>
                    setVars((p) => ({ ...p, [name]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* ---------- Preview ---------- */}
      <div className="flex flex-col gap-sm lg:sticky lg:top-20 lg:h-fit">
        <div className="flex flex-wrap items-center justify-between gap-xs">
          <div className="flex gap-xs">
            <Button
              variant={showRaw ? "secondary" : "primary"}
              type="button"
              onClick={() => setShowRaw(false)}
            >
              Preview
            </Button>
            <Button
              variant={showRaw ? "primary" : "secondary"}
              type="button"
              onClick={() => setShowRaw(true)}
            >
              Raw
            </Button>
          </div>
          <div className="flex gap-xs">
            <Link
              href={
                initial ? `/release-procedure/${initial.id}` : "/release-procedure"
              }
            >
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="max-h-[calc(100vh-9rem)] overflow-auto rounded-lg border border-hairline bg-canvas p-md">
          {showRaw ? (
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-code-sm text-slate">
              {markdown}
            </pre>
          ) : (
            <MarkdownPreview markdown={markdown} />
          )}
        </div>
      </div>

      <Modal
        open={sqlFor !== null}
        onClose={() => setSqlFor(null)}
        title="Nhập SQL"
      >
        <p className="text-caption text-stone">
          Dán SQL vào đây — sẽ được chèn vào đúng vị trí con trỏ trong block, tự
          canh lề theo code fence nên không vỡ định dạng khi nhiều dòng.
        </p>
        <TextArea
          mono
          rows={14}
          value={sqlDraft}
          onChange={(e) => setSqlDraft(e.target.value)}
          placeholder={"BEGIN;\n\n-- SQL của bạn ở đây\n\nCOMMIT;"}
          autoFocus
        />
        <div className="flex justify-end gap-xs">
          <Button variant="ghost" type="button" onClick={() => setSqlFor(null)}>
            Hủy
          </Button>
          <Button type="button" onClick={insertSql}>
            Chèn vào block
          </Button>
        </div>
      </Modal>
    </div>
  );
}
