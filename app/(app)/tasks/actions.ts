"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  tasks,
  taskDocs,
  type TaskPr,
  type TaskLink,
  type TaskChecklistItem,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";

export type TaskInput = {
  title: string;
  description: string;
  backlogUrl: string;
  slackTaskUrl: string;
  slackReviewUrl: string;
  procedureId: number | null;
  docUrl: string;
  basicDesignUrl: string;
  prs: TaskPr[];
  links: TaskLink[];
  checklist: TaskChecklistItem[];
  note: string;
  tags: string[];
  docIds: number[];
};

export type TaskResult = { ok: true } | { ok: false; error: string };

// Drop blank rows, trim text, coerce the flags to real booleans.
function cleanChecklist(items: TaskChecklistItem[]): TaskChecklistItem[] {
  return items
    .map((c) => ({ text: c.text.trim(), done: !!c.done, tested: !!c.tested }))
    .filter((c) => c.text);
}

function normalize(i: TaskInput): TaskInput {
  return {
    title: i.title.trim(),
    description: i.description,
    backlogUrl: i.backlogUrl.trim(),
    slackTaskUrl: i.slackTaskUrl.trim(),
    slackReviewUrl: i.slackReviewUrl.trim(),
    procedureId: i.procedureId,
    docUrl: i.docUrl.trim(),
    basicDesignUrl: i.basicDesignUrl.trim(),
    prs: i.prs
      .map((p) => ({
        repo: p.repo.trim(),
        branch: p.branch.trim(),
        pr: p.pr.trim(),
      }))
      .filter((p) => p.repo || p.branch || p.pr),
    links: i.links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label || l.url),
    checklist: cleanChecklist(i.checklist),
    note: i.note,
    // Normalize tags: lowercase + trim + dedupe so "release" is a stable marker.
    tags: [...new Set(i.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))],
    docIds: [...new Set(i.docIds.filter((n) => Number.isInteger(n)))],
  };
}

// Replace a task's linked md docs (many-to-many via task_docs).
async function syncDocs(taskId: number, docIds: number[]) {
  await db.delete(taskDocs).where(eq(taskDocs.taskId, taskId));
  if (docIds.length) {
    await db.insert(taskDocs).values(docIds.map((docId) => ({ taskId, docId })));
  }
}

export async function createTask(input: TaskInput): Promise<TaskResult> {
  const user = await requireUser();
  const d = normalize(input);
  if (!d.title) return { ok: false, error: "Tên task là bắt buộc." };
  const { docIds, ...taskData } = d;
  const [row] = await db
    .insert(tasks)
    .values({ ...taskData, userId: user.id })
    .returning({ id: tasks.id });
  await syncDocs(row.id, docIds);
  revalidatePath("/tasks");
  return { ok: true };
}

export async function updateTask(
  id: number,
  input: TaskInput,
): Promise<TaskResult> {
  const user = await requireUser();
  const d = normalize(input);
  if (!d.title) return { ok: false, error: "Tên task là bắt buộc." };
  const { docIds, ...taskData } = d;
  // Scope by userId so a user can only edit their own tasks.
  const updated = await db
    .update(tasks)
    .set({ ...taskData, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning({ id: tasks.id });
  if (!updated[0]) return { ok: false, error: "Không tìm thấy task." };
  await syncDocs(id, docIds);
  revalidatePath("/tasks");
  return { ok: true };
}

// Persist just the checklist (inline ticking from the detail view). Scoped by
// userId so a user can only touch their own task.
export async function updateTaskChecklist(
  id: number,
  checklist: TaskChecklistItem[],
): Promise<TaskResult> {
  const user = await requireUser();
  const updated = await db
    .update(tasks)
    .set({ checklist: cleanChecklist(checklist), updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning({ id: tasks.id });
  if (!updated[0]) return { ok: false, error: "Không tìm thấy task." };
  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteTask(id: number): Promise<TaskResult> {
  const user = await requireUser();
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id)));
  revalidatePath("/tasks");
  return { ok: true };
}
