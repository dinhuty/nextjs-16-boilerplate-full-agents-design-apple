"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import { remarkCallouts } from "@/components/organisms/release-procedure/remark-callouts";
import { remarkWikilinks } from "@/components/organisms/md-docs/remark-wikilinks";

// Recursively collect text from a hast node (for the code-block copy button).
type HastNode = {
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};
function nodeText(n: HastNode | undefined): string {
  if (!n) return "";
  if (typeof n.value === "string") return n.value;
  return (n.children ?? []).map(nodeText).join("");
}

// Language of a fenced code block from the <code class="language-x"> child.
function codeLang(pre: HastNode | undefined): string {
  const code = pre?.children?.find((c) => c.tagName === "code");
  const cls = code?.properties?.className;
  const arr = Array.isArray(cls) ? (cls as string[]) : [];
  const lang = arr.find((c) => typeof c === "string" && c.startsWith("language-"));
  return lang ? lang.slice("language-".length) : "";
}

// Hover "Copy" button pinned top-right of a block (code / diagram source).
// The parent must be `group relative` for the hover + positioning to work.
function CopyOverlayButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
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
  );
}

// Render a ```mermaid block as a diagram (mermaid loaded on demand).
function Mermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  const [dark, setDark] = useState(false);
  const id = "m" + useId().replace(/[^a-zA-Z0-9]/g, "");

  // Follow the app's light/dark mode: mermaid bakes colours into the SVG at
  // render time, so we must re-render when the `.dark` class on <html> flips.
  useEffect(() => {
    const el = document.documentElement;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(el.classList.contains("dark"));
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: dark ? "dark" : "default",
        });
        const { svg } = await mermaid.render(id, chart);
        if (alive) setSvg(svg);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [chart, id, dark]);
  if (failed)
    return (
      <div className="group relative">
        <pre>{chart}</pre>
        <CopyOverlayButton text={chart} />
      </div>
    );
  return (
    <div className="group relative my-sm">
      <div className="overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      <CopyOverlayButton text={chart} />
    </div>
  );
}

// A "#" link that appears on hover and copies the section's anchor URL.
function AnchorHash({ id }: { id?: string }) {
  if (!id) return null;
  return (
    <a
      href={`#${id}`}
      onClick={() => {
        try {
          navigator.clipboard?.writeText(
            `${location.href.split("#")[0]}#${id}`,
          );
        } catch {
          // ignore
        }
      }}
      title="Copy link tới mục này"
      className="ml-xs align-middle text-caption text-muted no-underline opacity-0 transition-opacity hover:text-primary group-hover/h:opacity-100"
    >
      #
    </a>
  );
}

// A fenced code block with a hover "Copy" button.
function CodeBlock({ text, children }: { text: string; children: ReactNode }) {
  return (
    <div className="group relative">
      <pre>{children}</pre>
      <CopyOverlayButton text={text} />
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
  // When provided, [[Title]] becomes a link to the matching doc.
  wikiDocs?: { title: string; id: number }[];
};

// Styling lives in `.markdown-preview` (app/globals.css) so inline vs. block
// code and GFM task lists render correctly without per-element component maps.
export function MarkdownPreview({
  markdown,
  checks,
  onToggleCheck,
  breaks,
  wikiDocs,
}: Props) {
  const remarkPlugins = useMemo(() => {
    const list: unknown[] = [remarkGfm];
    if (breaks) list.push(remarkBreaks);
    list.push(remarkCallouts);
    if (wikiDocs && wikiDocs.length) {
      const byTitle = new Map(wikiDocs.map((d) => [d.title.toLowerCase(), d.id]));
      list.push(remarkWikilinks((t) => byTitle.get(t.toLowerCase()) ?? null));
    }
    return list;
  }, [breaks, wikiDocs]);

  return (
    <div className="markdown-preview">
      <ReactMarkdown
        remarkPlugins={
          remarkPlugins as ComponentProps<
            typeof ReactMarkdown
          >["remarkPlugins"]
        }
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: true }]]}
        components={{
          // Mọi link mở sang tab mới.
          a({ node, ...props }) {
            void node;
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
          pre({ node, children }) {
            if (codeLang(node) === "mermaid") {
              return <Mermaid chart={nodeText(node)} />;
            }
            return <CodeBlock text={nodeText(node)}>{children}</CodeBlock>;
          },
          h1({ node, children, ...props }) {
            void node;
            return (
              <h1 {...props} className="group/h">
                {children}
                <AnchorHash id={props.id} />
              </h1>
            );
          },
          h2({ node, children, ...props }) {
            void node;
            return (
              <h2 {...props} className="group/h">
                {children}
                <AnchorHash id={props.id} />
              </h2>
            );
          },
          h3({ node, children, ...props }) {
            void node;
            return (
              <h3 {...props} className="group/h">
                {children}
                <AnchorHash id={props.id} />
              </h3>
            );
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
