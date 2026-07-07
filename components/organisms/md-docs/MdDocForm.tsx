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

export type MdDocFormInitial = {
  id: number;
  title: string;
  body: string;
  tags: string[];
};

export function MdDocForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: MdDocFormInitial;
  onDone: (id?: number) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [tagsText, setTagsText] = useState(initial?.tags.join(", ") ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
            placeholder="release, note, guide"
          />
        </FormField>
      </div>
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
