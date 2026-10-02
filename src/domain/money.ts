import { CURRENCIES, FALLBACK_RATES, NON_FIAT, type CurrencyCode } from './currencies';

/** Units of each currency per 1 USD. */
export type Rates = Record<string, number>;

let numberLocale = 'en';
export const setNumberLocale = (locale: string) => {
  numberLocale = locale;
};

const formatterCache = new Map<string, Intl.NumberFormat>();
const formatter = (key: string, make: () => Intl.NumberFormat) => {
  let f = formatterCache.get(key);
  if (!f) {
    f = make();
    formatterCache.set(key, f);
  }
  return f;
};

const fiatFormatter = (code: string, compact: boolean) =>
  formatter(`${numberLocale}|${code}|${compact}`, () =>
    new Intl.NumberFormat(numberLocale, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
    }),
  );

/** Decimal places normally used by a currency (JPY 0, USD 2, KWD 3, BTC 8). */
export const currencyDigits = (code: CurrencyCode): number => {
  if (NON_FIAT.has(code)) return code === 'USDT' ? 2 : 8;
  try {
    return fiatFormatter(code, false).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
};

export const roundTo = (amount: number, digits: number): number => {
  const f = 10 ** digits;
  return Math.round((amount + Number.EPSILON) * f) / f;
};

export const roundMoney = (amount: number, code: CurrencyCode) => roundTo(amount, currencyDigits(code));

export const formatMoney = (
  amount: number,
  code: CurrencyCode,
  opts: { signed?: boolean; compact?: boolean } = {},
): string => {
  const sign = opts.signed && amount > 0 ? '+' : '';
  if (NON_FIAT.has(code)) {
    const digits = code === 'USDT' ? 2 : 6;
    const n = formatter(`${numberLocale}|nonfiat|${digits}`, () =>
      new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: digits }),
    ).format(amount);
    return `${sign}${n} ${code}`;
  }
  try {
    return sign + fiatFormatter(code, !!opts.compact && Math.abs(amount) >= 100_000).format(amount);
  } catch {
    // Codes the runtime's Intl data does not know (e.g. very new currencies).
    const n = formatter(`${numberLocale}|plain`, () =>
      new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ).format(amount);
    return `${sign}${CURRENCIES[code]?.symbol ?? code} ${n}`;
  }
};

/**
 * Parses user-typed amounts. Accepts "1,234.56", "1.234,56", "1234,5" and "1 234".
 * Returns NaN for anything that is not a number.
 */
export const parseAmount = (input: string): number => {
  let s = input.trim().replace(/[\s ']/g, '');
  if (!s) return NaN;
  // Normalise Arabic-Indic and Persian digits.
  s = s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  s = s.replace(/٫/g, '.').replace(/٬/g, ',');
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot !== -1 && lastComma !== -1) {
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const groupSep = decimalSep === '.' ? ',' : '.';
    s = s.split(groupSep).join('').replace(decimalSep, '.');
  } else if (lastComma !== -1) {
    const parts = s.split(',');
    // A single comma followed by 1-2 digits is a decimal comma; otherwise it's grouping.
    s = parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2 ? parts.join('.') : parts.join('');
  }
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return NaN;
  return parseFloat(s);
};

export const rateOf = (code: string, rates: Rates): number =>
  rates[code] || FALLBACK_RATES[code as CurrencyCode] || 1;

export const convert = (amount: number, from: CurrencyCode, to: CurrencyCode, rates: Rates): number =>
  from === to ? amount : (amount / rateOf(from, rates)) * rateOf(to, rates);
