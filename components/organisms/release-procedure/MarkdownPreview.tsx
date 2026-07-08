"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

type Props = {
  markdown: string;
  // Run mode: when onToggleCheck is provided, task-list checkboxes become
  // interactive. State is keyed by the checkbox's source line (1-based) within
  // this `markdown` string; `checks` overrides the `[x]` written in the source.
  checks?: Record<number, boolean>;
  onToggleCheck?: (line: number, checked: boolean) => void;
  // Turn single newlines into <br> (remark-breaks). Useful when pasting plain
  // text that isn't strict markdown so line breaks are preserved.
  breaks?: boolean;
};

// Styling lives in `.markdown-preview` (app/globals.css) so inline vs. block
// code and GFM task lists render correctly without per-element component maps.
export function MarkdownPreview({
  markdown,
  checks,
  onToggleCheck,
  breaks,
}: Props) {
  return (
    <div className="markdown-preview">
      <ReactMarkdown
        remarkPlugins={breaks ? [remarkGfm, remarkBreaks] : [remarkGfm]}
        components={{
          // Mọi link mở sang tab mới.
          a({ node, ...props }) {
            void node;
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
          input({ node, ...props }) {
            if (props.type === "checkbox" && onToggleCheck) {
              const line = node?.position?.start.line ?? 0;
              const checked = checks?.[line] ?? Boolean(props.checked);
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onToggleCheck(line, e.target.checked)}
                />
              );
            }
            return <input {...props} />;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
