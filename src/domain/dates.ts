import type { Frequency } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/**
 * The n-th occurrence (0 = start) of a schedule. Computed from the start date each time,
 * so "monthly on the 31st" gives Jan 31, Feb 28, Mar 31 instead of drifting.
 */
export const occurrence = (start: number, frequency: Frequency, n: number): number => {
  const s = new Date(start);
  const d = new Date(start);
  switch (frequency) {
    case 'daily':
      d.setDate(s.getDate() + n);
      break;
    case 'weekly':
      d.setDate(s.getDate() + n * 7);
      break;
    case 'monthly': {
      const total = s.getMonth() + n;
      const year = s.getFullYear() + Math.floor(total / 12);
      const month = ((total % 12) + 12) % 12;
      d.setFullYear(year, month, Math.min(s.getDate(), daysInMonth(year, month)));
      break;
    }
    case 'yearly': {
      const year = s.getFullYear() + n;
      d.setFullYear(year, s.getMonth(), Math.min(s.getDate(), daysInMonth(year, s.getMonth())));
      break;
    }
  }
  return d.getTime();
};

export interface Range {
  start: number;
  /** Exclusive. */
  end: number;
}

export const monthRange = (ref: number | Date, offset = 0): Range => {
  const d = new Date(ref);
  return {
    start: new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime(),
    end: new Date(d.getFullYear(), d.getMonth() + offset + 1, 1).getTime(),
  };
};

export const dayRange = (ref: number | Date): Range => {
  const d = new Date(ref);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return { start, end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() };
};

export const inRange = (t: number, r: Range) => t >= r.start && t < r.end;

export const startOfDay = (t: number) => dayRange(t).start;

/** "YYYY-MM-DD" in local time, for <input type="date">. */
export const toDateInput = (t: number) => {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Parses "YYYY-MM-DD" as a local date, keeping the time of day from `timeFrom`. */
export const fromDateInput = (value: string, timeFrom: number = Date.now()): number => {
  const [y, m, d] = value.split('-').map(Number);
  const t = new Date(timeFrom);
  return new Date(y, m - 1, d, t.getHours(), t.getMinutes(), t.getSeconds()).getTime();
};
