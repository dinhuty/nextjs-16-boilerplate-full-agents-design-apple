import type { ConnectionConfig } from "./types";
import { parseEnvText } from "./env";

// Map a tool env blob (DB_HOST=… lines) into a MySQL ConnectionConfig.
export function envToConfig(content: string): ConnectionConfig {
  const v = parseEnvText(content);
  return {
    host: v.DB_HOST ?? "",
    port: Number(v.DB_PORT ?? "3306") || 3306,
    user: v.DB_USER ?? "",
    password: v.DB_PASSWORD ?? "",
    database: v.DB_NAME ?? "",
    read_only: (v.READ_ONLY ?? "true").toLowerCase() === "true",
  };
}

/** True when the env blob has the minimum keys needed to connect. */
export function hasConnection(content: string): boolean {
  const c = envToConfig(content);
  return Boolean(c.host && c.user && c.database);
}
