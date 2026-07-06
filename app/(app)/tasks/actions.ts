"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks, type TaskPr } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";

export type TaskInput = {
  title: string;
  description: string;
  backlogUrl: string;
  slackTaskUrl: string;
  slackReviewUrl: string;
  procedureId: number | null;
  docUrl: string;
  prs: TaskPr[];
  note: string;
  tags: string[];
};

export type TaskResult = { ok: true } | { ok: false; error: string };

function normalize(i: TaskInput): TaskInput {
  return {
    title: i.title.trim(),
    description: i.description,
    backlogUrl: i.backlogUrl.trim(),
    slackTaskUrl: i.slackTaskUrl.trim(),
    slackReviewUrl: i.slackReviewUrl.trim(),
    procedureId: i.procedureId,
    docUrl: i.docUrl.trim(),
    prs: i.prs
      .map((p) => ({
        repo: p.repo.trim(),
        branch: p.branch.trim(),
        pr: p.pr.trim(),
      }))
      .filter((p) => p.repo || p.branch || p.pr),
    note: i.note,
    // Normalize tags: lowercase + trim + dedupe so "release" is a stable marker.
    tags: [...new Set(i.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))],
  };
}

export async function createTask(input: TaskInput): Promise<TaskResult> {
  const user = await requireUser();
  const d = normalize(input);
  if (!d.title) return { ok: false, error: "Tên task là bắt buộc." };
  await db.insert(tasks).values({ ...d, userId: user.id });
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
  // Scope by userId so a user can only edit their own tasks.
  await db
    .update(tasks)
    .set({ ...d, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)));
  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteTask(id: number): Promise<TaskResult> {
  const user = await requireUser();
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id)));
  revalidatePath("/tasks");
  return { ok: true };
}
