
export enum AppTab {
  DASHBOARD = 'dashboard',
  WALLETS = 'wallets',
  ADD = 'add',
  BUDGETS = 'budgets',
  LEDGER = 'ledger',
  TRANSFERS = 'transfers',
  GOALS = 'goals'
}

export type CurrencyCode = 
  | 'DZD' | 'AOA' | 'XOF' | 'BWP' | 'BIF' | 'CVE' | 'XAF' | 'KMF' | 'CDF' | 'DJF' | 'EGP' | 'ERN' 
  | 'SZL' | 'ETB' | 'GMD' | 'GHS' | 'GNF' | 'KES' | 'LSL' | 'LRD' | 'LYD' | 'MGA' | 'MWK' | 'MRU' 
  | 'MUR' | 'MAD' | 'MZN' | 'NAD' | 'NGN' | 'RWF' | 'STN' | 'SCR' | 'SLE' | 'SOS' | 'ZAR' | 'SSP' 
  | 'SDG' | 'TZS' | 'TND' | 'UGX' | 'ZMW' | 'ZWG'
  | 'BHD' | 'IRR' | 'IQD' | 'USD' | 'JOD' | 'KWD' | 'LBP' | 'OMR' | 'QAR' | 'SAR' | 'SYP' | 'AED' | 'YER'
  | 'EUR' | 'GBP' | 'CHF' | 'NOK' | 'SEK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RON' | 'BGN' | 'ISK' | 'UAH' | 'RUB' | 'RSD' | 'BAM' | 'ALL' | 'MKD'
  | 'CAD' | 'MXN' | 'BRL' | 'ARS' | 'CLP' | 'COP' | 'PEN' | 'VES' | 'UYU' | 'PYG' | 'BOB' | 'PAB' | 'CRC' | 'DOP' | 'JMD' | 'HTG' | 'CUP'
  | 'CNY' | 'JPY' | 'KRW' | 'INR' | 'PKR' | 'BDT' | 'LKR' | 'NPR' | 'THB' | 'VND' | 'MYR' | 'IDR' | 'PHP' | 'SGD' | 'HKD' | 'TWD' | 'MNT' | 'AFN' | 'KZT' | 'UZS' | 'GEL' | 'AMD' | 'AZN'
  | 'AUD' | 'NZD' | 'FJD' | 'PGK' | 'SBD' | 'WST' | 'TOP'
  | 'XAU' | 'XAG' | 'XDR' | 'XPF' | 'XCD' | 'BTC' | 'ETH' | 'SOL' | 'USDT';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
  color: string;
  enabled: boolean;
}

export interface Wallet {
  id: string;
  name: string;
  currency: CurrencyCode;
  balance: number;
  color: string;
  isCustom?: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  period: 'monthly';
  walletId?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  currency: CurrencyCode;
}

export interface Transfer {
  id: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  convertedAmount: number;
  fee: number;
  date: number;
  note: string;
  exchangeRate: number;
}

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: number;
  note: string;
  tags: string[];
  receipt?: string; 
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  parentId?: string; // Tracks the original template transaction
}

export interface UserProfile {
  name: string;
  baseCurrency: CurrencyCode;
  onboarded: boolean;
  securityPin?: string;
  notificationsEnabled: boolean;
  lastOpenDate: number;
  lastRecurringCheck: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Expenses
  { id: '1', name: 'Food', icon: '🍔', type: 'expense', color: '#f87171', enabled: true },
  { id: '2', name: 'Rent', icon: '🏠', type: 'expense', color: '#fbbf24', enabled: true },
  { id: '3', name: 'Transport', icon: '🚗', type: 'expense', color: '#34d399', enabled: true },
  { id: '5', name: 'Shopping', icon: '🛍️', type: 'expense', color: '#818cf8', enabled: true },
  { id: '6', name: 'Bills', icon: '📄', type: 'expense', color: '#60a5fa', enabled: true },
  { id: '7', name: 'Health', icon: '💊', type: 'expense', color: '#f472b6', enabled: true },
  { id: '10', name: 'Travel', icon: '✈️', type: 'expense', color: '#38bdf8', enabled: true },
  { id: '11', name: 'Entertainment', icon: '🎬', type: 'expense', color: '#a78bfa', enabled: true },
  { id: '12', name: 'Education', icon: '📚', type: 'expense', color: '#fb923c', enabled: true },
  { id: '13', name: 'Utilities', icon: '💡', type: 'expense', color: '#facc15', enabled: true },
  { id: '14', name: 'Gifts', icon: '🎁', type: 'expense', color: '#ec4899', enabled: true },
  { id: '9', name: 'Goal Funding', icon: '🎯', type: 'expense', color: '#10b981', enabled: true },
  { id: 'exp-other', name: 'Other', icon: '❓', type: 'expense', color: '#94a3b8', enabled: true },
  
  // Income
  { id: '4', name: 'Salary', icon: '💰', type: 'income', color: '#10b981', enabled: true },
  { id: '8', name: 'Investments', icon: '📈', type: 'income', color: '#a78bfa', enabled: true },
  { id: '15', name: 'Freelance', icon: '💻', type: 'income', color: '#0ea5e9', enabled: true },
  { id: '16', name: 'Refund', icon: '🔄', type: 'income', color: '#94a3b8', enabled: true },
  { id: '17', name: 'Business', icon: '🏢', type: 'income', color: '#6366f1', enabled: true },
  { id: 'inc-other', name: 'Other', icon: '❓', type: 'income', color: '#94a3b8', enabled: true },
];

export const STORAGE_KEY = 'moneyflow_app_v1';
