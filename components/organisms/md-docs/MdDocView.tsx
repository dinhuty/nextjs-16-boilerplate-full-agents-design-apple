"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMdDoc } from "@/app/(app)/md-docs/actions";
import { extractHeadings } from "@/components/organisms/md-docs/toc";
import { Button } from "@/components/atoms/Button";
import { CopyButton } from "@/components/atoms/CopyButton";
import { Modal } from "@/components/atoms/Modal";
import Link from "next/link";
import { MarkdownPreview } from "@/components/organisms/release-procedure/MarkdownPreview";
import { MdDocForm } from "@/components/organisms/md-docs/MdDocForm";
import { MdTagChip, type MdTagDef } from "@/components/organisms/md-docs/MdTags";

export type MdDocViewData = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: Date;
  updatedByName: string | null;
};

export function MdDocView({
  doc,
  tags,
  linkedTasks,
}: {
  doc: MdDocViewData;
  tags: MdTagDef[];
  linkedTasks: { id: number; title: string }[];
}) {
  const colorOf = new Map(tags.map((t) => [t.name, t.color]));
  const headings = useMemo(() => extractHeadings(doc.body), [doc.body]);
  const [showRaw, setShowRaw] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function remove() {
    if (!window.confirm("Xoá doc này?")) return;
    startTransition(async () => {
      await deleteMdDoc(doc.id);
      router.push("/md-docs");
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div className="flex flex-col gap-xs">
          <h1 className="text-heading-3 text-ink">{doc.title}</h1>
          <div className="flex flex-wrap items-center gap-xs">
            {doc.tags.map((t) => (
              <MdTagChip key={t} name={t} color={colorOf.get(t) ?? "#888888"} />
            ))}
            {doc.updatedByName ? (
              <span className="text-caption text-stone">
                Sửa bởi {doc.updatedByName} · {doc.updatedAt.toLocaleDateString()}
              </span>
            ) : null}
          </div>
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
          <CopyButton text={doc.body} label="Copy markdown" />
          <Button variant="secondary" type="button" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" type="button" onClick={remove} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-md lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 rounded-lg border border-hairline bg-canvas p-lg">
          {showRaw ? (
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-code-sm text-slate">
              {doc.body}
            </pre>
          ) : (
            <MarkdownPreview markdown={doc.body} breaks />
          )}
        </div>
        {!showRaw && headings.length >= 2 ? (
          <nav className="w-full shrink-0 rounded-lg border border-hairline bg-canvas p-md lg:sticky lg:top-20 lg:w-60">
            <span className="text-caption font-medium text-stone">Mục lục</span>
            <div className="mt-xs flex max-h-[70vh] flex-col gap-xxs overflow-auto">
              {headings.map((h, i) => (
                <a
                  key={i}
                  href={`#${h.slug}`}
                  className="truncate text-body-sm text-slate transition-colors hover:text-primary"
                  style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                >
                  {h.text}
                </a>
              ))}
            </div>
          </nav>
        ) : null}
      </div>

      {linkedTasks.length > 0 ? (
        <div className="flex flex-col gap-xs rounded-lg border border-hairline bg-canvas p-md">
          <span className="text-body-sm-medium text-slate">
            Task liên kết ({linkedTasks.length})
          </span>
          <div className="flex flex-wrap gap-xs">
            {linkedTasks.map((t) => (
              <Link
                key={t.id}
                href={`/tasks?task=${t.id}`}
                className="rounded-md border border-hairline px-sm py-xxs font-mono text-body-sm text-slate transition-colors hover:border-primary hover:text-primary"
              >
                {t.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit doc"
        size="wide"
      >
        {editing ? (
          <MdDocForm
            tags={tags}
            initial={{
              id: doc.id,
              title: doc.title,
              body: doc.body,
              tags: doc.tags,
            }}
            onDone={() => {
              setEditing(false);
              router.refresh();
            }}
            onCancel={() => setEditing(false)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
