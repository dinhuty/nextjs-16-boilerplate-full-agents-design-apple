// remark plugin: turn [[Doc Title]] into a link to that md doc. `resolve`
// maps a title to a doc id (null = unresolved → left as plain text). Code /
// inline-code nodes are untouched (their content isn't a `text` node).
type MdNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MdNode[];
};

const WIKI_RE = /\[\[([^\]]+)\]\]/g;

function splitText(value: string, resolve: (t: string) => number | null): MdNode[] {
  const out: MdNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  WIKI_RE.lastIndex = 0;
  while ((m = WIKI_RE.exec(value))) {
    if (m.index > last) out.push({ type: "text", value: value.slice(last, m.index) });
    const title = m[1].trim();
    const id = resolve(title);
    if (id != null) {
      out.push({
        type: "link",
        url: `/md-docs/${id}`,
        children: [{ type: "text", value: title }],
      });
    } else {
      out.push({ type: "text", value: `[[${title}]]` });
    }
    last = m.index + m[0].length;
  }
  if (last === 0) return [{ type: "text", value }];
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  return out;
}

function transform(children: MdNode[], resolve: (t: string) => number | null): MdNode[] {
  const out: MdNode[] = [];
  for (const child of children) {
    if (child.type === "text" && typeof child.value === "string" && child.value.includes("[[")) {
      out.push(...splitText(child.value, resolve));
    } else {
      if (child.children) child.children = transform(child.children, resolve);
      out.push(child);
    }
  }
  return out;
}

// Returns a unified attacher (a plugin), so it can be passed to remarkPlugins.
export function remarkWikilinks(resolve: (title: string) => number | null) {
  return () => (tree: MdNode) => {
    if (tree.children) tree.children = transform(tree.children, resolve);
  };
}
