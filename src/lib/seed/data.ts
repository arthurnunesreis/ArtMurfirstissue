import { z } from "zod";
import { ShowFormat } from "@/generated/prisma/enums";
import { isKnownCurrency } from "@/lib/money";
import genresJson from "../../../prisma/seed/genres.json";
import regionsJson from "../../../prisma/seed/regions.json";

/**
 * Seed data for Regions and Genres, validated before anything touches the database.
 * The data lives in prisma/seed/*.json so it can be edited without code changes.
 */

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slugs are lowercase-with-dashes");

const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};
const countryNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });

export const regionSeedSchema = z.object({
  slug,
  name: z.string().min(1),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .refine((c) => countryNames.of(c) !== undefined, "unknown ISO 3166-1 country code"),
  timezone: z.string().refine(isTimeZone, "unknown IANA time zone"),
  defaultCurrency: z.string().refine(isKnownCurrency, "unknown ISO 4217 currency"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const genreSeedSchema = z.object({
  slug,
  name: z.string().min(1),
  format: z.enum(ShowFormat),
  parent: slug.optional(),
});

export type RegionSeed = z.infer<typeof regionSeedSchema>;
export type GenreSeed = z.infer<typeof genreSeedSchema>;

function assertUniqueSlugs(items: { slug: string }[], what: string): void {
  const seen = new Set<string>();
  for (const { slug } of items) {
    if (seen.has(slug)) throw new Error(`Duplicate ${what} slug "${slug}".`);
    seen.add(slug);
  }
}

export function parseRegions(json: unknown): RegionSeed[] {
  const regions = z.object({ regions: z.array(regionSeedSchema) }).parse(json).regions;
  assertUniqueSlugs(regions, "region");
  return regions;
}

/**
 * Validates genres and returns them parents-first, so they can be upserted in order.
 * A sub-genre's parent must exist and share its format; cycles are rejected.
 */
export function parseGenres(json: unknown): GenreSeed[] {
  const genres = z.object({ genres: z.array(genreSeedSchema) }).parse(json).genres;
  assertUniqueSlugs(genres, "genre");
  const bySlug = new Map(genres.map((g) => [g.slug, g]));
  for (const g of genres) {
    if (!g.parent) continue;
    const parent = bySlug.get(g.parent);
    if (!parent) throw new Error(`Genre "${g.slug}" has unknown parent "${g.parent}".`);
    if (parent.format !== g.format) {
      throw new Error(
        `Genre "${g.slug}" (${g.format}) can't sit under "${parent.slug}" (${parent.format}).`,
      );
    }
  }

  const ordered: GenreSeed[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (g: GenreSeed) => {
    if (state.get(g.slug) === "done") return;
    if (state.get(g.slug) === "visiting") throw new Error(`Genre cycle at "${g.slug}".`);
    state.set(g.slug, "visiting");
    if (g.parent) visit(bySlug.get(g.parent) as GenreSeed);
    state.set(g.slug, "done");
    ordered.push(g);
  };
  genres.forEach(visit);
  return ordered;
}

export const seedRegions = (): RegionSeed[] => parseRegions(regionsJson);
export const seedGenres = (): GenreSeed[] => parseGenres(genresJson);
