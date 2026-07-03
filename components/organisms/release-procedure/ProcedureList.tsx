"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProcedureLanguage } from "@/db/schema";
import { deleteProcedure } from "@/app/(app)/release-procedure/actions";
import { LANGUAGES } from "@/lib/release-procedure/markdown";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Pagination } from "@/components/atoms/Pagination";
import { usePaged } from "@/lib/use-paged";

export type ProcedureRow = {
  id: number;
  title: string;
  language: ProcedureLanguage;
  updatedAt: Date;
};

export function ProcedureList({ procedures }: { procedures: ProcedureRow[] }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return procedures;
    return procedures.filter((p) => p.title.toLowerCase().includes(q));
  }, [procedures, query]);

  const { page, setPage, totalPages, total, pageItems } = usePaged(filtered, 10);

  return (
    <div className="flex flex-col gap-md">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        placeholder="Tìm procedure…"
        className="max-w-[24rem]"
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPage={setPage}
      />

      {total === 0 ? (
        <p className="text-body-sm text-stone">
          {procedures.length === 0
            ? "No saved procedures yet. Create one from your templates."
            : "Không có procedure khớp."}
        </p>
      ) : (
        <div className="flex flex-col gap-xs">
          {pageItems.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-sm rounded-lg border border-hairline bg-canvas p-md transition-colors hover:border-primary"
            >
              <Link
                href={`/release-procedure/${p.id}`}
                className="flex flex-1 items-center justify-between gap-sm"
              >
                <span className="text-body-md-medium text-ink">{p.title}</span>
                <span className="flex items-center gap-sm text-caption text-stone">
                  <span>
                    {LANGUAGES.find((l) => l.value === p.language)?.label ??
                      p.language}
                  </span>
                  <span>{p.updatedAt.toLocaleDateString()}</span>
                </span>
              </Link>
              <div className="flex shrink-0 gap-xs">
                <Link href={`/release-procedure/${p.id}/edit`}>
                  <Button variant="secondary" type="button">
                    Edit
                  </Button>
                </Link>
                <DeleteProcedureButton
                  id={p.id}
                  onDone={() => router.refresh()}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteProcedureButton({
  id,
  onDone,
}: {
  id: number;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="danger"
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this procedure?")) return;
        startTransition(async () => {
          await deleteProcedure(id);
          onDone();
        });
      }}
    >
      {pending ? "…" : "Delete"}
    </Button>
  );
}
