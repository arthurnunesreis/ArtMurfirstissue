import type { PrismaClient } from "@/generated/prisma/client";
import { seedGenres, seedRegions, type GenreSeed, type RegionSeed } from "./data";

type SeedDb = Pick<PrismaClient, "region" | "genre" | "$transaction">;

/** Creates or updates every Region by slug. Running it twice changes nothing the second time. */
export async function upsertRegions(db: SeedDb, regions: RegionSeed[]): Promise<number> {
  await db.$transaction(
    regions.map((r) => {
      const data = {
        name: r.name,
        countryCode: r.countryCode,
        timezone: r.timezone,
        defaultCurrency: r.defaultCurrency,
        latitude: r.latitude ?? null,
        longitude: r.longitude ?? null,
      };
      return db.region.upsert({
        where: { slug: r.slug },
        create: { slug: r.slug, ...data },
        update: data,
      });
    }),
  );
  return regions.length;
}

/** Creates or updates every Genre by slug, parents first so sub-genres can point at them. */
export async function upsertGenres(db: SeedDb, genres: GenreSeed[]): Promise<number> {
  const ids = new Map<string, string>();
  for (const g of genres) {
    const parentId = g.parent ? ids.get(g.parent) : null;
    if (g.parent && !parentId)
      throw new Error(`Parent "${g.parent}" was not seeded before "${g.slug}".`);
    const data = { name: g.name, format: g.format, parentId: parentId ?? null };
    const row = await db.genre.upsert({
      where: { slug: g.slug },
      create: { slug: g.slug, ...data },
      update: data,
      select: { id: true },
    });
    ids.set(g.slug, row.id);
  }
  return genres.length;
}

export async function seedDatabase(db: SeedDb): Promise<{ regions: number; genres: number }> {
  const regions = await upsertRegions(db, seedRegions());
  const genres = await upsertGenres(db, seedGenres());
  return { regions, genres };
}
