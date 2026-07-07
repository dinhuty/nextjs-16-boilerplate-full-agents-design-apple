"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMdDoc } from "@/app/(app)/md-docs/actions";
import { Button } from "@/components/atoms/Button";
import { CopyButton } from "@/components/atoms/CopyButton";
import { Modal } from "@/components/atoms/Modal";
import { MarkdownPreview } from "@/components/organisms/release-procedure/MarkdownPreview";
import { MdDocForm } from "@/components/organisms/md-docs/MdDocForm";

export type MdDocViewData = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: Date;
  updatedByName: string | null;
};

export function MdDocView({ doc }: { doc: MdDocViewData }) {
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
        <div className="flex flex-col gap-xxs">
          <h1 className="text-heading-3 text-ink">{doc.title}</h1>
          <span className="text-caption text-stone">
            {doc.tags.map((t) => `#${t}`).join(" ")}
            {doc.updatedByName
              ? `${doc.tags.length ? " · " : ""}Sửa bởi ${doc.updatedByName} · ${doc.updatedAt.toLocaleDateString()}`
              : ""}
          </span>
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

      <div className="rounded-lg border border-hairline bg-canvas p-lg">
        {showRaw ? (
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-code-sm text-slate">
            {doc.body}
          </pre>
        ) : (
          <MarkdownPreview markdown={doc.body} />
        )}
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit doc"
        size="wide"
      >
        {editing ? (
          <MdDocForm
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
