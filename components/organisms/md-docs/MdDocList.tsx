"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Modal } from "@/components/atoms/Modal";
import { Pagination } from "@/components/atoms/Pagination";
import {
  MdTagChip,
  MdTagManager,
  type MdTagDef,
} from "@/components/organisms/md-docs/MdTags";
import { usePaged } from "@/lib/use-paged";

export type MdDocListRow = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: Date;
  updatedByName: string | null;
};

export function MdDocList({
  docs,
  tags,
}: {
  docs: MdDocListRow[];
  tags: MdTagDef[];
}) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const colorOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tags) m.set(t.name, t.color);
    return m;
  }, [tags]);
  const tagColor = (n: string) => colorOf.get(n) ?? "#888888";

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const d of docs) for (const t of d.tags) s.add(t);
    return [...s].sort();
  }, [docs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (tagFilter && !d.tags.includes(tagFilter)) return false;
      if (!q) return true;
      return `${d.title} ${d.body} ${d.tags.join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [docs, query, tagFilter]);

  const { page, setPage, totalPages, total, pageItems } = usePaged(filtered, 15);

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm doc…"
          className="max-w-[24rem]"
        />
        <div className="flex gap-xs">
          <Button
            variant="secondary"
            type="button"
            onClick={() => setManageOpen(true)}
          >
            Quản lý tag
          </Button>
          <Link href="/md-docs/new">
            <Button type="button">+ New doc</Button>
          </Link>
        </div>
      </div>

      {allTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-xs">
          <span className="text-caption text-stone">Lọc:</span>
          {allTags.map((tag) => {
            const c = tagColor(tag);
            const active = tagFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setTagFilter(active ? null : tag);
                  setPage(1);
                }}
                className="rounded-full px-sm py-xxs text-caption font-medium transition-colors"
                style={
                  active
                    ? { backgroundColor: c, color: "#fff" }
                    : { backgroundColor: `${c}22`, color: c }
                }
              >
                #{tag}
              </button>
            );
          })}
        </div>
      ) : null}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPage={setPage}
      />

      {total === 0 ? (
        <p className="text-body-sm text-stone">
          {docs.length === 0 ? "Chưa có doc nào." : "Không có doc khớp."}
        </p>
      ) : (
        <div className="flex flex-col gap-xs">
          {pageItems.map((d) => (
            <Link
              key={d.id}
              href={`/md-docs/${d.id}`}
              className="flex items-center justify-between gap-sm rounded-lg border border-hairline bg-canvas p-md transition-colors hover:border-primary"
            >
              <div className="flex min-w-0 flex-col gap-xxs">
                <span className="truncate text-body-md-medium text-ink">
                  {d.title}
                </span>
                {d.tags.length > 0 ? (
                  <span className="flex flex-wrap gap-xxs">
                    {d.tags.map((t) => (
                      <MdTagChip key={t} name={t} color={tagColor(t)} />
                    ))}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 text-caption text-stone">
                {d.updatedByName ? `${d.updatedByName} · ` : ""}
                {d.updatedAt.toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Quản lý tag"
      >
        {manageOpen ? <MdTagManager tags={tags} /> : null}
      </Modal>
    </div>
  );
}
