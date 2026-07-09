import Link from "next/link";
import type { TaskPr, TaskLink, TaskChecklistItem } from "@/db/schema";
import { CheckIcon } from "@/components/atoms/icons";

export type Task = {
  id: number;
  title: string;
  description: string;
  backlogUrl: string;
  slackTaskUrl: string;
  slackReviewUrl: string;
  procedureId: number | null;
  docUrl: string;
  basicDesignUrl: string;
  prs: TaskPr[];
  links: TaskLink[];
  checklist: TaskChecklistItem[];
  note: string;
  tags: string[];
  docIds: number[];
};

// Counts for a checklist's progress line.
export function checklistProgress(items: TaskChecklistItem[]) {
  return {
    total: items.length,
    done: items.filter((c) => c.done).length,
    tested: items.filter((c) => c.tested).length,
  };
}

// Reserved tag: marks a task as released (rendered as a distinct green badge).
export const RELEASE_TAG = "release";

export function prUrl(repo: string, pr: string): string {
  return `https://github.com/air-closet/${repo}/pull/${pr}`;
}

// Backlog ticket URL — the task title is the ticket key (AIRCLOSET-xxxxx).
export function defaultBacklogUrl(title: string): string {
  return `https://air-closet.backlog.jp/view/${title.trim()}`;
}

// Effective Backlog link: the stored override, or derived from the title.
export function backlogUrlOf(t: {
  backlogUrl: string;
  title: string;
}): string {
  return t.backlogUrl.trim() || defaultBacklogUrl(t.title);
}

export function TagChip({ tag }: { tag: string }) {
  const isRelease = tag === RELEASE_TAG;
  return (
    <span
      className={
        isRelease
          ? "inline-flex items-center gap-xxs rounded-full bg-[#22a06b]/12 px-sm py-xxs text-caption font-medium text-[#22a06b]"
          : "inline-flex items-center rounded-full bg-surface px-sm py-xxs text-caption text-steel"
      }
    >
      {isRelease ? "released" : `#${tag}`}
    </span>
  );
}

function LinkChip({ href, label }: { href: string; label: string }) {
  if (!href.trim()) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-xxs text-caption text-steel underline-offset-2 transition-colors hover:text-primary hover:underline"
    >
      {label} <span aria-hidden>↗</span>
    </a>
  );
}

// Full task content — shared by the grid card, the detail modal, and the
// procedure page's linked-task quick view.
export function TaskBody({
  task: t,
  procTitle,
  docTitle,
  showChecklist = true,
}: {
  task: Task;
  procTitle: Map<number, string>;
  docTitle?: Map<number, string>;
  // The detail modal renders an interactive checklist instead, so it turns this
  // read-only copy off to avoid showing the list twice.
  showChecklist?: boolean;
}) {
  const cp = checklistProgress(t.checklist);
  return (
    <>
      {t.tags.length > 0 ? (
        <div className="flex flex-wrap gap-xs">
          {t.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      ) : null}

      {t.description.trim() ? (
        <p className="whitespace-pre-wrap text-body-sm text-slate">
          {t.description}
        </p>
      ) : null}

      {showChecklist && cp.total > 0 ? (
        <div className="flex flex-col gap-xxs">
          <span className="text-caption text-stone">
            Checklist {cp.done}/{cp.total} xong
            {cp.tested > 0 ? ` · ${cp.tested} đã test` : ""}
          </span>
          <ul className="flex flex-col gap-xxs">
            {t.checklist.map((c, i) => (
              <li key={i} className="flex items-center gap-xs text-body-sm">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border ${
                    c.done
                      ? "border-primary bg-primary text-on-primary"
                      : "border-hairline text-transparent"
                  }`}
                >
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span className={c.done ? "text-stone line-through" : "text-slate"}>
                  {c.text}
                </span>
                {c.tested ? (
                  <span className="rounded-full bg-[#22a06b]/12 px-xs py-[1px] text-caption text-[#22a06b]">
                    đã test
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-md">
        <LinkChip href={backlogUrlOf(t)} label="Backlog" />
        <LinkChip href={t.slackTaskUrl} label="Slack task" />
        <LinkChip href={t.slackReviewUrl} label="Slack review" />
        <LinkChip href={t.docUrl} label="Document" />
        <LinkChip href={t.basicDesignUrl} label="Basic design" />
        {t.links.map((l, i) => (
          <LinkChip key={i} href={l.url} label={l.label || "Link"} />
        ))}
      </div>

      {t.procedureId ? (
        <Link
          href={`/release-procedure/${t.procedureId}`}
          className="text-body-sm text-primary underline"
        >
          {procTitle.get(t.procedureId) ?? "Release procedure"}
        </Link>
      ) : null}

      {docTitle && t.docIds.length > 0 ? (
        <div className="flex flex-col gap-xxs">
          <span className="text-caption text-stone">Docs:</span>
          {t.docIds.map((id) => (
            <Link
              key={id}
              href={`/md-docs/${id}`}
              className="truncate text-body-sm text-primary underline"
            >
              {docTitle.get(id) ?? `Doc #${id}`}
            </Link>
          ))}
        </div>
      ) : null}

      {t.prs.length > 0 ? (
        <div className="flex flex-col gap-xxs">
          {t.prs.map((p, i) => (
            <div key={i} className="text-body-sm text-slate">
              <span className="font-mono">{p.repo || "?"}</span>
              {p.branch ? <span className="text-stone"> · {p.branch}</span> : null}
              {p.pr ? (
                <>
                  {" — "}
                  <a
                    href={prUrl(p.repo, p.pr)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-tag underline"
                  >
                    #{p.pr} ↗
                  </a>
                </>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {t.note.trim() ? (
        <p className="whitespace-pre-wrap rounded-md bg-surface p-sm text-body-sm text-slate">
          {t.note}
        </p>
      ) : null}
    </>
  );
}
