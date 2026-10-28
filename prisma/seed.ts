// Seeds Regions and Genres from prisma/seed/*.json. Safe to run any number of times.
// Run with `pnpm db:seed` (Prisma also runs it after `prisma migrate reset`).
import "dotenv/config";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed/run";

seedDatabase(db)
  .then(({ regions, genres }) => console.log(`Seeded ${regions} regions and ${genres} genres.`))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
