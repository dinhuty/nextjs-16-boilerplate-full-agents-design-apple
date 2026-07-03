"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createTask,
  updateTask,
  deleteTask,
  type TaskInput,
} from "@/app/(app)/tasks/actions";
import type { TaskPr } from "@/db/schema";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { TextArea } from "@/components/atoms/TextArea";
import { Select } from "@/components/atoms/Select";
import { Combobox } from "@/components/atoms/Combobox";
import { Modal } from "@/components/atoms/Modal";
import { FormField } from "@/components/molecules/FormField";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { Pagination } from "@/components/atoms/Pagination";
import { BacklogIcon } from "@/components/atoms/icons";
import { KNOWN_REPOS } from "@/lib/release-procedure/constants";
import { usePaged } from "@/lib/use-paged";

export type Task = {
  id: number;
  title: string;
  description: string;
  slackTaskUrl: string;
  slackReviewUrl: string;
  procedureId: number | null;
  docUrl: string;
  prs: TaskPr[];
  note: string;
  tags: string[];
};

type ProcedureOption = { id: number; title: string };

// Reserved tag: marks a task as released (rendered as a distinct green badge).
const RELEASE_TAG = "release";

function prUrl(repo: string, pr: string): string {
  return `https://github.com/air-closet/${repo}/pull/${pr}`;
}

function TagChip({ tag }: { tag: string }) {
  const isRelease = tag === RELEASE_TAG;
  return (
    <span
      className={
        isRelease
          ? "inline-flex items-center gap-xxs rounded-full bg-[#22a06b]/12 px-sm py-xxs text-caption font-medium text-[#22a06b]"
          : "inline-flex items-center rounded-full bg-surface px-sm py-xxs text-caption text-steel"
      }
    >
      {isRelease ? "✅ released" : `#${tag}`}
    </span>
  );
}

function LinkChip({ href, label }: { href: string; label: string }) {
  if (!href.trim()) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-xxs rounded-full border border-hairline bg-surface px-sm py-xxs text-caption text-slate transition-colors hover:border-primary hover:text-primary"
    >
      {label} <span aria-hidden>↗</span>
    </a>
  );
}

export function TaskManager({
  tasks,
  procedures,
}: {
  tasks: Task[];
  procedures: ProcedureOption[];
}) {
  const [edit, setEdit] = useState<
    { mode: "new" } | { mode: "edit"; task: Task } | null
  >(null);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const procTitle = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of procedures) m.set(p.id, p.title);
    return m;
  }, [procedures]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) =>
      `${t.title} ${t.description} ${t.note} ${t.tags.join(" ")} ${t.prs
        .map((p) => `${p.repo} ${p.branch} ${p.pr}`)
        .join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  }, [tasks, query]);

  // Suggestions for the tag editor: the reserved "release" tag + every tag
  // already used across the user's tasks.
  const allTags = useMemo(() => {
    const s = new Set<string>([RELEASE_TAG]);
    for (const t of tasks) for (const tag of t.tags) s.add(tag);
    return [...s].sort();
  }, [tasks]);

  const { page, setPage, totalPages, total, pageItems } = usePaged(filtered, 8);

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm task…"
          className="max-w-[24rem]"
        />
        <Button type="button" onClick={() => setEdit({ mode: "new" })}>
          + New task
        </Button>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPage={setPage}
      />

      {total === 0 ? (
        <p className="text-body-sm text-stone">
          {tasks.length === 0 ? "Chưa có task nào." : "Không có task khớp."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          {pageItems.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-sm rounded-lg border border-hairline border-l-4 border-l-[#7c3aed] bg-canvas p-lg"
            >
              <div className="flex items-start justify-between gap-sm">
                <div className="flex items-center gap-xs">
                  <BacklogIcon className="h-5 w-5 shrink-0" />
                  <h3 className="text-heading-5 text-ink">{t.title}</h3>
                </div>
                <div className="flex shrink-0 gap-xs">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setEdit({ mode: "edit", task: t })}
                  >
                    Edit
                  </Button>
                  <DeleteTaskButton id={t.id} onDone={() => router.refresh()} />
                </div>
              </div>

              {t.tags.length > 0 ? (
                <div className="flex flex-wrap gap-xs">
                  {t.tags.map((tag) => (
                    <TagChip key={tag} tag={tag} />
                  ))}
                </div>
              ) : null}

              {t.description.trim() ? (
                <p className="whitespace-pre-wrap text-body-sm text-slate">
                  {t.description}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-xs">
                <LinkChip href={t.slackTaskUrl} label="Slack task" />
                <LinkChip href={t.slackReviewUrl} label="Slack review" />
                <LinkChip href={t.docUrl} label="Document" />
              </div>

              {t.procedureId ? (
                <Link
                  href={`/release-procedure/${t.procedureId}`}
                  className="text-body-sm text-primary underline"
                >
                  🚀 {procTitle.get(t.procedureId) ?? "Release procedure"}
                </Link>
              ) : null}

              {t.prs.length > 0 ? (
                <div className="flex flex-col gap-xxs">
                  {t.prs.map((p, i) => (
                    <div key={i} className="text-body-sm text-slate">
                      <span className="font-mono">{p.repo || "?"}</span>
                      {p.branch ? (
                        <span className="text-stone"> · {p.branch}</span>
                      ) : null}
                      {p.pr ? (
                        <>
                          {" — "}
                          <a
                            href={prUrl(p.repo, p.pr)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-tag underline"
                          >
                            #{p.pr} ↗
                          </a>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {t.note.trim() ? (
                <p className="whitespace-pre-wrap rounded-md bg-surface p-sm text-body-sm text-slate">
                  {t.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={edit?.mode === "edit" ? "Edit task" : "New task"}
      >
        {edit ? (
          <TaskForm
            procedures={procedures}
            suggestions={allTags}
            initial={edit.mode === "edit" ? edit.task : undefined}
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

const EMPTY: TaskInput = {
  title: "",
  description: "",
  slackTaskUrl: "",
  slackReviewUrl: "",
  procedureId: null,
  docUrl: "",
  prs: [],
  note: "",
  tags: [],
};

function TaskForm({
  procedures,
  suggestions,
  initial,
  onDone,
  onCancel,
}: {
  procedures: ProcedureOption[];
  suggestions: string[];
  initial?: Task;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TaskInput>(
    initial
      ? {
          title: initial.title,
          description: initial.description,
          slackTaskUrl: initial.slackTaskUrl,
          slackReviewUrl: initial.slackReviewUrl,
          procedureId: initial.procedureId,
          docUrl: initial.docUrl,
          prs: initial.prs,
          note: initial.note,
          tags: initial.tags,
        }
      : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = initial
        ? await updateTask(initial.id, form)
        : await createTask(form);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  const procOptions = [
    { value: "", label: "— Không liên kết —" },
    ...procedures.map((p) => ({ value: String(p.id), label: p.title })),
  ];

  return (
    <div className="flex flex-col gap-md">
      <FormField label="Tên task" htmlFor="task-title">
        <Input
          id="task-title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="AIRCLOSET-129956 …"
        />
      </FormField>
      <FormField label="Task làm về gì" htmlFor="task-desc">
        <TextArea
          id="task-desc"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Mô tả ngắn nội dung task…"
        />
      </FormField>
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <FormField label="Link Slack task" htmlFor="task-slack">
          <Input
            id="task-slack"
            value={form.slackTaskUrl}
            onChange={(e) => set("slackTaskUrl", e.target.value)}
            placeholder="https://…slack.com/…"
          />
        </FormField>
        <FormField label="Link Slack review" htmlFor="task-review">
          <Input
            id="task-review"
            value={form.slackReviewUrl}
            onChange={(e) => set("slackReviewUrl", e.target.value)}
            placeholder="https://…slack.com/…"
          />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <FormField label="Release procedure" htmlFor="task-proc">
          <Select
            id="task-proc"
            value={form.procedureId ? String(form.procedureId) : ""}
            onChange={(v) => set("procedureId", v ? Number(v) : null)}
            options={procOptions}
            placeholder="— Không liên kết —"
          />
        </FormField>
        <FormField label="Link document" htmlFor="task-doc">
          <Input
            id="task-doc"
            value={form.docUrl}
            onChange={(e) => set("docUrl", e.target.value)}
            placeholder="https://…"
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-xs">
        <div className="flex items-center justify-between">
          <span className="text-body-sm-medium text-slate">PR / branch</span>
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              set("prs", [...form.prs, { repo: "", branch: "", pr: "" }])
            }
          >
            + PR
          </Button>
        </div>
        {form.prs.map((p, i) => (
          <div key={i} className="flex gap-xs">
            <Combobox
              value={p.repo}
              onChange={(v) =>
                set(
                  "prs",
                  form.prs.map((x, j) => (j === i ? { ...x, repo: v } : x)),
                )
              }
              options={KNOWN_REPOS}
              placeholder="repo"
            />
            <Input
              value={p.branch}
              onChange={(e) =>
                set(
                  "prs",
                  form.prs.map((x, j) =>
                    j === i ? { ...x, branch: e.target.value } : x,
                  ),
                )
              }
              placeholder="branch"
            />
            <Input
              value={p.pr}
              onChange={(e) =>
                set(
                  "prs",
                  form.prs.map((x, j) =>
                    j === i ? { ...x, pr: e.target.value } : x,
                  ),
                )
              }
              placeholder="PR #"
              className="max-w-[8rem]"
            />
            <Button
              variant="ghost"
              type="button"
              onClick={() =>
                set(
                  "prs",
                  form.prs.filter((_, j) => j !== i),
                )
              }
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <FormField label="Tags" htmlFor="task-tags">
        <TagInput
          tags={form.tags}
          onChange={(tags) => set("tags", tags)}
          suggestions={suggestions}
        />
      </FormField>

      <FormField label="Note" htmlFor="task-note">
        <TextArea
          id="task-note"
          rows={4}
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Ghi chú cá nhân…"
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

function TagInput({
  tags,
  onChange,
  suggestions,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) {
  const [text, setText] = useState("");

  function add(raw: string) {
    const t = raw.trim().toLowerCase();
    setText("");
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
  }

  const available = suggestions.filter((s) => !tags.includes(s));

  return (
    <div className="flex flex-col gap-xs">
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-xs">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-xxs rounded-full bg-surface px-sm py-xxs text-caption text-slate"
            >
              {t === RELEASE_TAG ? "✅ released" : `#${t}`}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="text-stone hover:text-ink"
                aria-label={`Bỏ tag ${t}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <Input
        id="task-tags"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          }
        }}
        placeholder="Nhập tag rồi Enter (vd: release)"
      />
      {available.length > 0 ? (
        <div className="flex flex-wrap gap-xs">
          {available.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-hairline px-sm py-xxs text-caption text-steel transition-colors hover:border-primary hover:text-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DeleteTaskButton({ id, onDone }: { id: number; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="danger"
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this task?")) return;
        startTransition(async () => {
          await deleteTask(id);
          onDone();
        });
      }}
    >
      {pending ? "…" : "Delete"}
    </Button>
  );
}
