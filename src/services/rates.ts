import type { Rates } from '../domain/money';
import { safeStorage } from './platform';

// Same cache key as v1 so existing installs start with their last fetched rates.
const KEY = 'coinflow_exchange_rates';
const MAX_AGE = 6 * 60 * 60 * 1000;
const API = 'https://open.er-api.com/v6/latest/USD';

export interface RatesState {
  rates: Rates;
  /** When the rates were fetched; 0 means built-in fallback rates. */
  updatedAt: number;
}

export const loadCachedRates = (): RatesState => {
  try {
    const cached = JSON.parse(safeStorage.get(KEY) ?? 'null');
    if (cached?.rates && typeof cached.timestamp === 'number') return { rates: cached.rates, updatedAt: cached.timestamp };
  } catch {
    /* ignore */
  }
  return { rates: {}, updatedAt: 0 };
};

export const isStale = (state: RatesState) => Date.now() - state.updatedAt > MAX_AGE;

/** Fetches fresh USD-based rates. Returns null when offline or the API fails; callers keep what they have. */
export const fetchRates = async (): Promise<RatesState | null> => {
  try {
    const res = await fetch(API, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const body = await res.json();
    if (body?.result !== 'success' || typeof body.rates !== 'object') return null;
    const state = { rates: { ...body.rates, USD: 1 } as Rates, updatedAt: Date.now() };
    safeStorage.set(KEY, JSON.stringify({ rates: state.rates, timestamp: state.updatedAt, base: 'USD' }));
    return state;
  } catch {
    return null;
  }
};
