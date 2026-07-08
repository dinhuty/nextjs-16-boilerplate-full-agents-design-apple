import { db } from "../lib/db";
import { releaseTemplates, sqlSnippets, mdTags } from "./schema";
import { releaseTemplateSeeds } from "./release-templates.data";
import { sqlSnippetSeeds } from "./sql-snippets.data";

// Predefined colored tags for md docs (workflow labels).
const mdTagSeeds = [
  { name: "seed", color: "#00b48a" },
  { name: "running", color: "#2f6fd0" },
  { name: "debug", color: "#c2410c" },
  { name: "test", color: "#7c3aed" },
  { name: "investigate", color: "#c37d0d" },
];

// Idempotent seed: unique keys mean re-running only inserts what's missing, so
// it's safe to run on every deploy (see the compose `migrate` service).
async function seed() {
  const templates = await db
    .insert(releaseTemplates)
    .values(releaseTemplateSeeds)
    .onConflictDoNothing({ target: releaseTemplates.name })
    .returning({ id: releaseTemplates.id });

  const snippets = await db
    .insert(sqlSnippets)
    .values(sqlSnippetSeeds)
    .onConflictDoNothing({
      target: [sqlSnippets.category, sqlSnippets.title],
    })
    .returning({ id: sqlSnippets.id });

  const tags = await db
    .insert(mdTags)
    .values(mdTagSeeds)
    .onConflictDoNothing({ target: mdTags.name })
    .returning({ id: mdTags.id });

  console.log(
    `Seed complete. Release templates: +${templates.length}, SQL snippets: +${snippets.length}, md tags: +${tags.length}.`,
  );
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
