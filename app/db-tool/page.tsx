import { redirect } from "next/navigation";
import { DbToolWorkbench } from "@/components/organisms/DbToolWorkbench";
import { DB_TOOL_KEY } from "@/lib/db-tool/env";
import { createClient } from "@/utils/supabase/server";
import type { Snippet } from "@/lib/db-tool/types";

export default async function DbToolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [snippetsRes, envRes] = await Promise.all([
    supabase
      .from("sql_snippets")
      .select("id, tab, title, body")
      .order("tab")
      .order("title"),
    supabase
      .from("tool_env")
      .select("content")
      .eq("user_id", user.id)
      .eq("tool_key", DB_TOOL_KEY)
      .maybeSingle(),
  ]);

  return (
    <DbToolWorkbench
      snippets={(snippetsRes.data ?? []) as Snippet[]}
      env={envRes.data?.content ?? ""}
    />
  );
}
