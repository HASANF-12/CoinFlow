
import { CurrencyCode, Transaction, Wallet, Budget, Category, DEFAULT_CATEGORIES } from '../types';

export const CURRENCY_DETAILS: Record<CurrencyCode, { country: string; name: string; symbol: string }> = {
  // Africa
  DZD: { country: 'Algeria', name: 'Algerian Dinar', symbol: 'د.ج' },
  AOA: { country: 'Angola', name: 'Kwanza', symbol: 'Kz' },
  XOF: { country: 'West Africa', name: 'CFA Franc', symbol: 'CFA' },
  BWP: { country: 'Botswana', name: 'Pula', symbol: 'P' },
  BIF: { country: 'Burundi', name: 'Burundian Franc', symbol: 'FBu' },
  CVE: { country: 'Cabo Verde', name: 'Escudo', symbol: '$' },
  XAF: { country: 'Central Africa', name: 'CFA Franc', symbol: 'CFA' },
  KMF: { country: 'Comoros', name: 'Comorian Franc', symbol: 'CF' },
  CDF: { country: 'Congo (DRC)', name: 'Congolese Franc', symbol: 'FC' },
  DJF: { country: 'Djibouti', name: 'Djiboutian Franc', symbol: 'Fdj' },
  EGP: { country: 'Egypt', name: 'Egyptian Pound', symbol: '£' },
  ERN: { country: 'Eritrea', name: 'Nakfa', symbol: 'Nfk' },
  SZL: { country: 'Eswatini', name: 'Lilangeni', symbol: 'L' },
  ETB: { country: 'Ethiopia', name: 'Birr', symbol: 'Br' },
  GMD: { country: 'Gambia', name: 'Dalasi', symbol: 'D' },
  GHS: { country: 'Ghana', name: 'Ghanaian Cedi', symbol: '₵' },
  GNF: { country: 'Guinea', name: 'Guinean Franc', symbol: 'FG' },
  KES: { country: 'Kenya', name: 'Kenyan Shilling', symbol: 'KSh' },
  LSL: { country: 'Lesotho', name: 'Loti', symbol: 'L' },
  LRD: { country: 'Liberia', name: 'Liberian Dollar', symbol: '$' },
  LYD: { country: 'Libya', name: 'Libyan Dinar', symbol: 'ل.د' },
  MGA: { country: 'Madagascar', name: 'Ariary', symbol: 'Ar' },
  MWK: { country: 'Malawi', name: 'Kwacha', symbol: 'MK' },
  MRU: { country: 'Mauritania', name: 'Ouguiya', symbol: 'UM' },
  MUR: { country: 'Mauritius', name: 'Mauritian Rupee', symbol: '₨' },
  MAD: { country: 'Morocco', name: 'Moroccan Dirham', symbol: 'د.م' },
  MZN: { country: 'Mozambique', name: 'Metical', symbol: 'MT' },
  NAD: { country: 'Namibia', name: 'Namibian Dollar', symbol: '$' },
  NGN: { country: 'Nigeria', name: 'Naira', symbol: '₦' },
  RWF: { country: 'Rwanda', name: 'Rwandan Franc', symbol: 'FRw' },
  STN: { country: 'São Tomé', name: 'Dobra', symbol: 'Db' },
  SCR: { country: 'Seychelles', name: 'Seychellois Rupee', symbol: '₨' },
  SLE: { country: 'Sierra Leone', name: 'Leone', symbol: 'Le' },
  SOS: { country: 'Somalia', name: 'Somali Shilling', symbol: 'Sh' },
  ZAR: { country: 'South Africa', name: 'Rand', symbol: 'R' },
  SSP: { country: 'South Sudan', name: 'Sudanese Pound', symbol: '£' },
  SDG: { country: 'Sudan', name: 'Sudanese Pound', symbol: '£' },
  TZS: { country: 'Tanzania', name: 'Tanzanian Shilling', symbol: 'Sh' },
  TND: { country: 'Tunisia', name: 'Tunisian Dinar', symbol: 'د.ت' },
  UGX: { country: 'Uganda', name: 'Ugandan Shilling', symbol: 'Sh' },
  ZMW: { country: 'Zambia', name: 'Zambian Kwacha', symbol: 'ZK' },
  ZWG: { country: 'Zimbabwe', name: 'Zimbabwe Gold', symbol: 'Z$' },
  // Middle East
  BHD: { country: 'Bahrain', name: 'Bahraini Dinar', symbol: '.د.ب' },
  IRR: { country: 'Iran', name: 'Iranian Rial', symbol: '﷼' },
  IQD: { country: 'Iraq', name: 'Iraqi Dinar', symbol: 'د.ع' },
  USD: { country: 'USA / Ecuador', name: 'US Dollar', symbol: '$' },
  JOD: { country: 'Jordan', name: 'Jordanian Dinar', symbol: 'د.ا' },
  KWD: { country: 'Kuwait', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  LBP: { country: 'Lebanon', name: 'Lebanese Pound', symbol: 'ل.ل' },
  OMR: { country: 'Oman', name: 'Omani Rial', symbol: '﷼' },
  QAR: { country: 'Qatar', name: 'Qatari Riyal', symbol: '﷼' },
  SAR: { country: 'Saudi Arabia', name: 'Saudi Riyal', symbol: '﷼' },
  SYP: { country: 'Syria', name: 'Syrian Pound', symbol: '£' },
  AED: { country: 'UAE', name: 'UAE Dirham', symbol: 'د.إ' },
  YER: { country: 'Yemen', name: 'Yemeni Rial', symbol: '﷼' },
  // Europe
  EUR: { country: 'Eurozone', name: 'Euro', symbol: '€' },
  GBP: { country: 'UK', name: 'Pound Sterling', symbol: '£' },
  CHF: { country: 'Switzerland', name: 'Swiss Franc', symbol: 'CHF' },
  NOK: { country: 'Norway', name: 'Norwegian Krone', symbol: 'kr' },
  SEK: { country: 'Sweden', name: 'Swedish Krona', symbol: 'kr' },
  DKK: { country: 'Denmark', name: 'Danish Krone', symbol: 'kr' },
  PLN: { country: 'Poland', name: 'Złoty', symbol: 'zł' },
  CZK: { country: 'Czech Rep.', name: 'Czech Koruna', symbol: 'Kč' },
  HUF: { country: 'Hungary', name: 'Forint', symbol: 'Ft' },
  RON: { country: 'Romania', name: 'Leu', symbol: 'lei' },
  BGN: { country: 'Bulgaria', name: 'Lev', symbol: 'лв' },
  ISK: { country: 'Iceland', name: 'Króna', symbol: 'kr' },
  UAH: { country: 'Ukraine', name: 'Hryvnia', symbol: '₴' },
  RUB: { country: 'Russia', name: 'Russian Ruble', symbol: '₽' },
  RSD: { country: 'Serbia', name: 'Serbian Dinar', symbol: 'дин' },
  BAM: { country: 'Bosnia', name: 'Convertible Mark', symbol: 'KM' },
  ALL: { country: 'Albania', name: 'Lek', symbol: 'L' },
  MKD: { country: 'North Macedonia', name: 'Denar', symbol: 'ден' },
  // Americas
  CAD: { country: 'Canada', name: 'Canadian Dollar', symbol: '$' },
  MXN: { country: 'Mexico', name: 'Mexican Peso', symbol: '$' },
  BRL: { country: 'Brazil', name: 'Brazilian Real', symbol: 'R$' },
  ARS: { country: 'Argentina', name: 'Argentine Peso', symbol: '$' },
  CLP: { country: 'Chile', name: 'Chilean Peso', symbol: '$' },
  COP: { country: 'Colombia', name: 'Colombian Peso', symbol: '$' },
  PEN: { country: 'Peru', name: 'Sol', symbol: 'S/' },
  VES: { country: 'Venezuela', name: 'Bolívar', symbol: 'Bs' },
  UYU: { country: 'Uruguay', name: 'Peso Uruguayo', symbol: '$' },
  PYG: { country: 'Paraguay', name: 'Guaraní', symbol: '₲' },
  BOB: { country: 'Bolivia', name: 'Boliviano', symbol: 'Bs' },
  PAB: { country: 'Panama', name: 'Balboa', symbol: 'B/.' },
  CRC: { country: 'Costa Rica', name: 'Colón', symbol: '₡' },
  DOP: { country: 'Dominican Rep.', name: 'Peso', symbol: 'RD$' },
  JMD: { country: 'Jamaica', name: 'Jamaican Dollar', symbol: 'J$' },
  HTG: { country: 'Haiti', name: 'Gourde', symbol: 'G' },
  CUP: { country: 'Cuba', name: 'Cuban Peso', symbol: '$' },
  // Asia
  CNY: { country: 'China', name: 'Yuan Renminbi', symbol: '¥' },
  JPY: { country: 'Japan', name: 'Yen', symbol: '¥' },
  KRW: { country: 'South Korea', name: 'Won', symbol: '₩' },
  INR: { country: 'India', name: 'Indian Rupee', symbol: '₹' },
  PKR: { country: 'Pakistan', name: 'Pakistani Rupee', symbol: '₨' },
  BDT: { country: 'Bangladesh', name: 'Taka', symbol: '৳' },
  LKR: { country: 'Sri Lanka', name: 'Sri Lankan Rupee', symbol: '₨' },
  NPR: { country: 'Nepal', name: 'Nepalese Rupee', symbol: '₨' },
  THB: { country: 'Thailand', name: 'Baht', symbol: '฿' },
  VND: { country: 'Vietnam', name: 'Dong', symbol: '₫' },
  MYR: { country: 'Malaysia', name: 'Ringgit', symbol: 'RM' },
  IDR: { country: 'Indonesia', name: 'Rupiah', symbol: 'Rp' },
  PHP: { country: 'Philippines', name: 'Peso', symbol: '₱' },
  SGD: { country: 'Singapore', name: 'Singapore Dollar', symbol: '$' },
  HKD: { country: 'Hong Kong', name: 'Hong Kong Dollar', symbol: '$' },
  TWD: { country: 'Taiwan', name: 'New Taiwan Dollar', symbol: 'NT$' },
  MNT: { country: 'Mongolia', name: 'Tugrik', symbol: '₮' },
  AFN: { country: 'Afghanistan', name: 'Afghani', symbol: '؋' },
  KZT: { country: 'Kazakhstan', name: 'Tenge', symbol: '₸' },
  UZS: { country: 'Uzbekistan', name: 'Som', symbol: 'soʻm' },
  GEL: { country: 'Georgia', name: 'Lari', symbol: '₾' },
  AMD: { country: 'Armenia', name: 'Dram', symbol: '֏' },
  AZN: { country: 'Azerbaijan', name: 'Manat', symbol: '₼' },
  // Oceania
  AUD: { country: 'Australia', name: 'Australian Dollar', symbol: '$' },
  NZD: { country: 'New Zealand', name: 'New Zealand Dollar', symbol: '$' },
  FJD: { country: 'Fiji', name: 'Fijian Dollar', symbol: '$' },
  PGK: { country: 'Papua New Guinea', name: 'Kina', symbol: 'K' },
  SBD: { country: 'Solomon Islands', name: 'Dollar', symbol: '$' },
  WST: { country: 'Samoa', name: 'Tala', symbol: 'T' },
  TOP: { country: 'Tonga', name: 'Paʻanga', symbol: 'T$' },
  // Special
  XAU: { country: 'Special', name: 'Gold (Ounce)', symbol: 'XAU' },
  XAG: { country: 'Special', name: 'Silver (Ounce)', symbol: 'XAG' },
  XDR: { country: 'International', name: 'IMF SDR', symbol: 'XDR' },
  XPF: { country: 'Oceania', name: 'CFP Franc', symbol: 'XPF' },
  XCD: { country: 'Caribbean', name: 'East Caribbean Dollar', symbol: 'XCD' },
  BTC: { country: 'Crypto', name: 'Bitcoin', symbol: '₿' },
  ETH: { country: 'Crypto', name: 'Ethereum', symbol: 'Ξ' },
  SOL: { country: 'Crypto', name: 'Solana', symbol: 'SOL' },
  USDT: { country: 'Crypto', name: 'Tether', symbol: '₮' }
};

export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  // Base USD = 1 (Approximated Live Rates)
  USD: 1, DZD: 134, AOA: 830, XOF: 605, BWP: 13.5, BIF: 2850, CVE: 102, XAF: 605, KMF: 454, CDF: 2750, DJF: 177, EGP: 47.8,
  ERN: 15, SZL: 18.7, ETB: 56.5, GMD: 67, GHS: 13.2, GNF: 8600, KES: 131, LSL: 18.7, LRD: 191, LYD: 4.82, MGA: 4450, MWK: 1680,
  MRU: 39.5, MUR: 46, MAD: 10.1, MZN: 63.8, NAD: 18.7, NGN: 1450, RWF: 1280, STN: 22.5, SCR: 13.5, SLE: 22.5, SOS: 570, ZAR: 18.7,
  SSP: 1050, SDG: 600, TZS: 2570, TND: 3.12, UGX: 3820, ZMW: 24.8, ZWG: 13.5, BHD: 0.37, IRR: 42000, IQD: 1310, JOD: 0.71,
  KWD: 0.31, LBP: 89500, OMR: 0.38, QAR: 3.64, SAR: 3.75, SYP: 13000, AED: 3.67, YER: 250, EUR: 0.92, GBP: 0.79, CHF: 0.91,
  NOK: 10.8, SEK: 10.6, DKK: 6.9, PLN: 3.98, CZK: 23.4, HUF: 365, RON: 4.6, BGN: 1.81, ISK: 140, UAH: 39.2, RUB: 92.5, RSD: 108,
  BAM: 1.8, ALL: 94, MKD: 56.5, CAD: 1.36, MXN: 16.5, BRL: 5.08, ARS: 865, CLP: 942, COP: 3820, PEN: 3.71, VES: 36.3, UYU: 38.5,
  PYG: 7350, BOB: 6.9, PAB: 1, CRC: 505, DOP: 59, JMD: 155, HTG: 132, CUP: 24, CNY: 7.23, JPY: 152, KRW: 1350, INR: 83.3,
  PKR: 278, BDT: 110, LKR: 298, NPR: 133, THB: 36.6, VND: 24900, MYR: 4.75, IDR: 15900, PHP: 56.3, SGD: 1.35, HKD: 7.83,
  TWD: 32.2, MNT: 3380, AFN: 71, KZT: 447, UZS: 12600, GEL: 2.68, AMD: 395, AZN: 1.7, AUD: 1.52, NZD: 1.66, FJD: 2.25,
  PGK: 3.8, SBD: 8.5, WST: 2.75, TOP: 2.38, XAU: 0.00042, XAG: 0.035, XDR: 0.75, XPF: 110, XCD: 2.7, BTC: 0.000015,
  ETH: 0.00028, SOL: 0.0058, USDT: 1
};

export const convertCurrency = (amount: number, from: CurrencyCode, to: CurrencyCode): number => {
  const fromRate = EXCHANGE_RATES[from] || 1;
  const toRate = EXCHANGE_RATES[to] || 1;
  return (amount / fromRate) * toRate;
};

export const formatCurrency = (amount: number, code: CurrencyCode): string => {
  const details = CURRENCY_DETAILS[code];
  const isCrypto = ['BTC', 'ETH', 'SOL', 'XAU', 'XAG'].includes(code);
  try {
    return new Intl.NumberFormat('en-US', {
      style: isCrypto ? 'decimal' : 'currency',
      currency: isCrypto ? 'USD' : (details?.symbol ? 'USD' : code), // Fallback logic
      minimumFractionDigits: isCrypto ? 6 : 2,
      maximumFractionDigits: isCrypto ? 8 : 2
    }).format(amount).replace('$', details?.symbol || '$') + (isCrypto ? ` ${code}` : '');
  } catch (e) {
    return `${details?.symbol || ''}${amount.toFixed(2)} ${code}`;
  }
};

export const getCategoryIcon = (categoryName: string): string => {
  return DEFAULT_CATEGORIES.find(c => c.name === categoryName)?.icon || '📦';
};

export const getTransactionsInPeriod = (transactions: Transaction[], period: 'day' | 'week' | 'month' | 'year'): Transaction[] => {
  const now = new Date();
  const start = new Date();
  if (period === 'day') start.setHours(0,0,0,0);
  else if (period === 'week') start.setDate(now.getDate() - 7);
  else if (period === 'month') start.setMonth(now.getMonth() - 1);
  else if (period === 'year') start.setFullYear(now.getFullYear() - 1);
  return transactions.filter(t => t.date >= start.getTime());
};

export const getMonthlyPerformance = (transactions: Transaction[], wallets: Wallet[], baseCurrency: CurrencyCode) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthTxs = transactions.filter(t => t.date >= startOfMonth);
  let income = 0; let expense = 0;
  monthTxs.forEach(t => {
    const w = wallets.find(wal => wal.id === t.walletId);
    const val = convertCurrency(t.amount, w?.currency || 'USD', baseCurrency);
    if (t.type === 'income') income += val;
    else expense += val;
  });
  const surplus = income - expense;
  return { income, expense, surplus, isHealthy: surplus >= 0, savingsRate: income > 0 ? (surplus / income) * 100 : 0 };
};

export const filterTransactionsByDate = (transactions: Transaction[], dateStr: string): Transaction[] => {
  const targetDate = new Date(dateStr).setHours(0, 0, 0, 0);
  return transactions.filter(t => new Date(t.date).setHours(0, 0, 0, 0) === targetDate);
};

export const getTopCategories = (transactions: Transaction[], wallets: Wallet[], baseCurrency: CurrencyCode) => {
  const summary: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const w = wallets.find(wal => wal.id === t.walletId);
    const amountInBase = convertCurrency(t.amount, w?.currency || 'USD', baseCurrency);
    summary[t.category] = (summary[t.category] || 0) + amountInBase;
  });
  return Object.entries(summary).sort((a, b) => b[1] - a[1]).slice(0, 5);
};

export const getBudgetStatus = (transactions: Transaction[], budgets: Budget[], wallets: Wallet[], baseCurrency: CurrencyCode) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthTxs = transactions.filter(t => t.date >= startOfMonth && t.type === 'expense');
  return budgets.map(b => {
    const category = DEFAULT_CATEGORIES.find(c => c.id === b.categoryId);
    const categoryName = category?.name || 'Other';
    const spent = monthTxs.filter(t => t.category === categoryName).reduce((sum, t) => {
      const w = wallets.find(wal => wal.id === t.walletId);
      return sum + convertCurrency(t.amount, w?.currency || 'USD', baseCurrency);
    }, 0);
    return { ...b, spent, categoryName, icon: category?.icon || '📦', percentage: (spent / b.limit) * 100 };
  });
};

export const exportToCSV = (transactions: Transaction[]) => {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Note', 'Tags'];
  const rows = transactions.map(t => [new Date(t.date).toLocaleString(), t.type, t.category, t.amount, t.note, t.tags.join(';')]);
  const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `coinflow_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
