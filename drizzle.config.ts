import { defineConfig } from "drizzle-kit";

// Standalone `drizzle-kit` invocations don't inherit Next.js env loading.
// run.sh also sources .env.local; this covers direct `yarn db:*` calls.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local absent or Node < 20.12 — fall back to the ambient environment.
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Start Postgres with `bash run.sh db` and ensure .env.local exists.",
  );
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});
