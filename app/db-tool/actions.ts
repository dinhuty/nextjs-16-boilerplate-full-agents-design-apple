"use server";

import { revalidatePath } from "next/cache";
import { tServer } from "@/lib/i18n/server";
import { createClient } from "@/utils/supabase/server";
import { runSql, testConnection } from "@/lib/db-tool/mysql";
import { envToConfig, hasConnection } from "@/lib/db-tool/connection";
import { DB_TOOL_KEY } from "@/lib/db-tool/env";
import type { ExecuteResponse } from "@/lib/db-tool/types";

// --- SQL execution ---------------------------------------------------------

export type ExecuteResult = ExecuteResponse | { error: string };

export async function executeSql(statement: string): Promise<ExecuteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await tServer("dbtool.error_unauthenticated") };

  if (!statement.trim()) {
    return { error: await tServer("dbtool.error_empty_statement") };
  }

  const { data } = await supabase
    .from("tool_env")
    .select("content")
    .eq("user_id", user.id)
    .eq("tool_key", DB_TOOL_KEY)
    .maybeSingle();

  const content = data?.content ?? "";
  if (!hasConnection(content)) {
    return { error: await tServer("dbtool.error_no_connection") };
  }

  try {
    return await runSql(envToConfig(content), statement);
  } catch (err) {
    return { error: (err as Error).message };
  }
}

// --- Env (per-tool text blob) ----------------------------------------------

export type SaveEnvResult = { error?: string };
export type TestEnvResult = {
  error?: string;
  server_version?: string;
  latency_ms?: number;
};

export async function saveEnv(content: string): Promise<SaveEnvResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await tServer("dbtool.error_unauthenticated") };

  const { error } = await supabase.from("tool_env").upsert({
    user_id: user.id,
    tool_key: DB_TOOL_KEY,
    content,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath("/db-tool");
  return {};
}

export async function testEnv(content: string): Promise<TestEnvResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await tServer("dbtool.error_unauthenticated") };

  if (!hasConnection(content)) {
    return { error: await tServer("dbtool.error_no_connection") };
  }
  try {
    return await testConnection(envToConfig(content));
  } catch (err) {
    return { error: (err as Error).message };
  }
}

// --- Snippet master data CRUD ----------------------------------------------

export type SnippetMutationResult = { error?: string };

interface SnippetInput {
  tab: string;
  title: string;
  body: string;
}

function clean(input: SnippetInput): SnippetInput {
  return {
    tab: input.tab.trim(),
    title: input.title.trim(),
    body: input.body.trim(),
  };
}

export async function createSnippet(
  input: SnippetInput,
): Promise<SnippetMutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await tServer("dbtool.error_unauthenticated") };

  const s = clean(input);
  if (!s.tab || !s.title || !s.body) {
    return { error: await tServer("dbtool.error_snippet_required") };
  }

  const { error } = await supabase.from("sql_snippets").insert({
    tab: s.tab,
    title: s.title,
    body: s.body,
    created_by: user.id,
    updated_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/db-tool");
  return {};
}

export async function updateSnippet(
  id: string,
  input: SnippetInput,
): Promise<SnippetMutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await tServer("dbtool.error_unauthenticated") };

  const s = clean(input);
  if (!s.tab || !s.title || !s.body) {
    return { error: await tServer("dbtool.error_snippet_required") };
  }

  const { error } = await supabase
    .from("sql_snippets")
    .update({
      tab: s.tab,
      title: s.title,
      body: s.body,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/db-tool");
  return {};
}

export async function deleteSnippet(
  id: string,
): Promise<SnippetMutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await tServer("dbtool.error_unauthenticated") };

  const { error } = await supabase.from("sql_snippets").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/db-tool");
  return {};
}
