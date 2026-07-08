"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createMdDoc,
  updateMdDoc,
  type MdDocInput,
} from "@/app/(app)/md-docs/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MarkdownPreview } from "@/components/organisms/release-procedure/MarkdownPreview";
import type { MdTagDef } from "@/components/organisms/md-docs/MdTags";

export type MdEditorInitial = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: number; // millis, for the save conflict guard
};

const TA_CLASS =
  "min-h-[60vh] w-full flex-1 resize-none rounded-md border border-hairline bg-canvas p-sm font-mono text-code-sm text-ink outline-none transition-colors hover:border-stone focus:border-primary";

// ---------- Pure text transforms (no refs / no state) ----------
type Edit = { next: string; start: number; end: number };

function wrapAt(b: string, s: number, e: number, before: string, after = before): Edit {
  const sel = b.slice(s, e);
  return {
    next: b.slice(0, s) + before + sel + after + b.slice(e),
    start: s + before.length,
    end: s + before.length + sel.length,
  };
}
function linkAt(b: string, s: number, e: number): Edit {
  const sel = b.slice(s, e) || "text";
  const ins = `[${sel}](url)`;
  const us = s + sel.length + 3;
  return { next: b.slice(0, s) + ins + b.slice(e), start: us, end: us + 3 };
}
function prefixLineAt(b: string, s: number, e: number, prefix: string): Edit {
  const ls = b.lastIndexOf("\n", s - 1) + 1;
  return {
    next: b.slice(0, ls) + prefix + b.slice(ls),
    start: s + prefix.length,
    end: e + prefix.length,
  };
}
function insertBlockAt(b: string, s: number, e: number, text: string): Edit {
  const nl = s > 0 && b[s - 1] !== "\n" ? "\n" : "";
  const ins = nl + text;
  return { next: b.slice(0, s) + ins + b.slice(e), start: s + ins.length, end: s + ins.length };
}
function tabAt(b: string, s: number, e: number): Edit {
  return { next: b.slice(0, s) + "  " + b.slice(e), start: s + 2, end: s + 2 };
}
// Continue a markdown list on Enter (or exit it if the current item is empty).
function enterListAt(b: string, s: number): Edit | null {
  const ls = b.lastIndexOf("\n", s - 1) + 1;
  const line = b.slice(ls, s);
  const m = line.match(/^(\s*)([-*]|\d+\.)(\s+\[[ xX]\])?(\s+)(.*)$/);
  if (!m) return null;
  const [, indent, marker, checkbox, sp, content] = m;
  if (content.trim() === "") {
    return { next: b.slice(0, ls) + b.slice(s), start: ls, end: ls };
  }
  const num = marker.match(/^(\d+)\.$/);
  const nextMarker = num ? `${Number(num[1]) + 1}.` : marker;
  const ins = "\n" + indent + nextMarker + (checkbox ? " [ ]" : "") + sp;
  return { next: b.slice(0, s) + ins + b.slice(s), start: s + ins.length, end: s + ins.length };
}

const TOOLBAR: { label: string; title: string; edit: (b: string, s: number, e: number) => Edit }[] = [
  { label: "H", title: "Heading", edit: (b, s, e) => prefixLineAt(b, s, e, "## ") },
  { label: "B", title: "Bold (⌘B)", edit: (b, s, e) => wrapAt(b, s, e, "**") },
  { label: "I", title: "Italic (⌘I)", edit: (b, s, e) => wrapAt(b, s, e, "*") },
  { label: "</>", title: "Inline code", edit: (b, s, e) => wrapAt(b, s, e, "`") },
  { label: "Link", title: "Link (⌘K)", edit: linkAt },
  { label: "• List", title: "Bullet list", edit: (b, s, e) => prefixLineAt(b, s, e, "- ") },
  { label: "☑", title: "Checklist", edit: (b, s, e) => prefixLineAt(b, s, e, "- [ ] ") },
  { label: "Code", title: "Code block", edit: (b, s, e) => insertBlockAt(b, s, e, "```bash\n\n```\n") },
  {
    label: "Table",
    title: "Table",
    edit: (b, s, e) => insertBlockAt(b, s, e, "| Cột 1 | Cột 2 |\n| --- | --- |\n| a | b |\n"),
  },
];

export function MdDocEditor({
  initial,
  tags,
}: {
  initial?: MdEditorInitial;
  tags: MdTagDef[];
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [tagsText, setTagsText] = useState(initial?.tags.join(", ") ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [restorable, setRestorable] = useState<{
    title: string;
    tagsText: string;
    body: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const draftKey = `md-doc-draft:${initial?.id ?? "new"}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      const base = {
        title: initial?.title ?? "",
        tagsText: initial?.tags.join(", ") ?? "",
        body: initial?.body ?? "",
      };
      if (d.title !== base.title || d.tagsText !== base.tagsText || d.body !== base.body) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRestorable(d);
      }
    } catch {
      // ignore
    }
  }, [draftKey, initial]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, tagsText, body }));
      } catch {
        // ignore
      }
    }, 800);
    return () => clearTimeout(t);
  }, [draftKey, title, tagsText, body]);

  // Apply an Edit to a known textarea element (element passed in — no ref read
  // during render). Restores the caret after React re-renders.
  function runEdit(ta: HTMLTextAreaElement, edit: (b: string, s: number, e: number) => Edit) {
    const r = edit(body, ta.selectionStart, ta.selectionEnd);
    setBody(r.next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(r.start, r.end);
    });
  }

  function onKeyDown(ev: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = ev.currentTarget;
    const meta = ev.metaKey || ev.ctrlKey;
    const k = ev.key.toLowerCase();
    if (meta && k === "b") {
      ev.preventDefault();
      runEdit(ta, (b, s, e) => wrapAt(b, s, e, "**"));
    } else if (meta && k === "i") {
      ev.preventDefault();
      runEdit(ta, (b, s, e) => wrapAt(b, s, e, "*"));
    } else if (meta && k === "k") {
      ev.preventDefault();
      runEdit(ta, linkAt);
    } else if (ev.key === "Tab") {
      ev.preventDefault();
      runEdit(ta, tabAt);
    } else if (ev.key === "Enter" && ta.selectionStart === ta.selectionEnd) {
      const r = enterListAt(body, ta.selectionStart);
      if (r) {
        ev.preventDefault();
        setBody(r.next);
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(r.start, r.end);
        });
      }
    }
  }

  function addTag(name: string) {
    const cur = tagsText.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (cur.includes(name)) return;
    setTagsText([...cur, name].join(", "));
  }

  function save(force = false) {
    setError(null);
    setConflict(false);
    const input: MdDocInput = { title, body, tags: tagsText.split(",") };
    startTransition(async () => {
      const res = initial
        ? await updateMdDoc(initial.id, input, { baseUpdatedAt: initial.updatedAt, force })
        : await createMdDoc(input);
      if (res.ok) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // ignore
        }
        router.push(`/md-docs/${res.id ?? initial?.id}`);
      } else {
        setError(res.error);
        if (res.conflict) setConflict(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-sm">
      {restorable ? (
        <div className="flex flex-wrap items-center justify-between gap-sm rounded-md bg-brand-warn/10 px-md py-sm text-caption text-brand-warn">
          <span>Có bản nháp chưa lưu.</span>
          <div className="flex gap-xs">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setTitle(restorable.title);
                setTagsText(restorable.tagsText);
                setBody(restorable.body);
                setRestorable(null);
              }}
            >
              Khôi phục
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(draftKey);
                } catch {
                  // ignore
                }
                setRestorable(null);
              }}
            >
              Bỏ
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-sm">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề doc…"
          className="max-w-[28rem]"
        />
        <Input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="tags: seed, running…"
          className="max-w-[18rem]"
        />
        <div className="ml-auto flex gap-xs">
          <Button
            variant="ghost"
            type="button"
            onClick={() => router.push(initial ? `/md-docs/${initial.id}` : "/md-docs")}
          >
            Cancel
          </Button>
          {conflict ? (
            <Button variant="danger" type="button" disabled={pending} onClick={() => save(true)}>
              Ghi đè
            </Button>
          ) : null}
          <Button type="button" disabled={pending} onClick={() => save()}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-xs">
          <span className="text-caption text-stone">Tag:</span>
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addTag(t.name)}
              className="rounded-full px-sm py-xxs text-caption font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: `${t.color}22`, color: t.color }}
            >
              + #{t.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-xxs rounded-md border border-hairline bg-surface-soft p-xxs">
        {TOOLBAR.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.title}
            onClick={() => {
              const ta = taRef.current;
              if (ta) runEdit(ta, b.edit);
            }}
            className="rounded px-sm py-xxs font-mono text-body-sm text-steel transition-colors hover:bg-surface hover:text-primary"
          >
            {b.label}
          </button>
        ))}
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <textarea
          ref={taRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={"# Tiêu đề\n\nNội dung markdown…"}
          className={TA_CLASS}
          spellCheck={false}
        />
        <div className="max-h-[70vh] min-h-[60vh] overflow-auto rounded-md border border-hairline bg-canvas p-md">
          <MarkdownPreview markdown={body} breaks />
        </div>
      </div>
    </div>
  );
}
