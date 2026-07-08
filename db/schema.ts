import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
  boolean,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // New sign-ups start unapproved; the admin approves them before they can log in.
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Opaque random token in `id`; the token itself is the session secret, so no
// separate cookie encryption is needed.
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Shared master data: a reusable trilingual release block (e.g. "Merge PR to
// master", "Release air-closet-api"). `body_*` holds copy-paste markdown with
// `${...}` placeholders. `repo` scopes per-repo placeholders (${repo}/${pr}/…).
export const releaseTemplates = pgTable("release_templates", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().default(""),
  name: text("name").notNull().unique(),
  repo: text("repo").notNull().default(""),
  bodyJa: text("body_ja").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  bodyVi: text("body_vi").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedBy: integer("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export type ProcedureLanguage = "ja" | "en" | "vi";

// One ordered block of a saved procedure — a snapshot of the chosen-language
// template body (placeholders kept), editable inline. `repo` binds per-repo
// placeholders to the matching release-branch row.
export type ProcedureBlock = {
  templateId: number | null;
  name: string;
  repo: string;
  body: string;
};

// A release target row the user fills in; drives ${pr_list} / ${pr_url} / etc.
export type ReleaseBranch = {
  repo: string;
  branch: string;
  pr: string;
};

export type ProcedureVariables = {
  branches: ReleaseBranch[];
  // Values for any other ${custom} placeholders found in the blocks.
  vars: Record<string, string>;
};

export const releaseProcedures = pgTable("release_procedures", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  language: text("language").notNull().default("ja").$type<ProcedureLanguage>(),
  blocks: jsonb("blocks").notNull().$type<ProcedureBlock[]>(),
  variables: jsonb("variables").notNull().$type<ProcedureVariables>(),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Shared master data for the SQL Runner tool: a library of SQL snippets to
// copy & run locally (no execution here). Cloned from acm-tools/database.
export const sqlSnippets = pgTable(
  "sql_snippets",
  {
    id: serial("id").primaryKey(),
    category: text("category").notNull().default(""),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedBy: integer("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [unique("sql_snippets_category_title_unique").on(t.category, t.title)],
);

// A PR/branch belonging to a task (a task usually spans several repos).
export type TaskPr = { repo: string; branch: string; pr: string };

// A user-added custom link on a task (name + URL).
export type TaskLink = { label: string; url: string };

// Personal task tracker — each row is private to its owner (`user_id`); the
// tool always queries scoped to the current user.
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  // Optional override; empty = derive https://air-closet.backlog.jp/view/<title>.
  backlogUrl: text("backlog_url").notNull().default(""),
  slackTaskUrl: text("slack_task_url").notNull().default(""),
  slackReviewUrl: text("slack_review_url").notNull().default(""),
  procedureId: integer("procedure_id").references(() => releaseProcedures.id, {
    onDelete: "set null",
  }),
  docUrl: text("doc_url").notNull().default(""),
  basicDesignUrl: text("basic_design_url").notNull().default(""),
  prs: jsonb("prs")
    .notNull()
    .$type<TaskPr[]>()
    .default(sql`'[]'::jsonb`),
  // User-added custom links (name + URL).
  links: jsonb("links")
    .notNull()
    .$type<TaskLink[]>()
    .default(sql`'[]'::jsonb`),
  note: text("note").notNull().default(""),
  // Free-form labels; the reserved "release" tag marks a released task.
  tags: jsonb("tags")
    .notNull()
    .$type<string[]>()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Shared master data: a library of markdown documents (notes, docs, cheat
// sheets). Everyone can add / edit / delete; flat list with tags.
export const mdDocs = pgTable("md_docs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  tags: jsonb("tags").notNull().$type<string[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedBy: integer("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// Configurable colored tags for md docs (name + hex color). Master data.
export const mdTags = pgTable("md_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#888888"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Many-to-many link between personal tasks and shared md docs.
export const taskDocs = pgTable(
  "task_docs",
  {
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    docId: integer("doc_id")
      .notNull()
      .references(() => mdDocs.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.docId] })],
);

export type User = typeof users.$inferSelect;
export type ReleaseTemplate = typeof releaseTemplates.$inferSelect;
export type ReleaseProcedure = typeof releaseProcedures.$inferSelect;
export type SqlSnippet = typeof sqlSnippets.$inferSelect;
export type MdDoc = typeof mdDocs.$inferSelect;
export type MdTag = typeof mdTags.$inferSelect;
export type Task = typeof tasks.$inferSelect;
