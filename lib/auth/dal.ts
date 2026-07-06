import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth/session";

// The single hardcoded admin — the only account that can approve sign-ups.
export const ADMIN_USERNAME = "dinhuty";
export function isAdmin(username: string): boolean {
  return username === ADMIN_USERNAME;
}

export type SessionUser = { id: number; username: string; isAdmin: boolean };

// The real (DB-backed) auth check. `cache` memoizes it for one render pass so
// multiple callers (layout, page, actions) share a single query.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  return { id: row.id, username: row.username, isAdmin: isAdmin(row.username) };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Admin-only pages call this; non-admins are bounced to the home page.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}
