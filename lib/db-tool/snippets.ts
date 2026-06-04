// Snippet parameter helpers. A snippet body holds ${param} placeholders that
// the UI turns into a fill-in form; the runner substitutes them before execute.

const PLACEHOLDER_RE = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/** Distinct param names referenced by the body, in first-seen order. */
export function extractParams(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(PLACEHOLDER_RE)) {
    out.add(m[1]);
  }
  return Array.from(out);
}

/** Replace every ${param} with the supplied value (empty string when missing). */
export function applyParams(
  body: string,
  params: Record<string, string>,
): string {
  return body.replace(PLACEHOLDER_RE, (_, name: string) => params[name] ?? "");
}
