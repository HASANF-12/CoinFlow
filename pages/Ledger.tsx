
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Filter, Search, ChevronLeft, ChevronRight, Download, Trash2, PieChart, Plus, Repeat, Tag } from 'lucide-react';
import { Wallet, Transaction, UserProfile, AppTab } from '../types';
import { formatCurrency, getCategoryIcon, filterTransactionsByDate, exportToCSV, getTopCategories } from '../services/financeService';
import AdPlaceholder from '../components/AdPlaceholder';

interface LedgerProps {
  user: UserProfile;
  transactions: Transaction[];
  wallets: Wallet[];
  onDeleteTransaction: (id: string) => void;
  setActiveTab: (tab: AppTab) => void;
}

const Ledger: React.FC<LedgerProps> = ({ user, transactions, wallets, onDeleteTransaction, setActiveTab }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const dailyTransactions = filterTransactionsByDate(transactions, selectedDate).filter(t => 
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const topCats = getTopCategories(transactions, wallets, user.baseCurrency);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic leading-none">Activity</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Past Transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(transactions)} className="p-3 glass rounded-2xl text-slate-400">
            <Download size={20} />
          </button>
          <button onClick={() => setActiveTab(AppTab.ADD)} className="p-3 bg-emerald-500 text-slate-950 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-90 transition-all">
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </header>

      <AdPlaceholder type="banner" />

      <section className="glass p-5 rounded-[32px] border-white/5 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <PieChart size={18} className="text-indigo-400" />
          <h2 className="text-white font-black text-[10px] uppercase tracking-widest">Spending Summary</h2>
        </div>
        <div className="space-y-3">
          {topCats.map(([cat, amount]) => (
            <div key={cat} className="flex items-center gap-4">
              <span className="text-[9px] font-black text-slate-500 uppercase w-20 truncate tracking-tighter">{cat}</span>
              <div className="flex-1 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (amount / 5000) * 100)}%` }} />
              </div>
              <span className="text-[10px] font-black text-white">{formatCurrency(amount, user.baseCurrency)}</span>
            </div>
          ))}
          {topCats.length === 0 && <p className="text-center text-slate-600 text-[10px] font-bold uppercase py-2">No data yet</p>}
        </div>
      </section>

      <div className="space-y-4 mb-8">
        <div className="glass p-2 rounded-2xl flex items-center gap-3 border-white/5">
          <Search size={16} className="text-slate-600 ml-3" />
          <input 
            type="text" 
            placeholder="Search notes or categories..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent flex-1 text-sm text-white outline-none py-2 placeholder:text-slate-700"
          />
        </div>

        <div className="flex items-center justify-between glass p-4 rounded-3xl border-white/5">
          <button onClick={() => changeDate(-1)} className="p-2 text-slate-500"><ChevronLeft size={24} /></button>
          <div className="flex items-center gap-3">
            <CalendarIcon size={18} className="text-emerald-500" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-white font-black outline-none text-center text-sm" />
          </div>
          <button onClick={() => changeDate(1)} className="p-2 text-slate-500"><ChevronRight size={24} /></button>
        </div>
      </div>

      <div className="space-y-4">
        {dailyTransactions.length === 0 ? (
          <div className="py-20 text-center glass rounded-[40px] border-dashed border-white/5 opacity-50">
            <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.2em]">No transactions on this day</p>
          </div>
        ) : (
          dailyTransactions.map((tx) => {
            const wallet = wallets.find(w => w.id === tx.walletId);
            const isRecurInstance = !!tx.parentId;
            return (
              <div key={tx.id} className={`glass p-5 rounded-[32px] ${isRecurInstance ? 'border-emerald-500/20' : 'border-white/5'} active:scale-[0.99] transition-all group overflow-hidden relative`}>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-xl shadow-inner relative">
                      {getCategoryIcon(tx.category)}
                      {isRecurInstance && (
                        <div className="absolute -top-1 -right-1 bg-emerald-500 p-0.5 rounded-full border border-slate-950">
                          <Repeat size={8} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-black text-sm tracking-tight">{tx.category}</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter opacity-70">
                        {wallet?.name || 'Unknown Wallet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-black text-sm tracking-tighter ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, wallet?.currency || 'USD')}
                      </p>
                    </div>
                    <button onClick={() => onDeleteTransaction(tx.id)} className="text-slate-800 hover:text-rose-500 transition-all p-2 bg-white/5 rounded-xl">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3 relative z-10">
                  {tx.note && <p className="text-xs text-slate-400 italic font-medium">"{tx.note}"</p>}
                  
                  {tx.tags && tx.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <Tag size={10} className="text-slate-600" />
                      {tx.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm">
                           {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {isRecurInstance && (
                    <div className="flex items-center gap-1.5 mt-1">
                       <Repeat size={10} className="text-emerald-500" />
                       <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Automatic Instance</span>
                    </div>
                  )}
                </div>
                
                {tx.category === 'Transfer' && (
                   <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500/30"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Ledger;
