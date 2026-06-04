// Generic .env / GitLab-CI style text parser. Each tool stores its config as a
// plain text blob; the tool's frontend parses it into key=value pairs.

export const DB_TOOL_KEY = "dbtool";

export const DEFAULT_ENV_TEMPLATE = `DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=acm_mall
READ_ONLY=true`;

/** Parse `KEY=VALUE` lines, ignoring blanks and `#` comments. */
export function parseEnvText(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}
