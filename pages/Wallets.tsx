
import React, { useState } from 'react';
import { Wallet as WalletIcon, Plus, X, Globe, CreditCard } from 'lucide-react';
import { formatCurrency, CURRENCY_DETAILS } from '../services/financeService';
import { Wallet, CurrencyCode } from '../types';

interface WalletsProps {
  wallets: Wallet[];
  onAddWallet: (wallet: Wallet) => void;
}

const Wallets: React.FC<WalletsProps> = ({ wallets, onAddWallet }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [curr, setCurr] = useState<CurrencyCode>('USD');

  const CURRENCIES = Object.keys(CURRENCY_DETAILS).sort() as CurrencyCode[];

  const handleAdd = () => {
    if (!name) return;
    const gradients = [
      'from-emerald-500 to-emerald-800', 
      'from-blue-600 to-indigo-900',
      'from-rose-500 to-orange-700', 
      'from-purple-600 to-violet-900',
      'from-slate-700 to-slate-900',
      'from-teal-500 to-cyan-800'
    ];
    const newWallet: Wallet = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      currency: curr,
      balance: 0,
      color: gradients[wallets.length % gradients.length]
    };
    onAddWallet(newWallet);
    setIsAdding(false);
    setName('');
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic">My Wallets</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage your accounts</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="p-4 bg-emerald-500 text-slate-950 rounded-2xl shadow-xl active:scale-90 transition-all">
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      {isAdding && (
        <div className="glass p-6 rounded-[32px] border-emerald-500/30 mb-8 animate-in slide-in-from-top-4 relative z-10 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">New Wallet</h2>
            <button onClick={() => setIsAdding(false)} className="text-slate-500 p-2"><X size={20}/></button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-600 ml-4 tracking-widest">Name</label>
              <input 
                type="text" 
                placeholder="e.g. My Savings" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-slate-900/80 p-5 rounded-[24px] outline-none text-white border border-white/5 focus:border-emerald-500/30 transition-all font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-600 ml-4 tracking-widest">Currency</label>
              <div className="relative">
                <select 
                  value={curr} 
                  onChange={e => setCurr(e.target.value as CurrencyCode)} 
                  className="w-full bg-slate-900/80 p-5 rounded-[24px] outline-none text-white border border-white/5 appearance-none font-bold text-sm"
                >
                  {CURRENCIES.map(code => (
                    <option key={code} value={code}>
                      {CURRENCY_DETAILS[code].country} — {code}
                    </option>
                  ))}
                </select>
                <Globe className="absolute right-5 top-5 text-slate-600 pointer-events-none" size={20} />
              </div>
            </div>
            <button onClick={handleAdd} className="w-full bg-emerald-500 text-slate-950 py-5 rounded-[24px] font-black shadow-2xl active:scale-95 transition-all mt-4 uppercase tracking-widest text-xs">
              Create Wallet
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {wallets.length === 0 ? (
          <div className="py-24 text-center glass rounded-[40px] border-dashed border-white/5 opacity-50">
            <WalletIcon className="mx-auto mb-4 text-slate-700" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No wallets added yet</p>
          </div>
        ) : (
          wallets.map((wallet) => (
            <div 
              key={wallet.id} 
              className={`relative aspect-[1.58/1] overflow-hidden rounded-[32px] p-6 text-white bg-gradient-to-br ${wallet.color} shadow-2xl active:scale-[0.98] transition-all border border-white/10 group max-w-sm mx-auto w-full`}
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black italic tracking-tighter leading-tight mb-0.5">{wallet.name}</h3>
                    <div className="flex items-center gap-1.5 opacity-60">
                      <CreditCard size={10} />
                      <p className="text-[9px] font-black uppercase tracking-widest">Active Account</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-white/15 backdrop-blur-2xl rounded-xl text-[10px] font-black border border-white/10">
                    {wallet.currency}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Balance</p>
                  <h2 className="text-3xl font-black tracking-tighter">
                    {formatCurrency(wallet.balance, wallet.currency)}
                  </h2>
                </div>
              </div>
              
              <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="absolute bottom-6 right-6 opacity-20">
                <Globe size={48} className="rotate-12" />
              </div>
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -rotate-6"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Wallets;
