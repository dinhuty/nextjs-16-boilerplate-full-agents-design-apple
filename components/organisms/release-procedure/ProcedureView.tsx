"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type {
  ProcedureBlock,
  ProcedureLanguage,
  ProcedureVariables,
} from "@/db/schema";
import { deleteProcedure } from "@/app/(app)/release-procedure/actions";
import { LANGUAGES, procedureToMarkdown } from "@/lib/release-procedure/markdown";
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

export function ProcedureView({
  id,
  title,
  description,
  language,
  blocks,
  variables,
}: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const [pending, startTransition] = useTransition();

  const markdown = useMemo(
    () => procedureToMarkdown(title, blocks, variables),
    [title, blocks, variables],
  );
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
      <div className="rounded-lg border border-hairline bg-canvas p-lg">
        {showRaw ? (
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-code-sm text-slate">
            {markdown}
          </pre>
        ) : (
          <MarkdownPreview markdown={markdown} />
        )}
      </div>
    </div>
  );
}
