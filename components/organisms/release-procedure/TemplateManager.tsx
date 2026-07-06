"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type TemplateInput,
} from "@/app/(app)/release-procedure/templates/actions";
import type { TemplateLite } from "@/components/organisms/release-procedure/ProcedureBuilder";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { TextArea } from "@/components/atoms/TextArea";
import { Combobox } from "@/components/atoms/Combobox";
import { Modal } from "@/components/atoms/Modal";
import { Pagination } from "@/components/atoms/Pagination";
import { FormField } from "@/components/molecules/FormField";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { KNOWN_REPOS, KNOWN_CATEGORIES } from "@/lib/release-procedure/constants";
import { usePaged } from "@/lib/use-paged";

// Row = template body + audit info (who last edited it, and when).
export type TemplateRow = TemplateLite & {
  updatedAt: Date;
  updatedByName: string | null;
};

type EditState = { mode: "new" } | { mode: "edit"; template: TemplateRow } | null;

const EMPTY: TemplateInput = {
  category: "",
  name: "",
  repo: "",
  bodyJa: "",
  bodyEn: "",
  bodyVi: "",
};

export function TemplateManager({ templates }: { templates: TemplateRow[] }) {
  const [edit, setEdit] = useState<EditState>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) =>
      `${t.name} ${t.category} ${t.repo}`.toLowerCase().includes(q),
    );
  }, [templates, query]);

  const { page, setPage, totalPages, total, pageItems } = usePaged(filtered, 10);

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 className="text-heading-4 text-ink">Templates (master data)</h2>
        <Button type="button" onClick={() => setEdit({ mode: "new" })}>
          + New template
        </Button>
      </div>

      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        placeholder="Tìm template…"
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
          {templates.length === 0
            ? "No templates yet. Create one to build procedures from."
            : "Không có template khớp."}
        </p>
      ) : (
        <div className="flex flex-col gap-xs">
          {pageItems.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-sm rounded-lg border border-hairline bg-canvas p-md"
            >
              <div className="flex min-w-0 flex-col gap-xxs">
                <div className="flex flex-wrap items-center gap-xs">
                  <span className="text-body-md-medium text-ink">{t.name}</span>
                  {t.category ? (
                    <span className="rounded-full bg-primary/10 px-xs py-xxs text-micro text-primary">
                      {t.category}
                    </span>
                  ) : null}
                  {t.repo ? (
                    <span className="rounded-full bg-surface px-xs py-xxs text-micro text-steel">
                      {t.repo}
                    </span>
                  ) : null}
                </div>
                {t.updatedByName ? (
                  <span className="text-caption text-stone">
                    Sửa bởi {t.updatedByName} · {t.updatedAt.toLocaleDateString()}
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-xs">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setEdit({ mode: "edit", template: t })}
                >
                  Edit
                </Button>
                <DeleteTemplateButton
                  id={t.id}
                  onDone={() => router.refresh()}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={edit?.mode === "edit" ? "Edit template" : "New template"}
        size="wide"
      >
        {edit ? (
          <TemplateForm
            key={edit.mode === "edit" ? edit.template.id : "new"}
            initial={edit.mode === "edit" ? edit.template : undefined}
            onDone={() => {
              setEdit(null);
              router.refresh();
            }}
            onCancel={() => setEdit(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function TemplateForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: TemplateLite;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TemplateInput>(
    initial
      ? {
          category: initial.category,
          name: initial.name,
          repo: initial.repo,
          bodyJa: initial.bodyJa,
          bodyEn: initial.bodyEn,
          bodyVi: initial.bodyVi,
        }
      : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof TemplateInput>(key: K, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = initial
        ? await updateTemplate(initial.id, form)
        : await createTemplate(form);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        <FormField label="Category" htmlFor="tpl-category">
          <Combobox
            id="tpl-category"
            value={form.category}
            onChange={(v) => set("category", v)}
            options={KNOWN_CATEGORIES}
            placeholder="Common"
          />
        </FormField>
        <FormField label="Name" htmlFor="tpl-name">
          <Input
            id="tpl-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Release acm-api"
          />
        </FormField>
        <FormField
          label="Repo"
          htmlFor="tpl-repo"
          hint="Bật ${repo}/${pr}/${pr_url}"
        >
          <Combobox
            id="tpl-repo"
            value={form.repo}
            onChange={(v) => set("repo", v)}
            options={KNOWN_REPOS}
            placeholder="acm-api"
          />
        </FormField>
      </div>
      <p className="text-caption text-stone">
        Body is markdown. Placeholders:{" "}
        <code className="font-mono">{"${task}"}</code>{" "}
        <code className="font-mono">{"${pr_list}"}</code>{" "}
        <code className="font-mono">{"${pr_url}"}</code>{" "}
        <code className="font-mono">{"${branch}"}</code>{" "}
        <code className="font-mono">{"${custom}"}</code>.
      </p>
      <FormField label="Body — 日本語 (JA)" htmlFor="tpl-ja">
        <TextArea
          id="tpl-ja"
          mono
          rows={8}
          value={form.bodyJa}
          onChange={(e) => set("bodyJa", e.target.value)}
        />
      </FormField>
      <FormField label="Body — English (EN)" htmlFor="tpl-en">
        <TextArea
          id="tpl-en"
          mono
          rows={8}
          value={form.bodyEn}
          onChange={(e) => set("bodyEn", e.target.value)}
        />
      </FormField>
      <FormField label="Body — Tiếng Việt (VI)" htmlFor="tpl-vi">
        <TextArea
          id="tpl-vi"
          mono
          rows={8}
          value={form.bodyVi}
          onChange={(e) => set("bodyVi", e.target.value)}
        />
      </FormField>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="flex gap-xs">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Save template"}
        </Button>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function DeleteTemplateButton({
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
        if (!window.confirm("Delete this template?")) return;
        startTransition(async () => {
          await deleteTemplate(id);
          onDone();
        });
      }}
    >
      {pending ? "…" : "Delete"}
    </Button>
  );
}
