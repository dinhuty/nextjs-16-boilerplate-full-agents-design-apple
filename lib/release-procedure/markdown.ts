import type {
  ProcedureBlock,
  ProcedureLanguage,
  ProcedureVariables,
  ReleaseBranch,
} from "@/db/schema";

export const GITHUB_ORG = "https://github.com/air-closet";

export const LANGUAGES: { value: ProcedureLanguage; label: string }[] = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
];

// Placeholder names the builder fills automatically — never shown as manual
// fields. Everything else (${custom}) becomes a free-text variable input.
export const RESERVED_VARS = new Set([
  "task",
  "pr_list",
  "repo",
  "pr",
  "pr_url",
]);

const VAR_RE = /\$\{(\w+)\}/g;

export function prUrl(repo: string, pr: string): string {
  return `${GITHUB_ORG}/${repo}/pull/${pr || "??"}`;
}

/** Unique custom `${var}` names across blocks, minus the reserved ones. */
export function detectVariables(blocks: ProcedureBlock[]): string[] {
  const found = new Set<string>();
  for (const block of blocks) {
    for (const match of block.body.matchAll(VAR_RE)) {
      const name = match[1];
      if (!RESERVED_VARS.has(name)) found.add(name);
    }
  }
  return [...found];
}

function branchFor(
  repo: string,
  branches: ReleaseBranch[],
): ReleaseBranch | undefined {
  const key = repo.trim().toLowerCase();
  if (!key) return undefined;
  const matches = branches.filter(
    (b) => b.repo.trim().toLowerCase() === key,
  );
  // Prefer a row that actually has a PR filled in — guards against a duplicate
  // repo row (e.g. an auto-added empty one) shadowing the one the user filled.
  return matches.find((b) => b.pr.trim()) ?? matches[0];
}

function globalVars(
  title: string,
  variables: ProcedureVariables,
): Record<string, string> {
  const active = variables.branches.filter((b) => b.repo.trim());
  const prList = active
    .map((b) => `- ${b.repo}: ${prUrl(b.repo, b.pr)}`)
    .join("\n");
  return {
    task: title,
    pr_list: prList,
    ...variables.vars,
  };
}

function substitute(body: string, map: Record<string, string>): string {
  return body.replace(VAR_RE, (whole, name: string) =>
    name in map ? map[name] : whole,
  );
}

/** Substitute one block, layering its repo-scoped vars over the global map. */
export function renderBlock(
  block: ProcedureBlock,
  title: string,
  variables: ProcedureVariables,
): string {
  const map = globalVars(title, variables);
  if (block.repo.trim()) {
    const match = branchFor(block.repo, variables.branches);
    map.repo = block.repo;
    map.pr = match?.pr ?? "";
    map.pr_url = prUrl(block.repo, match?.pr ?? "");
  }
  return substitute(block.body, map);
}

/** The full procedure as one markdown document (title heading + blocks). */
export function procedureToMarkdown(
  title: string,
  blocks: ProcedureBlock[],
  variables: ProcedureVariables,
): string {
  const parts = [`# ${title}`];
  for (const block of blocks) {
    parts.push(`## ${block.name}\n\n${renderBlock(block, title, variables)}`);
  }
  return parts.join("\n\n").trim() + "\n";
}
