// Repair helper for master-data markdown imported from esa: code fences inside
// list items were indented to align with the text after the `[ ] ` checkbox
// (e.g. 9 spaces), which over-indents them → react-markdown collapses them into
// inline code on one line. This dedents each fence to the list item's content
// column (right after `- `) so it parses as a real ```code``` block.
// Pure + idempotent — running it on already-correct markdown is a no-op.
export function fixListFences(md: string): string {
  const lines = md.split("\n");
  const out = [...lines];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^(\s*)```/);
    if (m) {
      const fenceIndent = m[1].length;
      let j = i + 1;
      while (j < lines.length && !/^\s*```\s*$/.test(lines[j])) j++;
      // Nearest enclosing list marker above the fence → its content column.
      let contentIndent = 0;
      for (let k = i - 1; k >= 0; k--) {
        const lm = lines[k].match(/^(\s*)([-*+]|\d+[.)])(\s+)/);
        if (lm && lm[1].length < fenceIndent) {
          contentIndent = lm[1].length + lm[2].length + lm[3].length;
          break;
        }
      }
      const dedent = fenceIndent - contentIndent;
      if (dedent > 0) {
        const re = new RegExp(`^ {1,${dedent}}`);
        for (let k = i; k <= j && k < lines.length; k++) {
          out[k] = lines[k].replace(re, "");
        }
      }
      i = j + 1;
    } else {
      i++;
    }
  }
  return out.join("\n");
}
