"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createMdTag,
  updateMdTag,
  deleteMdTag,
} from "@/app/(app)/md-docs/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";

export type MdTagDef = { id: number; name: string; color: string };

// Colored tag chip — color comes from the tag config (default gray).
export function MdTagChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-sm py-xxs text-caption font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      #{name}
    </span>
  );
}

// Config UI (rendered inside a modal): add / recolor / delete tags.
export function MdTagManager({ tags }: { tags: MdTagDef[] }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#00b48a");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await createMdTag(newName, newColor);
      if (res.ok) {
        setNewName("");
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col gap-xs">
        {tags.length === 0 ? (
          <p className="text-body-sm text-stone">Chưa có tag nào.</p>
        ) : (
          tags.map((t) => <TagRow key={t.id} tag={t} />)
        )}
      </div>

      <div className="flex flex-col gap-xs border-t border-hairline pt-sm">
        <span className="text-body-sm-medium text-slate">Thêm tag</span>
        <div className="flex items-center gap-xs">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-hairline bg-canvas"
            title="Màu tag"
          />
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="tên tag (vd: seed)"
          />
          <Button type="button" onClick={add} disabled={pending || !newName.trim()}>
            Thêm
          </Button>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    </div>
  );
}

function TagRow({ tag }: { tag: MdTagDef }) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dirty = name !== tag.name || color !== tag.color;

  return (
    <div className="flex items-center gap-xs">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-hairline bg-canvas"
        title="Màu"
      />
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Button
        variant="secondary"
        type="button"
        disabled={pending || !dirty}
        onClick={() =>
          startTransition(async () => {
            await updateMdTag(tag.id, name, color);
            router.refresh();
          })
        }
      >
        Lưu
      </Button>
      <Button
        variant="ghost"
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Xoá tag #${tag.name}?`)) return;
          startTransition(async () => {
            await deleteMdTag(tag.id);
            router.refresh();
          });
        }}
      >
        ✕
      </Button>
    </div>
  );
}
