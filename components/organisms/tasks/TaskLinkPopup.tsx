"use client";

import { useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { BacklogIcon } from "@/components/atoms/icons";
import { TaskBody, type Task } from "@/components/organisms/tasks/TaskBody";

// Shown on a release-procedure page: the current user's tasks that link to this
// procedure, each opening a quick-view popup of the task's details.
export function TaskLinkPopup({
  tasks,
  procTitle,
}: {
  tasks: Task[];
  procTitle: Map<number, string>;
}) {
  const [open, setOpen] = useState<Task | null>(null);
  if (tasks.length === 0) return null;

  return (
    <div className="flex flex-col gap-sm rounded-lg border border-hairline bg-canvas p-md">
      <h2 className="text-heading-5 text-ink">Task liên kết ({tasks.length})</h2>
      <div className="flex flex-col gap-xs">
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOpen(t)}
            className="flex items-center gap-xs rounded-md border border-hairline bg-canvas px-md py-sm text-left transition-colors hover:border-primary hover:bg-surface-soft"
          >
            <BacklogIcon className="h-5 w-5 shrink-0" />
            <span className="truncate font-mono text-body-sm-medium text-ink">
              {t.title}
            </span>
          </button>
        ))}
      </div>

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.title ?? ""}
      >
        {open ? (
          <div className="flex flex-col gap-md">
            <TaskBody task={open} procTitle={procTitle} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
