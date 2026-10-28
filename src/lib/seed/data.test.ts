import { describe, expect, it } from "vitest";
import { ENABLED_FORMATS } from "@/config/formats";
import { parseGenres, parseRegions, seedGenres, seedRegions } from "./data";

describe("region seed data", () => {
  const regions = seedRegions();

  it("loads and validates", () => {
    expect(regions.length).toBeGreaterThan(0);
  });

  it("spans several countries and currencies, so no market is privileged", () => {
    expect(new Set(regions.map((r) => r.countryCode)).size).toBeGreaterThanOrEqual(10);
    expect(new Set(regions.map((r) => r.defaultCurrency)).size).toBeGreaterThanOrEqual(8);
  });

  it("rejects bad time zones, countries, currencies and duplicate slugs", () => {
    const base = {
      slug: "x-city",
      name: "X",
      countryCode: "GB",
      timezone: "Europe/London",
      defaultCurrency: "GBP",
    };
    expect(() => parseRegions({ regions: [{ ...base, timezone: "Mars/Olympus" }] })).toThrow();
    expect(() => parseRegions({ regions: [{ ...base, countryCode: "XX" }] })).toThrow();
    expect(() => parseRegions({ regions: [{ ...base, defaultCurrency: "ABC" }] })).toThrow();
    expect(() => parseRegions({ regions: [{ ...base, slug: "Not A Slug" }] })).toThrow();
    expect(() => parseRegions({ regions: [base, base] })).toThrow(/Duplicate region slug/);
  });
});

describe("genre seed data", () => {
  const genres = seedGenres();

  it("covers every enabled format", () => {
    for (const format of ENABLED_FORMATS) {
      expect(genres.some((g) => g.format === format && !g.parent)).toBe(true);
    }
  });

  it("lists parents before their sub-genres", () => {
    const position = new Map(genres.map((g, i) => [g.slug, i]));
    for (const g of genres) {
      if (g.parent) expect(position.get(g.parent)).toBeLessThan(position.get(g.slug) as number);
    }
  });

  it("rejects unknown parents, cross-format parents, cycles and duplicates", () => {
    const g = (slug: string, format: string, parent?: string) => ({
      slug,
      name: slug,
      format,
      ...(parent ? { parent } : {}),
    });
    expect(() => parseGenres({ genres: [g("a", "CONCERT", "missing")] })).toThrow(/unknown parent/);
    expect(() => parseGenres({ genres: [g("a", "CONCERT"), g("b", "THEATRE", "a")] })).toThrow(
      /can't sit under/,
    );
    expect(() => parseGenres({ genres: [g("a", "CONCERT", "b"), g("b", "CONCERT", "a")] })).toThrow(
      /cycle/,
    );
    expect(() => parseGenres({ genres: [g("a", "CONCERT"), g("a", "CONCERT")] })).toThrow(
      /Duplicate genre slug/,
    );
    expect(() => parseGenres({ genres: [g("a", "NOT_A_FORMAT")] })).toThrow();
  });

  it("orders deeper trees correctly", () => {
    const ordered = parseGenres({
      genres: [
        { slug: "c", name: "c", format: "CONCERT", parent: "b" },
        { slug: "b", name: "b", format: "CONCERT", parent: "a" },
        { slug: "a", name: "a", format: "CONCERT" },
      ],
    });
    expect(ordered.map((g) => g.slug)).toEqual(["a", "b", "c"]);
  });
});
