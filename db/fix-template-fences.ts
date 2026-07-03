// One-off (idempotent) repair: fix over-indented code fences in existing
// release_templates rows so they render as proper ```code``` blocks.
// Run: `npx tsx db/fix-template-fences.ts` (or `bash run.sh` wrapper).
// Safe to re-run: only rows whose markdown actually changes are updated.
import { eq } from "drizzle-orm";

// Standalone tsx runs don't inherit Next.js env loading.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local absent — fall back to ambient environment.
}

import { db } from "@/lib/db";
import { releaseTemplates } from "@/db/schema";
import { fixListFences } from "@/db/fix-fences.util";

async function main() {
  const rows = await db
    .select({
      id: releaseTemplates.id,
      name: releaseTemplates.name,
      bodyJa: releaseTemplates.bodyJa,
      bodyEn: releaseTemplates.bodyEn,
      bodyVi: releaseTemplates.bodyVi,
    })
    .from(releaseTemplates);

  let fixed = 0;
  for (const r of rows) {
    const bodyJa = fixListFences(r.bodyJa);
    const bodyEn = fixListFences(r.bodyEn);
    const bodyVi = fixListFences(r.bodyVi);
    if (bodyJa === r.bodyJa && bodyEn === r.bodyEn && bodyVi === r.bodyVi) {
      continue;
    }
    await db
      .update(releaseTemplates)
      .set({ bodyJa, bodyEn, bodyVi })
      .where(eq(releaseTemplates.id, r.id));
    fixed++;
    console.log(`fixed: ${r.name}`);
  }
  console.log(`\nDone. ${fixed}/${rows.length} templates updated.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
