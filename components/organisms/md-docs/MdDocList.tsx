"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Modal } from "@/components/atoms/Modal";
import { Pagination } from "@/components/atoms/Pagination";
import {
  MdTagChip,
  MdTagManager,
  type MdTagDef,
} from "@/components/organisms/md-docs/MdTags";
import { TagIcon, PlusIcon } from "@/components/atoms/icons";
import { usePaged } from "@/lib/use-paged";

export type MdDocListRow = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: Date;
  updatedByName: string | null;
};

type Sort = "created" | "updated" | "title";

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
  const [sort, setSort] = useState<Sort>("created");
  const [pinned, setPinned] = useState<number[]>([]);
  const [recent, setRecent] = useState<number[]>([]);

  useEffect(() => {
    try {
      const p = localStorage.getItem("md-docs:pinned");
      const r = localStorage.getItem("md-docs:recent");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (p) setPinned(JSON.parse(p));
      if (r) setRecent(JSON.parse(r));
    } catch {
      // ignore
    }
  }, []);

  function togglePin(id: number) {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      try {
        localStorage.setItem("md-docs:pinned", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

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

  const pinnedSet = new Set(pinned);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = docs.filter((d) => {
      if (tagFilter && !d.tags.includes(tagFilter)) return false;
      if (!q) return true;
      return `${d.title} ${d.body} ${d.tags.join(" ")}`.toLowerCase().includes(q);
    });
    const sorted = [...matched];
    if (sort === "updated") {
      sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } else if (sort === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    // Pinned bubble to the top (stable).
    sorted.sort(
      (a, b) => Number(pinnedSet.has(b.id)) - Number(pinnedSet.has(a.id)),
    );
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, query, tagFilter, sort, pinned]);

  const { page, setPage, totalPages, total, pageItems } = usePaged(filtered, 15);

  const recentDocs = recent
    .map((id) => docs.find((d) => d.id === id))
    .filter((d): d is MdDocListRow => Boolean(d))
    .slice(0, 6);

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
          className="max-w-[20rem]"
        />
        <div className="flex items-center gap-xs">
          <Select
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            options={[
              { value: "created", label: "Mới tạo" },
              { value: "updated", label: "Mới sửa" },
              { value: "title", label: "A–Z" },
            ]}
          />
          <Button
            variant="secondary"
            type="button"
            onClick={() => setManageOpen(true)}
            title="Quản lý tag"
            aria-label="Quản lý tag"
            className="w-11 px-0"
          >
            <TagIcon className="h-[18px] w-[18px]" />
          </Button>
          <Link href="/md-docs/new">
            <Button type="button" className="gap-xs whitespace-nowrap" title="Tạo doc mới">
              <PlusIcon className="h-[18px] w-[18px]" />
              New
            </Button>
          </Link>
        </div>
      </div>

      {recentDocs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-xs">
          <span className="text-caption text-stone">Gần đây:</span>
          {recentDocs.map((d) => (
            <Link
              key={d.id}
              href={`/md-docs/${d.id}`}
              className="max-w-[16rem] truncate rounded-md border border-hairline px-sm py-xxs text-caption text-slate transition-colors hover:border-primary hover:text-primary"
            >
              {d.title}
            </Link>
          ))}
        </div>
      ) : null}

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
            <div
              key={d.id}
              className="relative flex items-center justify-between gap-sm rounded-lg border border-hairline bg-canvas p-md transition-colors hover:border-primary"
            >
              <Link
                href={`/md-docs/${d.id}`}
                aria-label={d.title}
                className="absolute inset-0 rounded-lg"
              />
              <div className="pointer-events-none flex min-w-0 flex-col gap-xxs">
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
              <div className="relative flex shrink-0 items-center gap-sm">
                <span className="text-caption text-stone">
                  {d.updatedByName ? `${d.updatedByName} · ` : ""}
                  {d.updatedAt.toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => togglePin(d.id)}
                  title={pinnedSet.has(d.id) ? "Bỏ ghim" : "Ghim"}
                  aria-label={pinnedSet.has(d.id) ? "Bỏ ghim" : "Ghim"}
                  className={
                    pinnedSet.has(d.id)
                      ? "text-brand-warn"
                      : "text-stone hover:text-steel"
                  }
                >
                  {pinnedSet.has(d.id) ? "★" : "☆"}
                </button>
              </div>
            </div>
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
