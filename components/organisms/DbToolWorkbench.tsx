"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { Modal } from "@/components/molecules/Modal";
import { Textarea } from "@/components/atoms/Textarea";
import {
  executeSql,
  saveEnv,
  testEnv,
  createSnippet,
  updateSnippet,
  deleteSnippet,
  type ExecuteResult,
} from "@/app/db-tool/actions";
import { DEFAULT_ENV_TEMPLATE } from "@/lib/db-tool/env";
import { useT } from "@/lib/i18n/client";
import type { ExecuteStatementResult, Snippet } from "@/lib/db-tool/types";

type SnippetModalState = { mode: "new" } | { mode: "edit"; snippet: Snippet };

export function DbToolWorkbench({
  snippets,
  env,
}: {
  snippets: Snippet[];
  env: string;
}) {
  const { t } = useT();
  const router = useRouter();

  const [sql, setSql] = useState("");
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [running, startRun] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [envOpen, setEnvOpen] = useState(false);
  const [snippetModal, setSnippetModal] = useState<SnippetModalState | null>(
    null,
  );

  const grouped = useMemo(() => groupByTab(snippets), [snippets]);
  const selected = snippets.find((s) => s.id === selectedId) ?? null;

  const run = () => startRun(async () => setResult(await executeSql(sql)));

  const pickSnippet = (s: Snippet) => {
    setSelectedId(s.id);
    setSql(s.body);
  };

  const removeSelected = () => {
    if (!selected) return;
    if (!confirm(t("dbtool.confirm_delete"))) return;
    startRun(async () => {
      const res = await deleteSnippet(selected.id);
      if (!res.error) {
        setSelectedId(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="h-screen flex flex-col bg-canvas-dark text-body-on-dark">
      <header className="flex items-center justify-between gap-md px-lg py-md border-b border-hairline-on-dark shrink-0">
        <div className="flex items-center gap-sm">
          <span className="text-body-strong">
            <span className="text-primary">DB</span>
            <span className="text-on-dark"> Tool</span>
          </span>
        </div>
        <div className="flex items-center gap-md">
          <Button type="button" variant="soft" onClick={() => setEnvOpen(true)}>
            {t("dbtool.env")}
          </Button>
          <Link
            href="/"
            className="text-button-utility text-muted hover:text-on-dark"
          >
            {t("dbtool.back_home")}
          </Link>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar: snippet master data */}
        <aside className="w-[260px] shrink-0 border-r border-hairline-on-dark bg-surface-card-dark overflow-y-auto p-md flex flex-col gap-md">
          <Button
            type="button"
            variant="soft"
            className="w-full"
            onClick={() => setSnippetModal({ mode: "new" })}
          >
            + {t("dbtool.new_snippet")}
          </Button>

          {snippets.length === 0 ? (
            <p className="text-caption text-muted">{t("dbtool.no_snippets")}</p>
          ) : (
            grouped.map(([tab, items]) => (
              <div key={tab} className="flex flex-col gap-xxs">
                <p className="text-fine-print font-semibold text-muted uppercase tracking-wide px-sm">
                  {tab}
                </p>
                {items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickSnippet(s)}
                    className={`text-left text-caption rounded-md px-sm py-xs transition-colors ${
                      s.id === selectedId
                        ? "bg-primary/15 text-primary"
                        : "text-body-on-dark hover:bg-surface-elevated-dark"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            ))
          )}
        </aside>

        {/* Main: editor + results */}
        <main className="flex-1 flex flex-col min-h-0 p-md gap-sm">
          <div className="flex items-center justify-between gap-md">
            <div className="flex items-center gap-sm min-w-0">
              <Button
                type="button"
                variant="primary-rect"
                onClick={run}
                disabled={running}
              >
                {running ? t("dbtool.running") : `▶ ${t("dbtool.run")}`}
              </Button>
              {selected && (
                <>
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() =>
                      setSnippetModal({ mode: "edit", snippet: selected })
                    }
                  >
                    {t("dbtool.edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="soft"
                    onClick={removeSelected}
                    disabled={running}
                  >
                    {t("dbtool.delete")}
                  </Button>
                </>
              )}
            </div>
            <span className="text-fine-print text-muted">{sql.length} chars</span>
          </div>

          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder={t("dbtool.sql_placeholder")}
            className="h-[38%] shrink-0"
          />

          <div className="flex-1 min-h-0 overflow-auto border border-hairline-on-dark rounded-xl bg-surface-card-dark p-md">
            {result === null ? (
              <p className="text-body text-muted">{t("dbtool.no_results")}</p>
            ) : "error" in result ? (
              <ErrorMessage>{result.error}</ErrorMessage>
            ) : (
              <div className="flex flex-col gap-md">
                {result.results.map((r, i) => (
                  <ResultBlock key={i} result={r} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {envOpen && (
        <EnvModal
          initial={env}
          onClose={() => setEnvOpen(false)}
          onSaved={() => {
            setEnvOpen(false);
            router.refresh();
          }}
        />
      )}

      {snippetModal && (
        <SnippetModal
          state={snippetModal}
          onClose={() => setSnippetModal(null)}
          onSaved={() => {
            setSnippetModal(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function ResultBlock({ result }: { result: ExecuteStatementResult }) {
  const { t } = useT();

  if (result.kind === "error") {
    return <ErrorMessage>{result.error}</ErrorMessage>;
  }
  if (result.kind === "write") {
    return (
      <p className="text-caption text-trading-up">
        {result.affected_rows} {t("dbtool.rows_affected")} ·{" "}
        {result.duration_ms} {t("dbtool.duration_ms")}
      </p>
    );
  }
  if (result.rows.length === 0) {
    return (
      <p className="text-caption text-muted">
        0 rows · {result.duration_ms} {t("dbtool.duration_ms")}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto border border-hairline-on-dark rounded-lg">
      <table className="w-full text-caption text-body-on-dark border-collapse">
        <thead>
          <tr className="bg-surface-elevated-dark">
            {result.columns.map((c) => (
              <th
                key={c}
                className="text-left font-mono text-fine-print text-muted px-sm py-xs border-b border-hairline-on-dark whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-hairline-on-dark">
              {result.columns.map((c) => (
                <td
                  key={c}
                  className="px-sm py-xs font-mono whitespace-nowrap align-top"
                >
                  {formatCell(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnvModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [content, setContent] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      setError(null);
      setStatus(null);
      const res = await saveEnv(content);
      if (res.error) setError(res.error);
      else onSaved();
    });

  const test = () =>
    start(async () => {
      setError(null);
      setStatus(null);
      const res = await testEnv(content);
      if (res.error) setError(res.error);
      else
        setStatus(
          `${t("dbtool.test_ok")}: MySQL ${res.server_version} · ${res.latency_ms} ${t("dbtool.duration_ms")}`,
        );
    });

  return (
    <Modal title={t("dbtool.settings_title")} onClose={onClose}>
      <div className="flex flex-col gap-md">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={DEFAULT_ENV_TEMPLATE}
          rows={10}
        />
        <div className="flex items-center gap-sm">
          <Button
            type="button"
            variant="primary-rect"
            onClick={save}
            disabled={pending}
          >
            {pending ? t("dbtool.saving") : t("dbtool.save")}
          </Button>
          <Button type="button" variant="soft" onClick={test} disabled={pending}>
            {pending ? t("dbtool.testing") : t("dbtool.test")}
          </Button>
        </div>
        {status && <p className="text-caption text-trading-up">{status}</p>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>
    </Modal>
  );
}

function SnippetModal({
  state,
  onClose,
  onSaved,
}: {
  state: SnippetModalState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const base = state.mode === "edit" ? state.snippet : null;
  const [tab, setTab] = useState(base?.tab ?? "");
  const [title, setTitle] = useState(base?.title ?? "");
  const [body, setBody] = useState(base?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      setError(null);
      const input = { tab, title, body };
      const res =
        state.mode === "edit"
          ? await updateSnippet(state.snippet.id, input)
          : await createSnippet(input);
      if (res.error) setError(res.error);
      else onSaved();
    });

  return (
    <Modal
      title={state.mode === "edit" ? t("dbtool.edit") : t("dbtool.new_snippet")}
      onClose={onClose}
    >
      <div className="flex flex-col gap-md">
        <DarkField label={t("dbtool.tab")} value={tab} onChange={setTab} />
        <DarkField
          label={t("dbtool.snippet_title")}
          value={title}
          onChange={setTitle}
        />
        <div>
          <label className="block text-caption-strong text-on-dark mb-2">
            {t("dbtool.snippet_body")}
          </label>
          <Textarea
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="flex gap-sm">
          <Button
            type="button"
            variant="primary-rect"
            onClick={submit}
            disabled={pending}
          >
            {pending ? t("dbtool.saving") : t("dbtool.save")}
          </Button>
          <Button type="button" variant="soft" onClick={onClose}>
            {t("dbtool.cancel")}
          </Button>
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>
    </Modal>
  );
}

function DarkField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-caption-strong text-on-dark mb-2">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 bg-canvas-dark text-on-dark text-caption border border-hairline-on-dark rounded-lg px-md outline-none transition-colors focus:border-primary placeholder:text-muted"
      />
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function groupByTab(snippets: Snippet[]): [string, Snippet[]][] {
  const map = new Map<string, Snippet[]>();
  for (const s of snippets) {
    const list = map.get(s.tab) ?? [];
    list.push(s);
    map.set(s.tab, list);
  }
  return Array.from(map.entries());
}
