import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import type { RateTable } from "@/lib/money";

/**
 * Exchange rates for "≈" display (ARCHITECTURE.md §3). Rates are refreshed daily by the
 * /api/cron/fx route and stored in FxRate as base → quote pairs. They are never used to
 * change a stored amount.
 */

export const FX_BASE = "USD";

const code = z.string().regex(/^[A-Z]{3}$/);

/**
 * Accepts the two common shapes of free rates APIs:
 * - `{ base_code: "USD", rates: { ZAR: 18.2, … } }` (e.g. open.er-api.com/v6/latest/USD)
 * - `{ base: "USD", rates: { ZAR: 18.2, … } }` (e.g. Frankfurter, exchangerate.host)
 */
const ratesResponse = z
  .object({
    base_code: code.optional(),
    base: code.optional(),
    result: z.string().optional(),
    rates: z.record(z.string(), z.number()),
  })
  .refine((r) => r.result === undefined || r.result === "success", {
    message: "Rates API reported an error.",
  })
  .refine((r) => r.base_code ?? r.base, { message: "Rates API response has no base currency." });

export type ParsedRates = { base: string; rates: Map<string, number> };

/** Validates a rates API response and keeps only well-formed, positive, finite rates. */
export function parseRatesResponse(json: unknown): ParsedRates {
  const parsed = ratesResponse.parse(json);
  const base = (parsed.base_code ?? parsed.base) as string;
  const rates = new Map<string, number>();
  for (const [quote, rate] of Object.entries(parsed.rates)) {
    if (quote === base) continue;
    if (!/^[A-Z]{3}$/.test(quote)) continue;
    if (!Number.isFinite(rate) || rate <= 0) continue;
    rates.set(quote, rate);
  }
  if (rates.size === 0) throw new Error("Rates API returned no usable rates.");
  return { base, rates };
}

type FxDb = Pick<PrismaClient, "fxRate" | "$transaction">;

/**
 * Fetches the latest rates and upserts them into FxRate in one transaction.
 * Returns how many rates were stored.
 */
export async function refreshFxRates(
  db: FxDb,
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ base: string; count: number }> {
  const res = await fetchImpl(url, { headers: { accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Rates API answered ${res.status}.`);
  const { base, rates } = parseRatesResponse(await res.json());
  if (base !== FX_BASE) {
    throw new Error(`Rates API base is ${base}; FX_RATES_API_URL must return ${FX_BASE} rates.`);
  }

  const fetchedAt = new Date();
  await db.$transaction(
    [...rates].map(([quote, rate]) =>
      db.fxRate.upsert({
        where: { base_quote: { base, quote } },
        create: { base, quote, rate, fetchedAt },
        update: { rate, fetchedAt },
      }),
    ),
  );
  return { base, count: rates.size };
}

/** Loads the stored rates as a table for `convertForDisplay` / `formatApprox`. */
export async function loadRateTable(db: Pick<PrismaClient, "fxRate">): Promise<RateTable> {
  const rows = await db.fxRate.findMany({ where: { base: FX_BASE } });
  return { base: FX_BASE, rates: new Map(rows.map((r) => [r.quote, r.rate])) };
}
