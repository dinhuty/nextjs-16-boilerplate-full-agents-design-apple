import { db } from "../lib/db";

async function seed() {
  // No tables yet — add inserts here once db/schema.ts defines them, e.g.:
  //   await db.insert(users).values({ email: "admin@example.com" });
  void db;
  console.log("Seed complete. (nothing to seed yet)");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
