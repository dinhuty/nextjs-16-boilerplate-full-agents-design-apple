"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/dal";

export async function approveUser(id: number): Promise<void> {
  await requireAdmin();
  await db.update(users).set({ approved: true }).where(eq(users.id, id));
  revalidatePath("/admin");
}

export async function rejectUser(id: number): Promise<void> {
  await requireAdmin();
  // Reject = remove the pending account entirely.
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin");
}
