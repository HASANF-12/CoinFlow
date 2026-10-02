import type { Category } from '../domain/categories';
import { setNumberLocale } from '../domain/money';
import type { Frequency } from '../domain/types';
import { en } from './en';

export type MessageKey = keyof typeof en;
type Vars = Record<string, string | number>;

const RTL = new Set(['ar', 'fa', 'he', 'ur']);

/** Languages with a complete dictionary. English is the fallback for any missing key. */
const dictionaries: Record<string, Partial<Record<MessageKey, string>>> = { en };

let lang = 'en';
let dict: Partial<Record<MessageKey, string>> = en;

export const initI18n = (preferred = navigator.language) => {
  const code = preferred.toLowerCase().split('-')[0];
  lang = dictionaries[code] ? code : 'en';
  dict = dictionaries[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL.has(lang) ? 'rtl' : 'ltr';
  // Numbers follow the device region (e.g. 1.234,56 in Germany) even while the UI is in English.
  setNumberLocale(preferred);
};

export const currentLanguage = () => lang;

export const t = (key: MessageKey, vars?: Vars): string => {
  const text = dict[key] ?? en[key];
  return vars ? text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? '')) : text;
};

export const categoryLabel = (c: Category) => (dict as Record<string, string>)[`cat.${c.id}`] ?? c.name;

export const frequencyLabel = (f: Frequency) => t(`freq.${f}`);

/** Simple English-style plural helper: picks `key_one` or `key_other`. */
export const tn = (base: string, count: number, vars?: Vars) =>
  t(`${base}_${count === 1 ? 'one' : 'other'}` as MessageKey, { count, ...vars });

const dateFmt = new Map<string, Intl.DateTimeFormat>();
export const formatDate = (time: number, style: 'day' | 'short' | 'month' | 'time' | 'weekday') => {
  const key = `${lang}|${style}`;
  let f = dateFmt.get(key);
  if (!f) {
    const options: Record<typeof style, Intl.DateTimeFormatOptions> = {
      day: { day: 'numeric', month: 'short', year: 'numeric' },
      short: { day: 'numeric', month: 'short' },
      month: { month: 'long', year: 'numeric' },
      time: { hour: 'numeric', minute: '2-digit' },
      weekday: { weekday: 'long', day: 'numeric', month: 'long' },
    };
    // Month and weekday names must be in the UI language, not the device region's.
    f = new Intl.DateTimeFormat(lang, options[style]);
    dateFmt.set(key, f);
  }
  return f.format(time);
};
