import { describe, expect, it, vi } from "vitest";
import { FX_BASE, loadRateTable, parseRatesResponse, refreshFxRates } from "./fx";

describe("parseRatesResponse", () => {
  it("reads the open.er-api.com shape", () => {
    const { base, rates } = parseRatesResponse({
      result: "success",
      base_code: "USD",
      rates: { USD: 1, ZAR: 18.2, JPY: 151.5 },
    });
    expect(base).toBe("USD");
    expect([...rates]).toEqual([
      ["ZAR", 18.2],
      ["JPY", 151.5],
    ]);
  });

  it("reads the { base, rates } shape", () => {
    expect(parseRatesResponse({ base: "USD", rates: { GBP: 0.79 } }).rates.get("GBP")).toBe(0.79);
  });

  it("drops malformed codes and non-positive rates", () => {
    const { rates } = parseRatesResponse({
      base: "USD",
      rates: { GBP: 0.79, xyz: 2, BAD1: 3, ZAR: 0, EUR: -1 },
    });
    expect([...rates.keys()]).toEqual(["GBP"]);
  });

  it("rejects error responses and responses with nothing usable", () => {
    expect(() => parseRatesResponse({ result: "error", base_code: "USD", rates: {} })).toThrow();
    expect(() => parseRatesResponse({ rates: { GBP: 0.79 } })).toThrow();
    expect(() => parseRatesResponse({ base: "USD", rates: { USD: 1 } })).toThrow(/no usable/);
    expect(() => parseRatesResponse("nope")).toThrow();
  });
});

function fakeDb(rows: { base: string; quote: string; rate: number }[] = []) {
  const upsert = vi.fn((args: unknown) => args);
  return {
    upsert,
    fxRate: { upsert, findMany: vi.fn(async () => rows) },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  };
}

const okFetch = (body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;

describe("refreshFxRates", () => {
  it("upserts every rate in one transaction", async () => {
    const db = fakeDb();
    const result = await refreshFxRates(
      db as never,
      "https://rates.example/USD",
      okFetch({ base_code: "USD", rates: { ZAR: 18.2, GBP: 0.79 } }),
    );
    expect(result).toEqual({ base: "USD", count: 2 });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.upsert).toHaveBeenCalledTimes(2);
    expect(db.upsert.mock.calls[0]?.[0]).toMatchObject({
      where: { base_quote: { base: "USD", quote: "ZAR" } },
      update: { rate: 18.2 },
    });
  });

  it("refuses rates in a different base currency", async () => {
    const db = fakeDb();
    await expect(
      refreshFxRates(db as never, "x", okFetch({ base: "EUR", rates: { GBP: 0.85 } })),
    ).rejects.toThrow(/must return USD/);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("fails cleanly when the API is down", async () => {
    const down = vi.fn(async () => new Response("", { status: 503 })) as unknown as typeof fetch;
    await expect(refreshFxRates(fakeDb() as never, "x", down)).rejects.toThrow(/503/);
  });
});

describe("loadRateTable", () => {
  it("builds a table keyed by quote currency", async () => {
    const table = await loadRateTable(
      fakeDb([{ base: FX_BASE, quote: "ZAR", rate: 18.2 }]) as never,
    );
    expect(table.base).toBe("USD");
    expect(table.rates.get("ZAR")).toBe(18.2);
  });
});
