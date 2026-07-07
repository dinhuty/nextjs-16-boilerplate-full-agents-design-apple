"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Modal } from "@/components/atoms/Modal";
import { Pagination } from "@/components/atoms/Pagination";
import { MdDocForm } from "@/components/organisms/md-docs/MdDocForm";
import { usePaged } from "@/lib/use-paged";

export type MdDocListRow = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: Date;
  updatedByName: string | null;
};

export function MdDocList({ docs }: { docs: MdDocListRow[] }) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const router = useRouter();

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
        <Button type="button" onClick={() => setNewOpen(true)}>
          + New doc
        </Button>
      </div>

      {allTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-xs">
          <span className="text-caption text-stone">Lọc:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setTagFilter(tagFilter === tag ? null : tag);
                setPage(1);
              }}
              className={`rounded-full px-sm py-xxs text-caption transition-colors ${
                tagFilter === tag
                  ? "bg-primary text-on-primary"
                  : "bg-surface text-steel hover:text-primary"
              }`}
            >
              #{tag}
            </button>
          ))}
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
                  <span className="truncate text-caption text-stone">
                    {d.tags.map((t) => `#${t}`).join(" ")}
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

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New doc" size="wide">
        {newOpen ? (
          <MdDocForm
            onDone={(id) => {
              setNewOpen(false);
              if (id) router.push(`/md-docs/${id}`);
              else router.refresh();
            }}
            onCancel={() => setNewOpen(false)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
