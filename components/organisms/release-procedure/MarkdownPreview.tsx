"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";

// Recursively collect text from a hast node (for the code-block copy button).
type HastNode = { value?: string; children?: HastNode[] };
function nodeText(n: HastNode | undefined): string {
  if (!n) return "";
  if (typeof n.value === "string") return n.value;
  return (n.children ?? []).map(nodeText).join("");
}

// A fenced code block with a hover "Copy" button.
function CodeBlock({ text, children }: { text: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative">
      <pre>{children}</pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="absolute right-xs top-xs rounded-md border border-hairline bg-canvas px-xs py-xxs text-caption text-steel opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

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
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: true }]]}
        components={{
          // Mọi link mở sang tab mới.
          a({ node, ...props }) {
            void node;
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
          pre({ node, children }) {
            return <CodeBlock text={nodeText(node)}>{children}</CodeBlock>;
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
