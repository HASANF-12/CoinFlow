
import React, { useState } from 'react';
import { Target, Trophy, ChevronRight, Plus, X, ArrowUpRight, Wallet as WalletIcon, Sparkles } from 'lucide-react';
import { Goal, Wallet, CurrencyCode, AppTab } from '../types';
import { formatCurrency, CURRENCY_DETAILS } from '../services/financeService';

interface GoalsProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  wallets: Wallet[];
  onFund: (goalId: string, amount: number, walletId: string) => void;
  setActiveTab: (tab: AppTab) => void;
}

const Goals: React.FC<GoalsProps> = ({ goals, setGoals, wallets, onFund, setActiveTab }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isFunding, setIsFunding] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [goalCurr, setGoalCurr] = useState<CurrencyCode>('USD');

  const [fundAmount, setFundAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');

  const handleAddGoal = () => {
    if (!name || !target) return;
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-rose-500'];
    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      targetAmount: parseFloat(target),
      currentAmount: 0,
      deadline,
      currency: goalCurr,
      color: colors[goals.length % colors.length]
    };
    setGoals([...goals, newGoal]);
    setIsAdding(false);
    setName(''); setTarget(''); setDeadline('');
  };

  const handleFundingSubmit = () => {
    if (!isFunding || !fundAmount || !selectedWalletId) return;
    const amt = parseFloat(fundAmount);
    onFund(isFunding, amt, selectedWalletId);
    setIsFunding(null);
    setFundAmount('');
  };

  if (wallets.length === 0) {
    return (
      <div className="py-12 animate-in fade-in zoom-in duration-500">
        <div className="glass p-10 rounded-[48px] border-white/5 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center mb-8 mx-auto border border-white/5 shadow-2xl">
               <Sparkles className="text-emerald-400" size={40} />
            </div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter mb-4">Add a Wallet First</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-[200px] mx-auto uppercase font-black tracking-widest">
              You need a wallet with some money before you can start saving for goals.
            </p>
            <button 
              onClick={() => setActiveTab(AppTab.WALLETS)}
              className="w-full bg-white text-slate-950 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
            >
              Add First Wallet
            </button>
          </div>
          <Target className="absolute bottom-[-50px] right-[-50px] text-white/[0.02] -rotate-12" size={240} />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter leading-none">My Goals</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">What are you saving for?</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="p-4 bg-emerald-500 text-slate-950 rounded-2xl shadow-xl active:scale-90 transition-all">
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      {isAdding && (
        <div className="glass p-6 rounded-[40px] border-emerald-500/30 mb-8 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-black text-xs uppercase tracking-widest">Add New Goal</h2>
            <button onClick={() => setIsAdding(false)} className="text-slate-500"><X size={20}/></button>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="Goal Name (e.g. New Car)" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 p-4 rounded-2xl border border-white/5 text-white font-bold outline-none" />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="How much?" value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-slate-900 p-4 rounded-2xl border border-white/5 text-white font-bold outline-none" />
              <select value={goalCurr} onChange={e => setGoalCurr(e.target.value as CurrencyCode)} className="w-full bg-slate-900 p-4 rounded-2xl border border-white/5 text-white font-bold outline-none">
                {Object.keys(CURRENCY_DETAILS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-slate-900 p-4 rounded-2xl border border-white/5 text-white font-bold outline-none" />
            <button onClick={handleAddGoal} className="w-full bg-emerald-500 text-slate-950 py-4 rounded-2xl font-black shadow-2xl uppercase tracking-widest text-xs">Create Goal</button>
          </div>
        </div>
      )}

      {isFunding && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass w-full max-w-sm p-8 rounded-[40px] border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-black text-xs uppercase tracking-widest">Add Money to Goal</h2>
              <button onClick={() => setIsFunding(null)} className="text-slate-500"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 ml-1 tracking-widest">Use money from</label>
                <select value={selectedWalletId} onChange={e => setSelectedWalletId(e.target.value)} className="w-full bg-slate-900 p-4 rounded-2xl border border-white/5 text-white font-bold outline-none">
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance, w.currency)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 ml-1 tracking-widest">Amount</label>
                <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-900 p-5 rounded-2xl border border-white/5 text-white font-black text-2xl outline-none" />
              </div>
              <button onClick={handleFundingSubmit} className="w-full bg-emerald-500 text-slate-950 py-5 rounded-2xl font-black shadow-2xl uppercase tracking-widest">Add Funds</button>
            </div>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="py-24 text-center glass rounded-[40px] border-dashed border-white/5 opacity-50">
          <Target className="mx-auto mb-4 text-slate-700" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No goals set yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => {
            const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            return (
              <div key={goal.id} className="glass p-6 rounded-[32px] border-white/5 group relative overflow-hidden transition-all active:scale-[0.98]">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${goal.color} flex items-center justify-center shadow-lg`}>
                      <Trophy size={24} className="text-slate-950" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{goal.name}</h3>
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Target: {formatCurrency(goal.targetAmount, goal.currency)}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsFunding(goal.id)} className="p-3 glass rounded-xl text-emerald-400 border-white/5 hover:bg-emerald-500/10">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full ${goal.color} transition-all duration-1000 ease-out rounded-full`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(progress)}% Finished</span>
                    <span className="text-sm font-black text-white">{formatCurrency(goal.currentAmount, goal.currency)}</span>
                  </div>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Goals;
