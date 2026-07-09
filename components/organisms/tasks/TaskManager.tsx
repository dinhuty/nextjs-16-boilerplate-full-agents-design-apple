"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTask,
  updateTask,
  deleteTask,
  updateTaskChecklist,
  type TaskInput,
} from "@/app/(app)/tasks/actions";
import type { TaskChecklistItem } from "@/db/schema";
import {
  TaskBody,
  TagChip,
  RELEASE_TAG,
  prUrl,
  backlogUrlOf,
  defaultBacklogUrl,
  checklistProgress,
  type Task,
} from "@/components/organisms/tasks/TaskBody";
import { Button } from "@/components/atoms/Button";
import { CopyButton } from "@/components/atoms/CopyButton";
import { Input } from "@/components/atoms/Input";
import { TextArea } from "@/components/atoms/TextArea";
import { Select } from "@/components/atoms/Select";
import { Combobox } from "@/components/atoms/Combobox";
import { Modal } from "@/components/atoms/Modal";
import { FormField } from "@/components/molecules/FormField";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { Pagination } from "@/components/atoms/Pagination";
import {
  BacklogIcon,
  ListIcon,
  GridIcon,
  CheckIcon,
} from "@/components/atoms/icons";
import { KNOWN_REPOS } from "@/lib/release-procedure/constants";
import { usePaged } from "@/lib/use-paged";

export type { Task };

type ProcedureOption = { id: number; title: string };
type DocOption = { id: number; title: string };

// Reserved tag that marks a task as done (used by the "Ẩn done" filter).
const DONE_TAG = "done";

// Plain-text summary of a task for pasting into Slack / a standup note.
function taskSummary(t: Task, procTitle: Map<number, string>): string {
  const lines: string[] = [t.title];
  if (t.description.trim()) lines.push(t.description.trim());
  lines.push(`Backlog: ${backlogUrlOf(t)}`);
  if (t.procedureId) {
    lines.push(`Release: ${procTitle.get(t.procedureId) ?? "procedure"}`);
  }
  if (t.slackTaskUrl.trim()) lines.push(`Slack task: ${t.slackTaskUrl.trim()}`);
  if (t.slackReviewUrl.trim())
    lines.push(`Slack review: ${t.slackReviewUrl.trim()}`);
  if (t.docUrl.trim()) lines.push(`Document: ${t.docUrl.trim()}`);
  if (t.basicDesignUrl.trim()) {
    lines.push(`Basic design: ${t.basicDesignUrl.trim()}`);
  }
  for (const l of t.links) {
    if (l.url.trim()) lines.push(`${l.label || "Link"}: ${l.url.trim()}`);
  }
  const prs = t.prs.filter((p) => p.pr.trim());
  if (prs.length) {
    lines.push("PRs:");
    for (const p of prs) {
      lines.push(
        `- ${p.repo}${p.branch ? ` (${p.branch})` : ""}: ${prUrl(p.repo, p.pr)}`,
      );
    }
  }
  if (t.checklist.length) {
    lines.push("Checklist:");
    for (const c of t.checklist) {
      lines.push(`- [${c.done ? "x" : " "}] ${c.text}${c.tested ? " (đã test)" : ""}`);
    }
  }
  if (t.note.trim()) lines.push(`Note: ${t.note.trim()}`);
  return lines.join("\n");
}

export function TaskManager({
  tasks,
  procedures,
  docs,
  openTaskId,
}: {
  tasks: Task[];
  procedures: ProcedureOption[];
  docs: DocOption[];
  openTaskId?: number | null;
}) {
  const [edit, setEdit] = useState<
    { mode: "new" } | { mode: "edit"; task: Task } | null
  >(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [detail, setDetail] = useState<Task | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const router = useRouter();

  // Remember the chosen view across reloads.
  useEffect(() => {
    const v = localStorage.getItem("tasks:view");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v === "grid" || v === "list") setView(v);
  }, []);
  useEffect(() => {
    localStorage.setItem("tasks:view", view);
  }, [view]);

  // Deep link (/tasks?task=<id>, e.g. from Cmd+K) opens that task's detail.
  useEffect(() => {
    if (!openTaskId) return;
    const t = tasks.find((x) => x.id === openTaskId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t) setDetail(t);
  }, [openTaskId, tasks]);

  const procTitle = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of procedures) m.set(p.id, p.title);
    return m;
  }, [procedures]);

  const docTitle = useMemo(() => {
    const m = new Map<number, string>();
    for (const d of docs) m.set(d.id, d.title);
    return m;
  }, [docs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (hideDone && t.tags.includes(DONE_TAG)) return false;
      if (tagFilter && !t.tags.includes(tagFilter)) return false;
      if (!q) return true;
      return `${t.title} ${t.description} ${t.note} ${t.tags.join(" ")} ${t.prs
        .map((p) => `${p.repo} ${p.branch} ${p.pr}`)
        .join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [tasks, query, tagFilter, hideDone]);

  // Suggestions for the tag editor: the reserved "release" tag + every tag
  // already used across the user's tasks.
  const allTags = useMemo(() => {
    const s = new Set<string>([RELEASE_TAG, DONE_TAG]);
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
        <div className="flex items-center gap-sm">
          <div className="flex overflow-hidden rounded-md border border-hairline">
            {(
              [
                { v: "list", Icon: ListIcon, label: "Xem danh sách" },
                { v: "grid", Icon: GridIcon, label: "Xem lưới" },
              ] as const
            ).map(({ v, Icon, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                title={label}
                aria-label={label}
                aria-pressed={view === v}
                className={`px-sm py-xs transition-colors ${
                  view === v
                    ? "bg-primary text-on-primary"
                    : "bg-canvas text-steel hover:bg-surface"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            ))}
          </div>
          <Button type="button" onClick={() => setEdit({ mode: "new" })}>
            + New task
          </Button>
        </div>
      </div>

      {allTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-xs">
          <span className="text-caption text-stone">Lọc:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setTagFilter(tagFilter === tag ? null : tag);
                setPage(1);
              }}
              className={`rounded-full px-sm py-xxs text-caption transition-colors ${
                tagFilter === tag
                  ? "bg-primary text-on-primary"
                  : "bg-surface text-steel hover:text-primary"
              }`}
            >
              {tag === RELEASE_TAG ? "released" : `#${tag}`}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-xxs text-caption text-steel">
            <input
              type="checkbox"
              checked={hideDone}
              onChange={(e) => {
                setHideDone(e.target.checked);
                setPage(1);
              }}
            />
            Ẩn done
          </label>
        </div>
      ) : null}

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
      ) : view === "list" ? (
        <div className="flex flex-col gap-xs">
          {pageItems.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDetail(t)}
              className="flex w-full items-center gap-sm rounded-md border border-hairline bg-canvas px-md py-sm text-left transition-colors hover:border-primary hover:bg-surface-soft"
            >
              <BacklogIcon className="h-5 w-5 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-xxs">
                <span className="truncate font-mono text-body-sm-medium text-ink">
                  {t.title}
                </span>
                {t.description.trim() ? (
                  <span className="truncate text-body-sm text-stone">
                    {t.description}
                  </span>
                ) : null}
              </div>
              {t.checklist.length > 0 ? (
                <span className="flex shrink-0 items-center gap-xxs text-caption text-stone">
                  <CheckIcon className="h-3 w-3" />
                  {checklistProgress(t.checklist).done}/{t.checklist.length}
                </span>
              ) : null}
              {t.tags.includes(RELEASE_TAG) ? (
                <TagChip tag={RELEASE_TAG} />
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          {pageItems.map((t) => (
            <div
              key={t.id}
              className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-canvas"
            >
              <div className="flex items-center justify-between gap-sm border-b border-hairline-soft bg-surface-soft px-md py-sm">
                <button
                  type="button"
                  onClick={() => setDetail(t)}
                  className="flex min-w-0 items-center gap-xs text-left"
                >
                  <BacklogIcon className="h-5 w-5 shrink-0" />
                  <span className="truncate font-mono text-body-sm-medium text-ink transition-colors hover:text-primary">
                    {t.title}
                  </span>
                </button>
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

              <div className="flex flex-col gap-sm p-md">
                <TaskBody task={t} procTitle={procTitle} docTitle={docTitle} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.title ?? ""}
      >
        {detail ? (
          <div className="flex flex-col gap-md">
            <TaskBody
              task={detail}
              procTitle={procTitle}
              docTitle={docTitle}
              showChecklist={false}
            />
            <TaskChecklistLive
              key={detail.id}
              taskId={detail.id}
              initial={detail.checklist}
              onSaved={() => router.refresh()}
            />
            <div className="flex flex-wrap justify-end gap-xs border-t border-hairline pt-sm">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setDetail(null)}
              >
                ← Quay lại
              </Button>
              {detail.prs.some((p) => p.pr.trim()) ? (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    for (const p of detail.prs.filter((x) => x.pr.trim())) {
                      window.open(prUrl(p.repo, p.pr), "_blank", "noopener");
                    }
                  }}
                >
                  Mở tất cả PR
                </Button>
              ) : null}
              <CopyButton
                text={taskSummary(detail, procTitle)}
                label="Copy tóm tắt"
              />
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  const t = detail;
                  setDetail(null);
                  setEdit({ mode: "edit", task: t });
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={edit?.mode === "edit" ? "Edit task" : "New task"}
      >
        {edit ? (
          <TaskForm
            procedures={procedures}
            docs={docs}
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
  backlogUrl: "",
  slackTaskUrl: "",
  slackReviewUrl: "",
  procedureId: null,
  docUrl: "",
  basicDesignUrl: "",
  prs: [],
  links: [],
  checklist: [],
  note: "",
  tags: [],
  docIds: [],
};

function TaskForm({
  procedures,
  docs,
  suggestions,
  initial,
  onDone,
  onCancel,
}: {
  procedures: ProcedureOption[];
  docs: DocOption[];
  suggestions: string[];
  initial?: Task;
  onDone: () => void;
  onCancel: () => void;
}) {
  const docTitle = new Map(docs.map((d) => [d.id, d.title]));
  const [form, setForm] = useState<TaskInput>(
    initial
      ? {
          title: initial.title,
          description: initial.description,
          backlogUrl: initial.backlogUrl,
          slackTaskUrl: initial.slackTaskUrl,
          slackReviewUrl: initial.slackReviewUrl,
          procedureId: initial.procedureId,
          docUrl: initial.docUrl,
          basicDesignUrl: initial.basicDesignUrl,
          prs: initial.prs,
          links: initial.links,
          checklist: initial.checklist,
          note: initial.note,
          tags: initial.tags,
          docIds: initial.docIds,
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
      <FormField
        label="Link Backlog"
        htmlFor="task-backlog"
        hint="Bỏ trống = tự suy ra từ tên task"
      >
        <Input
          id="task-backlog"
          value={form.backlogUrl}
          onChange={(e) => set("backlogUrl", e.target.value)}
          placeholder={defaultBacklogUrl(form.title.trim() || "AIRCLOSET-…")}
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
        <FormField label="Link Basic Design" htmlFor="task-bd">
          <Input
            id="task-bd"
            value={form.basicDesignUrl}
            onChange={(e) => set("basicDesignUrl", e.target.value)}
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

      <div className="flex flex-col gap-xs">
        <div className="flex items-center justify-between">
          <span className="text-body-sm-medium text-slate">Link khác</span>
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              set("links", [...form.links, { label: "", url: "" }])
            }
          >
            + Link
          </Button>
        </div>
        {form.links.map((l, i) => (
          <div key={i} className="flex gap-xs">
            <Input
              value={l.label}
              onChange={(e) =>
                set(
                  "links",
                  form.links.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  ),
                )
              }
              placeholder="Tên link"
              className="max-w-[12rem]"
            />
            <Input
              value={l.url}
              onChange={(e) =>
                set(
                  "links",
                  form.links.map((x, j) =>
                    j === i ? { ...x, url: e.target.value } : x,
                  ),
                )
              }
              placeholder="https://…"
            />
            <Button
              variant="ghost"
              type="button"
              onClick={() =>
                set(
                  "links",
                  form.links.filter((_, j) => j !== i),
                )
              }
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-xs">
        <div className="flex items-center justify-between">
          <span className="text-body-sm-medium text-slate">Checklist</span>
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              set("checklist", [
                ...form.checklist,
                { text: "", done: false, tested: false },
              ])
            }
          >
            + Việc
          </Button>
        </div>
        {form.checklist.map((c, i) => (
          <div key={i} className="flex items-center gap-xs">
            <Input
              value={c.text}
              onChange={(e) =>
                set(
                  "checklist",
                  form.checklist.map((x, j) =>
                    j === i ? { ...x, text: e.target.value } : x,
                  ),
                )
              }
              placeholder="Việc cần làm…"
            />
            <button
              type="button"
              title="Đã làm xong"
              aria-pressed={c.done}
              onClick={() =>
                set(
                  "checklist",
                  form.checklist.map((x, j) =>
                    j === i ? { ...x, done: !x.done } : x,
                  ),
                )
              }
              className={`h-11 shrink-0 rounded-md px-sm text-caption transition-colors ${
                c.done
                  ? "bg-primary text-on-primary"
                  : "border border-hairline text-stone hover:text-steel"
              }`}
            >
              Done
            </button>
            <button
              type="button"
              title="Đã test / verify"
              aria-pressed={c.tested}
              onClick={() =>
                set(
                  "checklist",
                  form.checklist.map((x, j) =>
                    j === i ? { ...x, tested: !x.tested } : x,
                  ),
                )
              }
              className={`h-11 shrink-0 rounded-md px-sm text-caption transition-colors ${
                c.tested
                  ? "bg-[#22a06b]/15 text-[#22a06b]"
                  : "border border-hairline text-stone hover:text-steel"
              }`}
            >
              Test
            </button>
            <Button
              variant="ghost"
              type="button"
              onClick={() =>
                set(
                  "checklist",
                  form.checklist.filter((_, j) => j !== i),
                )
              }
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-xs">
        <span className="text-body-sm-medium text-slate">Docs liên kết</span>
        <Select
          value=""
          onChange={(v) => {
            if (v) set("docIds", [...new Set([...form.docIds, Number(v)])]);
          }}
          options={[
            { value: "", label: "+ Thêm doc…" },
            ...docs
              .filter((d) => !form.docIds.includes(d.id))
              .map((d) => ({ value: String(d.id), label: d.title })),
          ]}
          placeholder="+ Thêm doc…"
        />
        {form.docIds.length > 0 ? (
          <div className="flex flex-wrap gap-xs">
            {form.docIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-xxs rounded-full bg-surface px-sm py-xxs text-caption text-slate"
              >
                {docTitle.get(id) ?? `Doc #${id}`}
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "docIds",
                      form.docIds.filter((x) => x !== id),
                    )
                  }
                  className="text-stone hover:text-ink"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : null}
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
              {t === RELEASE_TAG ? "released" : `#${t}`}
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

// Interactive checklist for the detail view: tick done / tested inline; each
// change persists optimistically so you can work through the list without
// opening the edit form.
function TaskChecklistLive({
  taskId,
  initial,
  onSaved,
}: {
  taskId: number;
  initial: TaskChecklistItem[];
  onSaved: () => void;
}) {
  const [items, setItems] = useState<TaskChecklistItem[]>(initial);
  const [, startTransition] = useTransition();

  if (items.length === 0) return null;
  const cp = checklistProgress(items);

  function toggle(i: number, key: "done" | "tested") {
    const next = items.map((c, j) => (j === i ? { ...c, [key]: !c[key] } : c));
    setItems(next);
    startTransition(async () => {
      await updateTaskChecklist(taskId, next);
      onSaved();
    });
  }

  return (
    <div className="flex flex-col gap-xs">
      <span className="text-caption text-stone">
        Checklist {cp.done}/{cp.total} xong · {cp.tested} đã test
      </span>
      {items.map((c, i) => (
        <div key={i} className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => toggle(i, "done")}
            aria-pressed={c.done}
            aria-label={c.done ? "Bỏ done" : "Đánh dấu done"}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
              c.done
                ? "border-primary bg-primary text-on-primary"
                : "border-hairline text-transparent hover:border-stone"
            }`}
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </button>
          <span
            className={`flex-1 text-body-sm ${
              c.done ? "text-stone line-through" : "text-slate"
            }`}
          >
            {c.text}
          </span>
          <button
            type="button"
            onClick={() => toggle(i, "tested")}
            aria-pressed={c.tested}
            title="Đã test / verify"
            className={`shrink-0 rounded-full px-sm py-xxs text-caption transition-colors ${
              c.tested
                ? "bg-[#22a06b]/15 text-[#22a06b]"
                : "border border-hairline text-stone hover:text-steel"
            }`}
          >
            đã test
          </button>
        </div>
      ))}
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
