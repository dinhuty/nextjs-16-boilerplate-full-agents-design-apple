"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type {
  ProcedureBlock,
  ProcedureLanguage,
  ProcedureVariables,
} from "@/db/schema";
import { deleteProcedure } from "@/app/(app)/release-procedure/actions";
import {
  LANGUAGES,
  procedureToMarkdown,
  renderBlock,
} from "@/lib/release-procedure/markdown";
import { Button } from "@/components/atoms/Button";
import { CopyButton } from "@/components/atoms/CopyButton";
import { MarkdownPreview } from "@/components/organisms/release-procedure/MarkdownPreview";

type Props = {
  id: number;
  title: string;
  description: string;
  language: ProcedureLanguage;
  blocks: ProcedureBlock[];
  variables: ProcedureVariables;
};

const CHECK_RE = /^\s*[-*]\s+\[([ xX])\]/;

export function ProcedureView({
  id,
  title,
  description,
  language,
  blocks,
  variables,
}: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const [runMode, setRunMode] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  const markdown = useMemo(
    () => procedureToMarkdown(title, blocks, variables),
    [title, blocks, variables],
  );

  // Per-block rendered markdown + the checkbox lines inside each block.
  const blockData = useMemo(
    () =>
      blocks.map((b) => {
        const md = renderBlock(b, title, variables);
        const boxes: { line: number; checked: boolean }[] = [];
        md.split("\n").forEach((l, i) => {
          const m = l.match(CHECK_RE);
          if (m) boxes.push({ line: i + 1, checked: m[1].toLowerCase() === "x" });
        });
        return { block: b, md, boxes };
      }),
    [blocks, title, variables],
  );

  const totalBoxes = blockData.reduce((n, d) => n + d.boxes.length, 0);
  let doneBoxes = 0;
  blockData.forEach((d, i) =>
    d.boxes.forEach((bx) => {
      if (checks[`${i}:${bx.line}`] ?? bx.checked) doneBoxes++;
    }),
  );

  // Placeholders the procedure never resolved — warn before copying.
  const unresolved = useMemo(() => {
    const set = new Set<string>();
    if (/pull\/\?\?/.test(markdown)) set.add("PR chưa nhập (pull/??)");
    for (const m of markdown.matchAll(/\$\{([^}]+)\}/g)) set.add("${" + m[1] + "}");
    return [...set];
  }, [markdown]);

  const STORE_KEY = `procedure-run:${id}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setChecks(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [STORE_KEY]);
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(checks));
    } catch {
      // ignore
    }
  }, [STORE_KEY, checks]);

  const langLabel =
    LANGUAGES.find((l) => l.value === language)?.label ?? language;

  function remove() {
    if (!window.confirm("Delete this procedure?")) return;
    startTransition(async () => {
      await deleteProcedure(id);
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex flex-col gap-xxs">
          <h1 className="text-heading-3 text-ink">{title}</h1>
          <span className="text-caption text-stone">{langLabel}</span>
          {description.trim() ? (
            <p className="whitespace-pre-wrap text-body-sm text-slate">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-xs">
          {totalBoxes > 0 && !showRaw ? (
            <Button
              variant={runMode ? "primary" : "secondary"}
              type="button"
              onClick={() => setRunMode((r) => !r)}
            >
              {runMode ? "Đang chạy" : "Chạy checklist"}
            </Button>
          ) : null}
          <Button
            variant={showRaw ? "secondary" : "primary"}
            type="button"
            onClick={() => setShowRaw(false)}
          >
            Preview
          </Button>
          <Button
            variant={showRaw ? "primary" : "secondary"}
            type="button"
            onClick={() => setShowRaw(true)}
          >
            Raw
          </Button>
          <CopyButton text={markdown} />
          <Link href={`/release-procedure/${id}/edit`}>
            <Button variant="secondary" type="button">
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            type="button"
            onClick={remove}
            disabled={pending}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      {unresolved.length > 0 ? (
        <p className="rounded-md bg-brand-warn/10 px-md py-sm text-caption text-brand-warn">
          Còn chỗ chưa điền: {unresolved.join(", ")}
        </p>
      ) : null}

      {runMode && !showRaw && totalBoxes > 0 ? (
        <div className="flex items-center gap-sm">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(doneBoxes / totalBoxes) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-caption text-stone">
            {doneBoxes}/{totalBoxes} bước
          </span>
          <Button variant="ghost" type="button" onClick={() => setChecks({})}>
            Reset
          </Button>
        </div>
      ) : null}

      {showRaw ? (
        <div className="rounded-lg border border-hairline bg-canvas p-lg">
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-code-sm text-slate">
            {markdown}
          </pre>
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {blockData.map((d, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-canvas"
            >
              <div className="flex items-center justify-between gap-sm border-b border-hairline-soft bg-surface-soft px-md py-sm">
                <h2 className="text-heading-5 text-ink">{d.block.name}</h2>
                <CopyButton
                  text={`## ${d.block.name}\n\n${d.md}`}
                  label="Copy"
                />
              </div>
              <div className="p-md">
                <MarkdownPreview
                  markdown={d.md}
                  checks={
                    runMode
                      ? Object.fromEntries(
                          d.boxes.map((bx) => [
                            bx.line,
                            checks[`${i}:${bx.line}`] ?? bx.checked,
                          ]),
                        )
                      : undefined
                  }
                  onToggleCheck={
                    runMode
                      ? (line, checked) =>
                          setChecks((prev) => ({
                            ...prev,
                            [`${i}:${line}`]: checked,
                          }))
                      : undefined
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
