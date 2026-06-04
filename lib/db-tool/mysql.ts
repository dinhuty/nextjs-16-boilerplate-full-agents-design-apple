import mysql from "mysql2/promise";
import type {
  ConnectionConfig,
  ExecuteResponse,
  ExecuteStatementResult,
} from "./types";

// Verbs allowed when the connection is in read-only mode.
const READ_VERBS = ["select", "show", "describe", "desc", "explain", "with"];

/**
 * Run a (possibly multi-statement) SQL script against the target MySQL.
 * Opens a single connection for the request, runs each statement in order, and
 * closes it. When `read_only` is set, non-read statements are rejected.
 */
export async function runSql(
  config: ConnectionConfig,
  statement: string,
): Promise<ExecuteResponse> {
  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: 5000,
    dateStrings: true,
  });

  const results: ExecuteStatementResult[] = [];
  try {
    for (const stmt of splitStatements(statement)) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;

      const isRead = READ_VERBS.includes(firstVerb(trimmed));
      if (config.read_only && !isRead) {
        results.push({
          kind: "error",
          error:
            "Read-only mode: only SELECT/SHOW/DESCRIBE/EXPLAIN are allowed",
          duration_ms: 0,
        });
        continue;
      }

      const start = Date.now();
      try {
        const [rowsOrHeader, fields] = await conn.query(trimmed);
        const duration_ms = Date.now() - start;
        if (Array.isArray(rowsOrHeader)) {
          results.push({
            kind: "read",
            columns: (fields ?? []).map((f) => f.name),
            rows: rowsOrHeader as Record<string, unknown>[],
            duration_ms,
          });
        } else {
          results.push({
            kind: "write",
            affected_rows:
              (rowsOrHeader as mysql.ResultSetHeader).affectedRows ?? 0,
            duration_ms,
          });
        }
      } catch (err) {
        results.push({
          kind: "error",
          error: (err as Error).message,
          duration_ms: Date.now() - start,
        });
      }
    }
  } finally {
    await conn.end();
  }

  return { results };
}

/** Open a transient connection, read the server version, close it. */
export async function testConnection(
  config: ConnectionConfig,
): Promise<{ server_version: string; latency_ms: number }> {
  const start = Date.now();
  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: 5000,
  });
  try {
    const [rows] = await conn.query("SELECT VERSION() as v");
    const version =
      ((rows as Record<string, unknown>[])[0]?.v as string) ?? "unknown";
    return { server_version: version, latency_ms: Date.now() - start };
  } finally {
    await conn.end();
  }
}

/**
 * Split a multi-statement script on `;`, ignoring semicolons inside
 * single/double/backtick-quoted strings and line/block comments. Adequate for
 * the snippets shipped with the tool — not a full SQL parser.
 */
function splitStatements(input: string): string[] {
  const out: string[] = [];
  let buf = "";
  let i = 0;
  const len = input.length;
  let quote: '"' | "'" | "`" | null = null;
  while (i < len) {
    const c = input[i];
    const next = input[i + 1];
    if (quote) {
      buf += c;
      if (c === "\\" && i + 1 < len) {
        buf += next;
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === "-" && next === "-") {
      const eol = input.indexOf("\n", i);
      if (eol === -1) {
        buf += input.slice(i);
        i = len;
      } else {
        buf += input.slice(i, eol + 1);
        i = eol + 1;
      }
      continue;
    }
    if (c === "#") {
      const eol = input.indexOf("\n", i);
      if (eol === -1) {
        buf += input.slice(i);
        i = len;
      } else {
        buf += input.slice(i, eol + 1);
        i = eol + 1;
      }
      continue;
    }
    if (c === "/" && next === "*") {
      const end = input.indexOf("*/", i + 2);
      if (end === -1) {
        buf += input.slice(i);
        i = len;
      } else {
        buf += input.slice(i, end + 2);
        i = end + 2;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      buf += c;
      i++;
      continue;
    }
    if (c === ";") {
      out.push(buf);
      buf = "";
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

/** Read the leading SQL verb, skipping leading whitespace and comments. */
function firstVerb(stmt: string): string {
  let s = stmt;
  for (;;) {
    s = s.replace(/^\s+/, "");
    if (s.startsWith("--") || s.startsWith("#")) {
      const eol = s.indexOf("\n");
      s = eol === -1 ? "" : s.slice(eol + 1);
      continue;
    }
    if (s.startsWith("/*")) {
      const end = s.indexOf("*/");
      s = end === -1 ? "" : s.slice(end + 2);
      continue;
    }
    break;
  }
  const m = s.match(/^([a-zA-Z]+)/);
  return m ? m[1].toLowerCase() : "";
}
