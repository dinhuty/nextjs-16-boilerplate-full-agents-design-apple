// remark plugin: GitHub-style callouts. A blockquote whose first line is
// `[!NOTE]` / `[!TIP]` / `[!WARNING]` / `[!IMPORTANT]` / `[!CAUTION]` gets a
// `callout callout-<type>` class (styled in globals.css); the marker is removed.
type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: Record<string, unknown>;
};

const ALLOWED = new Set(["note", "tip", "important", "warning", "caution"]);

function walk(node: MdNode): void {
  if (node.type === "blockquote") {
    const p = node.children?.[0];
    const t = p?.type === "paragraph" ? p.children?.[0] : undefined;
    if (t && t.type === "text" && typeof t.value === "string") {
      const m = t.value.match(/^\[!(\w+)\]\s*\n?/);
      if (m && ALLOWED.has(m[1].toLowerCase())) {
        const type = m[1].toLowerCase();
        t.value = t.value.slice(m[0].length);
        node.data = {
          ...(node.data ?? {}),
          hProperties: { className: ["callout", `callout-${type}`] },
        };
      }
    }
  }
  node.children?.forEach(walk);
}

export function remarkCallouts() {
  return (tree: MdNode) => {
    walk(tree);
  };
}
