// First-time database setup. Works on Windows, macOS and Linux.
// 1. Creates the initial migration from prisma/schema.prisma and applies it
//    (Prisma creates the database itself if it doesn't exist yet).
// 2. Creates a second migration with the raw SQL Prisma can't express
//    (the partial unique index on Suggestion.matchKey) and applies it.
// Run once with `pnpm db:init`, then commit prisma/migrations/.
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join("prisma", "migrations");
const run = (cmd) => execSync(cmd, { stdio: "inherit", shell: true });

if (existsSync(migrationsDir) && readdirSync(migrationsDir).some((d) => d.endsWith("_init"))) {
  console.log("prisma/migrations already has an init migration. Nothing to do.");
  process.exit(0);
}

run("pnpm prisma migrate dev --name init");
run("pnpm prisma migrate dev --create-only --name suggestion_active_match");

const dir = readdirSync(migrationsDir)
  .filter((d) => d.endsWith("_suggestion_active_match"))
  .sort()
  .at(-1);
if (!dir) throw new Error("Could not find the suggestion_active_match migration folder.");
copyFileSync(
  join("prisma", "sql", "suggestion_active_match.sql"),
  join(migrationsDir, dir, "migration.sql"),
);

run("pnpm prisma migrate dev");
console.log("\nDone. Commit the prisma/migrations folder.");
