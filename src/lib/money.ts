/**
 * Money helpers. The only place in the app that formats or converts money.
 *
 * Rules (CLAUDE.md principle 4):
 * - Stored amounts are integer minor units (`bigint`) plus an ISO 4217 currency code.
 *   $25.00 is `2500n` + "USD"; ¥2500 is `2500n` + "JPY"; 2.500 KWD is `2500n` + "KWD".
 * - How many minor units a currency has comes from `Intl.NumberFormat`, so zero-decimal
 *   (JPY) and three-decimal (KWD) currencies work without a hand-kept table.
 * - Floats appear only in `convertForDisplay`, which is for "≈" display and never stored.
 */

const CURRENCY_RE = /^[A-Z]{3}$/;
const digitsCache = new Map<string, number>();

let knownCurrencies: ReadonlySet<string> | undefined;

/** True for ISO 4217 codes this runtime knows (Intl.supportedValuesOf). */
export function isKnownCurrency(currency: string): boolean {
  knownCurrencies ??= new Set(Intl.supportedValuesOf("currency"));
  return knownCurrencies.has(currency);
}

/** Throws if `currency` isn't an ISO 4217 code this runtime knows. Use at input boundaries. */
export function assertCurrency(currency: string): void {
  if (!CURRENCY_RE.test(currency) || !isKnownCurrency(currency)) {
    throw new RangeError(`"${currency}" is not a known ISO 4217 currency code (e.g. "USD").`);
  }
}

/** Number of minor-unit digits for a currency: USD 2, JPY 0, KWD 3. */
export function minorUnitDigits(currency: string): number {
  const cached = digitsCache.get(currency);
  if (cached !== undefined) return cached;
  if (!CURRENCY_RE.test(currency)) {
    throw new RangeError(`"${currency}" is not an ISO 4217 currency code (e.g. "USD").`);
  }
  const digits = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;
  if (digits === undefined) throw new RangeError(`No minor-unit information for ${currency}.`);
  digitsCache.set(currency, digits);
  return digits;
}

const DECIMAL_RE = /^(-)?(\d+)(?:\.(\d*))?$/;

/**
 * Parses a decimal amount typed by a person ("25", "25.5", "1,250.00") into minor units.
 * Accepts thousands separators (",", spaces, "_") and a "." decimal point.
 * Rejects more decimal places than the currency allows, rather than silently rounding.
 */
export function toMinor(amount: string, currency: string): bigint {
  const digits = minorUnitDigits(currency);
  const cleaned = amount.trim().replace(/[,\s_]/g, "");
  const match = DECIMAL_RE.exec(cleaned);
  if (!match) throw new RangeError(`"${amount}" is not a valid amount.`);
  const [, sign, whole = "0", fraction = ""] = match;
  if (fraction.length > digits) {
    throw new RangeError(
      digits === 0
        ? `${currency} amounts can't have decimals.`
        : `${currency} amounts can have at most ${digits} decimal place${digits === 1 ? "" : "s"}.`,
    );
  }
  const minor = BigInt(whole + fraction.padEnd(digits, "0"));
  return sign ? -minor : minor;
}

/** Minor units back to an exact decimal string: 2500n USD → "25.00", 2500n JPY → "2500". */
export function fromMinor(amountMinor: bigint, currency: string): string {
  const digits = minorUnitDigits(currency);
  const negative = amountMinor < 0n;
  const abs = (negative ? -amountMinor : amountMinor).toString();
  if (digits === 0) return (negative ? "-" : "") + abs;
  const padded = abs.padStart(digits + 1, "0");
  const whole = padded.slice(0, -digits);
  const fraction = padded.slice(-digits);
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export type FormatMoneyOptions = {
  /** Drop the minor units ("$1,250" instead of "$1,250.00"), rounding half away from zero. */
  wholeUnits?: boolean;
};

/**
 * Formats minor units for display in the viewer's locale: (2500n, "USD", "en-US") → "$25.00".
 * Exact for any size of amount: the decimal string goes to Intl, never a float.
 */
export function formatMoney(
  amountMinor: bigint,
  currency: string,
  locale: string,
  options: FormatMoneyOptions = {},
): string {
  const digits = minorUnitDigits(currency);
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: options.wholeUnits ? 0 : digits,
    maximumFractionDigits: options.wholeUnits ? 0 : digits,
  });
  // Intl.NumberFormat accepts decimal strings and formats them exactly.
  return formatter.format(fromMinor(amountMinor, currency) as `${number}`);
}

/**
 * Exchange rates for display only: units of each currency per one unit of `base`.
 * Built from the FxRate table (see src/lib/fx.ts).
 */
export type RateTable = {
  base: string;
  rates: ReadonlyMap<string, number>;
};

/**
 * Approximate conversion for "≈" display. Returns minor units in `to`, or `null` when a
 * rate is missing. Never store the result: stored amounts stay in their own currency.
 */
export function convertForDisplay(
  amountMinor: bigint,
  from: string,
  to: string,
  table: RateTable,
): bigint | null {
  if (from === to) return amountMinor;
  const rateOf = (code: string) => (code === table.base ? 1 : table.rates.get(code));
  const fromRate = rateOf(from);
  const toRate = rateOf(to);
  if (!fromRate || !toRate) return null;

  // Floats are acceptable here: the result is only ever shown as an approximation.
  const major = Number(fromMinor(amountMinor, from)) * (toRate / fromRate);
  return BigInt(Math.round(major * 10 ** minorUnitDigits(to)));
}

/**
 * "≈ R 455" style text for showing an amount in the viewer's currency, or `null` if it
 * can't be converted or the currencies match. Shown in whole units, since it's approximate.
 */
export function formatApprox(
  amountMinor: bigint,
  from: string,
  to: string,
  table: RateTable,
  locale: string,
): string | null {
  if (from === to) return null;
  const converted = convertForDisplay(amountMinor, from, to, table);
  if (converted === null) return null;
  return `≈ ${formatMoney(converted, to, locale, { wholeUnits: true })}`;
}
