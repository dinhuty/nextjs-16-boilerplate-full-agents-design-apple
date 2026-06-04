// Shared types for the DB tool.

export interface ConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  read_only: boolean;
}

export type ExecuteStatementResult =
  | {
      kind: "read";
      columns: string[];
      rows: Record<string, unknown>[];
      duration_ms: number;
    }
  | { kind: "write"; affected_rows: number; duration_ms: number }
  | { kind: "error"; error: string; duration_ms: number };

export interface ExecuteResponse {
  results: ExecuteStatementResult[];
}

export interface Snippet {
  id: string;
  tab: string;
  title: string;
  body: string;
}
