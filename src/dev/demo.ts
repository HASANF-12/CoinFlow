// Dev-only: `?demo=v1` loads realistic data in the exact v1.0.4 storage format, so the
// upgrade path can be exercised in a browser (and store screenshots have content).
// `?demo=reset` clears everything. Never included in production builds.

const DAY = 86_400_000;

const buildV1 = () => {
  const now = Date.now();
  const tx = (id: string, walletId: string, amount: number, category: string, type: 'income' | 'expense', daysAgo: number, note = '', extra = {}) => ({
    id,
    walletId,
    amount,
    category,
    type,
    date: now - daysAgo * DAY - (id.charCodeAt(1) % 9) * 3_600_000,
    note,
    tags: [] as string[],
    isRecurring: false,
    ...extra,
  });
  const transactions = [
    tx('a1', 'w1', 2400, 'Salary', 'income', 12, 'Salary', { isRecurring: true, recurringFrequency: 'monthly' }),
    tx('a2', 'w1', 850, 'Rent', 'expense', 11, 'Apartment rent', { isRecurring: true, recurringFrequency: 'monthly' }),
    tx('a3', 'w2', 42.5, 'Food', 'expense', 0, 'Lunch with team'),
    tx('a4', 'w2', 18, 'Transport', 'expense', 0, 'Taxi'),
    tx('a5', 'w1', 64.9, 'Shopping', 'expense', 1, 'Groceries'),
    tx('a6', 'w1', 15.99, 'Entertainment', 'expense', 2, 'Netflix', { isRecurring: true, recurringFrequency: 'monthly' }),
    tx('a7', 'w2', 23, 'Food', 'expense', 2, 'Coffee & snacks'),
    tx('a8', 'w1', 120, 'Bills', 'expense', 4, 'Electricity'),
    tx('a9', 'w1', 300, 'Freelance', 'income', 5, 'Logo design'),
    tx('b1', 'w2', 35, 'Health', 'expense', 6, 'Pharmacy'),
    tx('b2', 'w1', 89, 'Shopping', 'expense', 8, 'Shoes'),
    tx('b3', 'w1', 56, 'Food', 'expense', 9, 'Dinner out'),
    tx('x1', 'w1', 200, 'Transfer', 'expense', 3, 'Move Money', { linkedTransactionId: 'x2', tags: ['transfer'] }),
    tx('x2', 'w3', 183, 'Transfer', 'income', 3, 'Move Money', { linkedTransactionId: 'x1', tags: ['transfer'] }),
    tx('g1', 'w1', 150, 'Goal Funding', 'expense', 7, 'Added to goal: New laptop', { tags: ['goal'] }),
    tx('p1', 'w1', 2300, 'Salary', 'income', 42, 'August salary'),
    tx('p2', 'w1', 850, 'Rent', 'expense', 41, 'Apartment'),
    tx('p3', 'w1', 410, 'Food', 'expense', 35, 'Groceries (month)'),
  ];
  return {
    user: { name: 'Alex', baseCurrency: 'USD', onboarded: true, notificationsEnabled: true, lastOpenDate: now - 2 * DAY, lastRecurringCheck: now - 2 * DAY },
    wallets: [
      { id: 'w1', name: 'Bank account', currency: 'USD', balance: 3120.11, color: 'from-emerald-500 to-emerald-800' },
      { id: 'w2', name: 'Cash', currency: 'USD', balance: 181.5, color: 'from-blue-600 to-indigo-900' },
      { id: 'w3', name: 'Euro savings', currency: 'EUR', balance: 1283, color: 'from-purple-600 to-violet-900' },
    ],
    transactions,
    budgets: [
      { id: 'bu1', categoryId: '1', limit: 400, period: 'monthly' },
      { id: 'bu2', categoryId: '5', limit: 150, period: 'monthly' },
      { id: 'bu3', categoryId: '11', limit: 50, period: 'monthly' },
    ],
    goals: [{ id: 'go1', name: 'New laptop', targetAmount: 1200, currentAmount: 450, deadline: new Date(now + 120 * DAY).toISOString().slice(0, 10), color: 'bg-emerald-500', currency: 'USD' }],
  };
};

export const applyDemoParam = () => {
  const mode = new URLSearchParams(location.search).get('demo');
  if (!mode) return;
  localStorage.removeItem('coinflow_v2');
  localStorage.removeItem('moneyflow_app_v1');
  if (mode === 'v1') localStorage.setItem('moneyflow_app_v1', JSON.stringify(buildV1()));
  history.replaceState(null, '', location.pathname);
};
