import { describe, expect, it } from "vitest";
import {
  assertCurrency,
  convertForDisplay,
  formatApprox,
  formatMoney,
  fromMinor,
  minorUnitDigits,
  toMinor,
  type RateTable,
} from "./money";

/** Intl uses non-breaking and narrow non-breaking spaces; compare with plain spaces. */
const plain = (s: string | null) => s?.replace(/[  ]/g, " ") ?? null;

describe("minorUnitDigits", () => {
  it.each([
    ["USD", 2],
    ["ZAR", 2],
    ["GBP", 2],
    ["JPY", 0],
    ["KWD", 3],
  ])("%s has %i minor-unit digits", (currency, digits) => {
    expect(minorUnitDigits(currency)).toBe(digits);
  });

  it("rejects codes that aren't ISO 4217 shaped", () => {
    expect(() => minorUnitDigits("usd")).toThrow(RangeError);
    expect(() => minorUnitDigits("US")).toThrow(RangeError);
    expect(() => assertCurrency("DOLLAR")).toThrow(RangeError);
  });

  it("assertCurrency accepts real codes and rejects well-formed made-up ones", () => {
    for (const c of ["USD", "ZAR", "GBP", "JPY", "KWD", "NGN", "EUR"]) {
      expect(() => assertCurrency(c)).not.toThrow();
    }
    expect(() => assertCurrency("ABC")).toThrow(RangeError);
    expect(() => assertCurrency("XYZ")).toThrow(RangeError);
  });
});

describe("toMinor", () => {
  it.each([
    ["25", "USD", 2500n],
    ["25.5", "USD", 2550n],
    ["25.50", "USD", 2550n],
    ["0.05", "GBP", 5n],
    ["1,250.00", "ZAR", 125000n],
    ["1 250", "ZAR", 125000n],
    ["2500", "JPY", 2500n],
    ["2.5", "KWD", 2500n],
    ["0.001", "KWD", 1n],
    ["-3.25", "USD", -325n],
    ["  10  ", "USD", 1000n],
  ])("%s %s → %s", (input, currency, expected) => {
    expect(toMinor(input, currency)).toBe(expected);
  });

  it("handles amounts far beyond float precision exactly", () => {
    expect(toMinor("12345678901234567.89", "USD")).toBe(1234567890123456789n);
  });

  it("refuses more decimals than the currency has, instead of rounding", () => {
    expect(() => toMinor("25.505", "USD")).toThrow(/at most 2 decimal places/);
    expect(() => toMinor("2500.5", "JPY")).toThrow(/can't have decimals/);
    expect(() => toMinor("1.0005", "KWD")).toThrow(/at most 3 decimal places/);
  });

  it("refuses things that aren't amounts", () => {
    for (const bad of ["", "abc", "1.2.3", "$25", "1e5", "."]) {
      expect(() => toMinor(bad, "USD")).toThrow(RangeError);
    }
  });
});

describe("fromMinor", () => {
  it.each([
    [2500n, "USD", "25.00"],
    [5n, "GBP", "0.05"],
    [0n, "ZAR", "0.00"],
    [125000n, "ZAR", "1250.00"],
    [2500n, "JPY", "2500"],
    [2500n, "KWD", "2.500"],
    [1n, "KWD", "0.001"],
    [-325n, "USD", "-3.25"],
    [-5n, "USD", "-0.05"],
  ])("%s %s → %s", (minor, currency, expected) => {
    expect(fromMinor(minor, currency)).toBe(expected);
  });

  it("round-trips with toMinor", () => {
    for (const [value, currency] of [
      ["0.01", "USD"],
      ["999999.99", "GBP"],
      ["7", "JPY"],
      ["12.345", "KWD"],
    ] as const) {
      const minor = toMinor(value, currency);
      expect(toMinor(fromMinor(minor, currency), currency)).toBe(minor);
    }
  });
});

describe("formatMoney", () => {
  it.each([
    [2500n, "USD", "en-US", "$25.00"],
    [-325n, "USD", "en-US", "-$3.25"],
    [5n, "GBP", "en-GB", "£0.05"],
    [123450n, "ZAR", "en-ZA", "R 1 234,50"],
    [2500n, "JPY", "en-US", "¥2,500"],
    [2500n, "KWD", "en-US", "KWD 2.500"],
  ])("%s %s in %s → %s", (minor, currency, locale, expected) => {
    expect(plain(formatMoney(minor, currency, locale))).toBe(expected);
  });

  it("formats huge amounts exactly", () => {
    expect(formatMoney(1234567890123456789n, "USD", "en-US")).toBe("$12,345,678,901,234,567.89");
  });

  it("rounds to whole units half away from zero when asked", () => {
    expect(formatMoney(250n, "USD", "en-US", { wholeUnits: true })).toBe("$3");
    expect(formatMoney(249n, "USD", "en-US", { wholeUnits: true })).toBe("$2");
    expect(formatMoney(-250n, "USD", "en-US", { wholeUnits: true })).toBe("-$3");
    expect(plain(formatMoney(2500n, "KWD", "en-US", { wholeUnits: true }))).toBe("KWD 3");
  });
});

describe("convertForDisplay", () => {
  const table: RateTable = {
    base: "USD",
    rates: new Map([
      ["ZAR", 18.2],
      ["GBP", 0.79],
      ["JPY", 151.5],
      ["KWD", 0.307],
    ]),
  };

  it("returns the amount unchanged for the same currency", () => {
    expect(convertForDisplay(2500n, "USD", "USD", table)).toBe(2500n);
  });

  it("converts from the base currency", () => {
    expect(convertForDisplay(2500n, "USD", "ZAR", table)).toBe(45500n); // $25 → R455.00
    expect(convertForDisplay(2500n, "USD", "JPY", table)).toBe(3788n); // $25 → ¥3787.5 → ¥3788
    expect(convertForDisplay(2500n, "USD", "KWD", table)).toBe(7675n); // $25 → 7.675 KWD
  });

  it("converts to the base currency", () => {
    expect(convertForDisplay(45500n, "ZAR", "USD", table)).toBe(2500n);
  });

  it("converts between two non-base currencies through the base", () => {
    expect(convertForDisplay(1000n, "GBP", "ZAR", table)).toBe(23038n); // £10 → R230.38
  });

  it("returns null when a rate is missing", () => {
    expect(convertForDisplay(1000n, "USD", "NGN", table)).toBeNull();
    expect(convertForDisplay(1000n, "NGN", "USD", table)).toBeNull();
  });

  it("formats an approximation in whole units, or nothing when not needed", () => {
    expect(plain(formatApprox(2500n, "USD", "ZAR", table, "en-ZA"))).toBe("≈ R 455");
    expect(formatApprox(2500n, "USD", "USD", table, "en-US")).toBeNull();
    expect(formatApprox(2500n, "USD", "NGN", table, "en-US")).toBeNull();
  });
});
