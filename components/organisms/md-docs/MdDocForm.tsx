"use client";

import { useState, useTransition } from "react";
import {
  createMdDoc,
  updateMdDoc,
  type MdDocInput,
} from "@/app/(app)/md-docs/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { TextArea } from "@/components/atoms/TextArea";
import { FormField } from "@/components/molecules/FormField";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import type { MdTagDef } from "@/components/organisms/md-docs/MdTags";

export type MdDocFormInitial = {
  id: number;
  title: string;
  body: string;
  tags: string[];
};

export function MdDocForm({
  initial,
  tags = [],
  onDone,
  onCancel,
}: {
  initial?: MdDocFormInitial;
  tags?: MdTagDef[];
  onDone: (id?: number) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [tagsText, setTagsText] = useState(initial?.tags.join(", ") ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addTag(name: string) {
    const cur = tagsText
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (cur.includes(name)) return;
    setTagsText([...cur, name].join(", "));
  }

  function submit() {
    setError(null);
    const input: MdDocInput = { title, body, tags: tagsText.split(",") };
    startTransition(async () => {
      const res = initial
        ? await updateMdDoc(initial.id, input)
        : await createMdDoc(input);
      if (res.ok) onDone(res.id);
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <FormField label="Tiêu đề" htmlFor="md-title">
          <Input
            id="md-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tên document…"
          />
        </FormField>
        <FormField label="Tags" htmlFor="md-tags" hint="Cách nhau bởi dấu phẩy">
          <Input
            id="md-tags"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="seed, running, debug"
          />
        </FormField>
      </div>
      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-xs">
          <span className="text-caption text-stone">Tag có sẵn:</span>
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addTag(t.name)}
              className="rounded-full px-sm py-xxs text-caption font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: `${t.color}22`, color: t.color }}
            >
              + #{t.name}
            </button>
          ))}
        </div>
      ) : null}
      <FormField label="Nội dung (Markdown)" htmlFor="md-body">
        <TextArea
          id="md-body"
          mono
          rows={18}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={"# Tiêu đề\n\nNội dung markdown…"}
        />
      </FormField>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="flex justify-end gap-xs">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
