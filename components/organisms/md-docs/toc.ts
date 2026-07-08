import GithubSlugger from "github-slugger";

export type Heading = { level: number; text: string; slug: string };

// Extract h1–h3 headings from markdown for a table of contents. Slugs use
// github-slugger (same as rehype-slug) so anchors match the rendered heading
// ids. Skips headings inside fenced code blocks.
export function extractHeadings(md: string): Heading[] {
  const slugger = new GithubSlugger();
  const out: Heading[] = [];
  let inFence = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,3})\s+(.+?)\s*#*$/);
    if (!m) continue;
    const text = m[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label
      .replace(/[*_`~]/g, "") // emphasis / code markers
      .trim();
    if (text) out.push({ level: m[1].length, text, slug: slugger.slug(text) });
  }
  return out;
}
