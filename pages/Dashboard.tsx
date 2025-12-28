
import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Bell, Calendar, TrendingUp, Info, PieChart, Plus, Wallet as WalletIcon, Globe } from 'lucide-react';
import AdPlaceholder from '../components/AdPlaceholder';
import { formatCurrency, convertCurrency, getTransactionsInPeriod, getMonthlyPerformance, getTopCategories } from '../services/financeService';
import { Wallet, Transaction, UserProfile, DEFAULT_CATEGORIES, AppTab } from '../types';

interface DashboardProps {
  user: UserProfile;
  wallets: Wallet[];
  transactions: Transaction[];
  setActiveTab?: (tab: AppTab) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, wallets, transactions, setActiveTab }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  const stats = useMemo(() => {
    let totalNetWorth = 0;
    wallets.forEach(w => {
      totalNetWorth += convertCurrency(w.balance, w.currency, user.baseCurrency);
    });
    const periodTxs = getTransactionsInPeriod(transactions, period);
    let periodIncome = 0; let periodExpense = 0;
    periodTxs.forEach(t => {
      const w = wallets.find(wallet => wallet.id === t.walletId);
      if (w) {
        const val = convertCurrency(t.amount, w.currency, user.baseCurrency);
        if (t.type === 'income') periodIncome += val;
        else periodExpense += val;
      }
    });
    const monthly = getMonthlyPerformance(transactions, wallets, user.baseCurrency);
    const topCats = getTopCategories(transactions, wallets, user.baseCurrency);
    return { totalNetWorth, periodIncome, periodExpense, monthly, topCats };
  }, [wallets, transactions, period, user.baseCurrency]);

  if (wallets.length === 0) {
    return (
      <div className="pb-24 animate-in fade-in zoom-in duration-700">
        <header className="flex justify-between items-center mb-12">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Hello, {user.name.split(' ')[0]}</p>
            <h1 className="text-3xl font-black text-white mt-1 tracking-tighter italic">Welcome Back</h1>
          </div>
          <div className="w-10 h-10 glass rounded-full flex items-center justify-center border-white/5">
             <div className="w-4 h-4 rounded-full bg-emerald-500/20" />
          </div>
        </header>

        <section className="relative glass rounded-[48px] p-8 border-white/5 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent overflow-hidden shadow-2xl text-center mb-8">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center mb-6 border border-white/5 shadow-inner rotate-3">
              <WalletIcon size={48} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter mb-3 leading-tight">No accounts yet</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-[240px] mx-auto">
              Add your first wallet to start tracking your money and expenses.
            </p>
            <button 
              onClick={() => setActiveTab?.(AppTab.WALLETS)}
              className="w-full bg-emerald-500 text-slate-950 py-5 rounded-[28px] font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} strokeWidth={3} /> Create First Wallet
            </button>
          </div>
          <Globe className="absolute bottom-[-60px] left-[-40px] text-white/[0.02] -rotate-12" size={240} />
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px]"></div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass p-6 rounded-[32px] border-white/5 opacity-40 grayscale">
            <div className="w-8 h-8 rounded-lg bg-slate-800 mb-4 animate-pulse"></div>
            <div className="h-2 w-12 bg-slate-800 rounded mb-2"></div>
            <div className="h-4 w-20 bg-slate-800 rounded"></div>
          </div>
          <div className="glass p-6 rounded-[32px] border-white/5 opacity-40 grayscale">
            <div className="w-8 h-8 rounded-lg bg-slate-800 mb-4 animate-pulse"></div>
            <div className="h-2 w-12 bg-slate-800 rounded mb-2"></div>
            <div className="h-4 w-20 bg-slate-800 rounded"></div>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-[32px] border border-dashed border-white/10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Your Personal Wealth Hub</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div id="dashboard-balance">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Total Balance</p>
          <h1 className="text-4xl font-black text-white mt-2 tracking-tighter">
            {formatCurrency(stats.totalNetWorth, user.baseCurrency)}
          </h1>
        </div>
        <button className="p-3 glass rounded-2xl relative border-white/5">
          <Bell size={20} className="text-emerald-400" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
      </header>

      <section className="glass rounded-[40px] p-6 border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-white font-black text-lg">Monthly Progress</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Money Flow</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${stats.monthly.isHealthy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {stats.monthly.isHealthy ? 'Safe' : 'Tight'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Income</p>
              <p className="text-lg font-black text-emerald-400">{formatCurrency(stats.monthly.income, user.baseCurrency)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Expenses</p>
              <p className="text-lg font-black text-white">{formatCurrency(stats.monthly.expense, user.baseCurrency)}</p>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${stats.monthly.isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, (stats.monthly.income > 0 ? (stats.monthly.surplus / stats.monthly.income) * 100 : 0) + 50)}%` }} />
          </div>
        </div>
        <TrendingUp className="absolute bottom-[-40px] right-[-40px] text-white/[0.03] rotate-12" size={180} />
      </section>

      <div className="flex gap-2 p-1 glass rounded-2xl w-fit border-white/5">
        {['day', 'week', 'month'].map((p) => (
          <button key={p} onClick={() => setPeriod(p as any)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white'}`}>
            {p === 'day' ? 'Today' : p === 'week' ? 'Weekly' : 'Monthly'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-[32px] border-emerald-500/10 bg-emerald-500/5">
          <ArrowUpRight className="text-emerald-400 mb-4" size={24} />
          <p className="text-[10px] text-slate-500 uppercase font-black mb-1">In</p>
          <p className="text-lg font-black text-white truncate">{formatCurrency(stats.periodIncome, user.baseCurrency)}</p>
        </div>
        <div className="glass p-5 rounded-[32px] border-rose-500/10 bg-rose-500/5">
          <ArrowDownRight className="text-rose-400 mb-4" size={24} />
          <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Out</p>
          <p className="text-lg font-black text-white truncate">{formatCurrency(stats.periodExpense, user.baseCurrency)}</p>
        </div>
      </div>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white italic tracking-tighter">Where your money goes</h2>
          <PieChart className="text-slate-600" size={18} />
        </div>
        <div className="space-y-4">
          {stats.topCats.map(([cat, amount]) => (
            <div key={cat} className="glass p-4 rounded-2xl flex items-center gap-4 border-white/5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-lg border border-white/5">
                {DEFAULT_CATEGORIES.find(c => c.name === cat)?.icon || '❓'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-white">{cat}</span>
                  <span className="text-xs font-black text-slate-400">{formatCurrency(amount, user.baseCurrency)}</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (amount / stats.periodExpense) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
          {stats.topCats.length === 0 && <p className="text-center py-10 text-slate-600 text-xs font-bold uppercase tracking-widest">No spending recorded</p>}
        </div>
      </section>

      <AdPlaceholder type="card" />
    </div>
  );
};

export default Dashboard;
