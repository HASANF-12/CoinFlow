import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { getCategory, categoryIdFromV1Name, CATEGORIES, GOAL_CATEGORY, TRANSFER_CATEGORY } from '../domain/categories';
import { isCurrencyCode, type CurrencyCode } from '../domain/currencies';
import { inRange, toDateInput, type Range } from '../domain/dates';
import { isInternal } from '../domain/ledger';
import { LEGACY_GOAL_ID, looksLikeV1, migrateV1, parseV2 } from '../domain/migrate';
import { parseAmount, type Rates } from '../domain/money';
import type { AppData, Transaction, TxType, Wallet } from '../domain/types';
import { newId } from '../domain/types';
import { isNative } from './platform';

const stamp = () => toDateInput(Date.now());

/** Writes a file to the cache and opens the share sheet (Drive, Files, email…); downloads on web. */
const shareFile = async (filename: string, data: string, mime: string, base64: boolean) => {
  if (!isNative) {
    const bytes = base64 ? Uint8Array.from(atob(data), (c) => c.charCodeAt(0)) : new TextEncoder().encode(data);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const { uri } = await Filesystem.writeFile({
    path: filename,
    directory: Directory.Cache,
    data,
    ...(base64 ? {} : { encoding: Encoding.UTF8 }),
  });
  await Share.share({ title: filename, files: [uri] });
};

export const exportBackup = async (data: AppData) => {
  // Receipt files live only on this phone; keep the backup small and portable.
  const portable: AppData = {
    ...data,
    transactions: data.transactions.map(({ receipt, ...tx }) => (receipt?.startsWith('data:') ? { ...tx, receipt } : tx)),
  };
  const json = JSON.stringify({ app: 'coinflow', version: 2, exportedAt: new Date().toISOString(), data: portable });
  await shareFile(`CoinFlow-backup-${stamp()}.json`, json, 'application/json', false);
};

export type ImportResult =
  | { kind: 'replace'; data: AppData; legacyPin?: string }
  | { kind: 'merge'; wallets: Wallet[]; transactions: Transaction[] }
  | { kind: 'error'; reason: 'unreadable' | 'empty' };

export const pickFile = (accept: string): Promise<File | null> =>
  new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept });
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });

/** Reads a CoinFlow backup (v2 or v1 JSON) or a spreadsheet exported by any CoinFlow version. */
export const readImport = async (file: File, current: AppData, rates: Rates): Promise<ImportResult> => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
    return importSpreadsheet(await file.arrayBuffer(), current);
  }
  try {
    const raw = JSON.parse(await file.text());
    const v2 = parseV2(raw);
    if (v2) return { kind: 'replace', data: v2 };
    if (looksLikeV1(raw)) {
      const { data, legacyPin } = migrateV1(raw, rates);
      return { kind: 'replace', data, legacyPin };
    }
  } catch {
    /* fall through */
  }
  return { kind: 'error', reason: 'unreadable' };
};

export const exportSpreadsheet = async (data: AppData, range: Range, labels: { income: string; expense: string }) => {
  const XLSX = await import('xlsx');
  const walletOf = new Map(data.wallets.map((w) => [w.id, w]));
  const rows = data.transactions
    .filter((tx) => inRange(tx.date, range) && walletOf.has(tx.walletId))
    .sort((a, b) => a.date - b.date)
    .map((tx) => {
      const w = walletOf.get(tx.walletId)!;
      return {
        Date: new Date(tx.date),
        Type: tx.type === 'income' ? labels.income : labels.expense,
        Category: getCategory(tx.categoryId).name,
        Amount: tx.type === 'income' ? tx.amount : -tx.amount,
        Currency: w.currency,
        Wallet: w.name,
        Note: tx.note,
        Tags: tx.tags.join(', '),
        Internal: isInternal(tx) ? 'Yes' : '',
      };
    });
  const sheet = XLSX.utils.json_to_sheet(rows, { cellDates: true });
  sheet['!cols'] = [18, 10, 16, 14, 9, 18, 30, 18, 9].map((wch) => ({ wch }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Transactions');
  const base64 = XLSX.write(book, { type: 'base64', bookType: 'xlsx' });
  const name = `CoinFlow-${toDateInput(range.start)}-to-${toDateInput(range.end - 1)}.xlsx`;
  await shareFile(name, base64, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true);
};

type Row = Record<string, unknown>;
const cell = (row: Row, ...names: string[]) => {
  for (const n of names) if (row[n] !== undefined && row[n] !== '') return row[n];
  return undefined;
};

/**
 * Accepts v2 exports and v1 exports (whose "Amount (Original)" column looks like "12.5 USD").
 * Rows already present (same wallet, date, amount, type) are skipped so re-importing is harmless.
 */
const importSpreadsheet = async (buf: ArrayBuffer, current: AppData): Promise<ImportResult> => {
  const XLSX = await import('xlsx');
  let rows: Row[];
  try {
    const book = XLSX.read(buf, { cellDates: true });
    rows = XLSX.utils.sheet_to_json<Row>(book.Sheets[book.SheetNames[0]]);
  } catch {
    return { kind: 'error', reason: 'unreadable' };
  }
  const wallets: Wallet[] = [];
  const findWallet = (name: string, currency: CurrencyCode) =>
    [...current.wallets, ...wallets].find((w) => w.name === name && w.currency === currency);
  const seen = new Set(current.transactions.map((t) => `${t.walletId}|${t.date}|${t.amount}|${t.type}`));
  const transactions: Transaction[] = [];

  for (const row of rows) {
    const original = String(cell(row, 'Amount (Original)') ?? '');
    const [origAmount, origCurrency] = original.split(' ');
    const rawAmount = cell(row, 'Amount') ?? origAmount;
    let amount = typeof rawAmount === 'number' ? rawAmount : parseAmount(String(rawAmount ?? ''));
    const currencyRaw = String(cell(row, 'Currency') ?? origCurrency ?? '').toUpperCase();
    const rawDate = cell(row, 'Date');
    const date = rawDate instanceof Date ? rawDate.getTime() : new Date(String(rawDate)).getTime();
    if (!Number.isFinite(amount) || amount === 0 || !Number.isFinite(date) || !isCurrencyCode(currencyRaw)) continue;

    const typeText = String(cell(row, 'Type') ?? '').toLowerCase();
    let type: TxType = typeText.startsWith('inc') ? 'income' : 'expense';
    if (amount < 0) {
      type = 'expense';
      amount = -amount;
    } else if (cell(row, 'Amount') !== undefined && !typeText) type = 'income';

    const walletName = String(cell(row, 'Wallet') ?? 'Imported');
    let wallet = findWallet(walletName, currencyRaw);
    if (!wallet) {
      wallet = { id: newId(), name: walletName, currency: currencyRaw, color: 'slate', openingBalance: 0, createdAt: Date.now() };
      wallets.push(wallet);
    }
    const key = `${wallet.id}|${date}|${amount}|${type}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const catName = String(cell(row, 'Category') ?? 'Other');
    const categoryId = CATEGORIES.find((c) => c.name === catName && c.type === type && !c.system)?.id ?? categoryIdFromV1Name(catName, type);
    const tags = String(cell(row, 'Tags') ?? '')
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const tx: Transaction = { id: newId(), walletId: wallet.id, type, amount, categoryId, date, note: String(cell(row, 'Note') ?? ''), tags };
    // Internal rows lose their pairing in a spreadsheet; keep them out of spending totals.
    if (categoryId === GOAL_CATEGORY) tx.goalId = LEGACY_GOAL_ID;
    else if (categoryId === TRANSFER_CATEGORY || String(cell(row, 'Internal') ?? '') === 'Yes') tx.transferId = tx.id;
    transactions.push(tx);
  }
  if (transactions.length === 0) return { kind: 'error', reason: 'empty' };
  return { kind: 'merge', wallets, transactions };
};
