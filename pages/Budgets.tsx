
import React, { useState } from 'react';
import { Plus, AlertCircle, Target, ArrowRight } from 'lucide-react';
import { Wallet, Transaction, UserProfile, Budget, DEFAULT_CATEGORIES } from '../types';
import { getBudgetStatus, formatCurrency } from '../services/financeService';

interface BudgetsProps {
  user: UserProfile;
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: Budget[];
  onAddBudget: (b: Budget) => void;
}

const Budgets: React.FC<BudgetsProps> = ({ user, transactions, wallets, budgets, onAddBudget }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCat, setNewCat] = useState(DEFAULT_CATEGORIES[0].id);
  const [newLimit, setNewLimit] = useState('');

  const status = getBudgetStatus(transactions, budgets, wallets, user.baseCurrency);

  const handleSave = () => {
    if (!newLimit) return;
    onAddBudget({
      id: Math.random().toString(36).substr(2, 9),
      categoryId: newCat,
      limit: parseFloat(newLimit),
      period: 'monthly'
    });
    setIsAdding(false);
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-white tracking-tighter">Planning</h1>
        <button onClick={() => setIsAdding(true)} className="p-3 bg-emerald-500 text-slate-950 rounded-2xl shadow-lg">
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      {isAdding && (
        <div className="glass p-6 rounded-[32px] border-emerald-500/30 mb-8">
          <h2 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">New Budget Limit</h2>
          <div className="space-y-4">
            <select 
              value={newCat} 
              onChange={e => setNewCat(e.target.value)}
              className="w-full bg-slate-900 p-4 rounded-2xl text-white outline-none border border-white/5"
            >
              {DEFAULT_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <input 
              type="number" 
              placeholder="Limit Amount"
              value={newLimit}
              onChange={e => setNewLimit(e.target.value)}
              className="w-full bg-slate-900 p-4 rounded-2xl text-white outline-none border border-white/5"
            />
            <button onClick={handleSave} className="w-full bg-emerald-500 text-slate-950 py-4 rounded-2xl font-black">
              Set Limit
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {status.length === 0 ? (
          <div className="py-20 text-center glass rounded-[40px] border-dashed border-white/5">
            <Target className="text-slate-800 mx-auto mb-4" size={40} />
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest px-12">No budgets set. Control your spending by setting limits.</p>
          </div>
        ) : (
          status.map(b => (
            <div key={b.id} className="glass p-5 rounded-[32px] border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-lg">
                    {DEFAULT_CATEGORIES.find(c => c.id === b.categoryId)?.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{b.categoryName}</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Monthly Budget</p>
                  </div>
                </div>
                {b.percentage >= 80 && (
                  <div className="flex items-center gap-1 text-rose-400">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Warning</span>
                  </div>
                )}
              </div>
              
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full transition-all duration-1000 ${b.percentage >= 100 ? 'bg-rose-500' : b.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {formatCurrency(b.spent, user.baseCurrency)} / {formatCurrency(b.limit, user.baseCurrency)}
                </p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${b.percentage >= 100 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {Math.round(b.percentage)}% Spent
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 glass p-6 rounded-[32px] bg-gradient-to-br from-emerald-500/5 to-transparent border-white/5">
        <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">Financial Health</h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          Tracking your budgets manually helps build strong financial awareness. Keep logging your daily expenses to stay on top of your monthly goals.
        </p>
      </div>
    </div>
  );
};

export default Budgets;
