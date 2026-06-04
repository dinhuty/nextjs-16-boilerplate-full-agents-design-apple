import type { MessageKey } from "@/lib/i18n/dictionaries";

// Registry of tools shown on the home dashboard. Add an entry per tool.
export interface ToolEntry {
  key: string;
  href: string;
  badge: string;
  nameKey: MessageKey;
  descKey: MessageKey;
}

export const TOOLS: ToolEntry[] = [
  {
    key: "dbtool",
    href: "/db-tool",
    badge: "DB",
    nameKey: "dashboard.dbtool_name",
    descKey: "dashboard.dbtool_desc",
  },
];
