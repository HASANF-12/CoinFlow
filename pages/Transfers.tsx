
import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Check, X, Info, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { Wallet, Transfer, AppTab } from '../types';
import { convertCurrency, formatCurrency, EXCHANGE_RATES } from '../services/financeService';

interface TransfersProps {
  wallets: Wallet[];
  onTransfer: (t: Transfer) => void;
  setActiveTab: (tab: AppTab) => void;
}

const Transfers: React.FC<TransfersProps> = ({ wallets, onTransfer, setActiveTab }) => {
  const [from, setFrom] = useState(wallets[0]?.id || '');
  const [to, setTo] = useState(wallets[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [isManualRate, setIsManualRate] = useState(false);
  const [customRate, setCustomRate] = useState('');

  const fromWallet = wallets.find(w => w.id === from);
  const toWallet = wallets.find(w => w.id === to);

  const autoRate = fromWallet && toWallet 
    ? (EXCHANGE_RATES[toWallet.currency] / EXCHANGE_RATES[fromWallet.currency]) 
    : 1;

  const currentRate = isManualRate && customRate ? parseFloat(customRate) : autoRate;
  const convertedValue = amount ? parseFloat(amount) * currentRate : 0;
  
  const hasInsufficientFunds = fromWallet ? parseFloat(amount || '0') > fromWallet.balance : false;

  useEffect(() => {
    if (!isManualRate) setCustomRate(autoRate.toFixed(4));
  }, [from, to, isManualRate, autoRate]);

  const handleSend = () => {
    if (!fromWallet || !toWallet || !amount || hasInsufficientFunds) return;
    
    const amt = parseFloat(amount);
    onTransfer({
      id: Math.random().toString(36).substr(2, 9),
      fromWalletId: from,
      toWalletId: to,
      amount: amt,
      convertedAmount: amt * currentRate,
      exchangeRate: currentRate,
      fee: 0,
      date: Date.now(),
      note: `Move Money (${currentRate.toFixed(2)} rate)`
    });
    setAmount('');
  };

  if (wallets.length === 0) {
    return (
      <div className="py-12 animate-in fade-in zoom-in duration-500">
        <div className="glass p-10 rounded-[48px] border-white/5 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center mb-8 mx-auto border border-white/5 shadow-2xl">
               <ArrowLeftRight className="text-emerald-400" size={40} />
            </div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter mb-4">Add Wallets First</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-[200px] mx-auto uppercase font-black tracking-widest">
              You need at least two wallets to move money between them.
            </p>
            <button 
              onClick={() => setActiveTab(AppTab.WALLETS)}
              className="w-full bg-white text-slate-950 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
            >
              Go to Wallets
            </button>
          </div>
          <Sparkles className="absolute top-[-50px] left-[-50px] text-white/[0.02] rotate-12" size={240} />
        </div>
      </div>
    );
  }

  if (wallets.length < 2) {
    return (
      <div className="py-24 text-center px-12 glass rounded-[40px] border-dashed border-white/5 opacity-50 mt-12">
        <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
        <h2 className="text-white font-black text-lg italic tracking-tight">Need 2 Wallets</h2>
        <p className="text-slate-500 text-xs mt-2 uppercase font-black tracking-widest leading-relaxed">
          Create a second wallet to start moving money between them.
        </p>
        <button 
          onClick={() => setActiveTab(AppTab.WALLETS)}
          className="mt-8 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
        >
          Add Another Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white italic tracking-tighter leading-none">Move Money</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Transfer between wallets</p>
      </header>

      <div className="space-y-6">
        <div className="glass p-6 rounded-[40px] border-white/5 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">From</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-slate-950 p-5 rounded-2xl border border-white/5 text-white outline-none font-bold text-sm">
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name} • {formatCurrency(w.balance, w.currency)}</option>)}
            </select>
          </div>

          <div className="flex justify-center -my-3 relative z-10">
            <div className="p-3 glass rounded-full border-white/5 bg-slate-900 shadow-xl shadow-black">
              <ArrowLeftRight className="text-emerald-400 rotate-90" size={20} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">To</label>
            <select value={to} onChange={e => setTo(e.target.value)} className="w-full bg-slate-950 p-5 rounded-2xl border border-white/5 text-white outline-none font-bold text-sm">
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name} • {formatCurrency(w.balance, w.currency)}</option>)}
            </select>
          </div>
        </div>

        <div className="glass p-8 rounded-[40px] border-white/5 space-y-8">
          <div className="text-center">
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-4 tracking-widest">How Much?</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className={`w-full bg-transparent text-5xl font-black text-center outline-none transition-colors ${hasInsufficientFunds ? 'text-rose-500' : 'text-white'}`} 
            />
            {hasInsufficientFunds && (
              <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-4">Not enough money in this wallet</p>
            )}
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Exchange Rate</span>
              </div>
              <button 
                onClick={() => setIsManualRate(!isManualRate)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isManualRate ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
              >
                {isManualRate ? 'Custom Rate' : 'Auto Rate'}
              </button>
            </div>

            {isManualRate ? (
              <div className="space-y-2">
                <input 
                  type="number" 
                  value={customRate} 
                  onChange={e => setCustomRate(e.target.value)}
                  className="w-full bg-slate-950 p-4 rounded-xl border border-amber-500/20 text-amber-500 font-black outline-none"
                  placeholder="Type rate here..."
                />
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex justify-between items-center">
                <span className="text-xs font-bold text-white">1 {fromWallet?.currency} = {autoRate.toFixed(4)} {toWallet?.currency}</span>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-black uppercase tracking-widest">Live</span>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-950 rounded-3xl border border-white/5">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest text-center">They will receive</p>
            <p className="text-2xl font-black text-white text-center">
              {toWallet ? formatCurrency(convertedValue, toWallet.currency) : '—'}
            </p>
          </div>

          <button 
            onClick={handleSend} 
            disabled={!amount || from === to || hasInsufficientFunds} 
            className="w-full bg-emerald-500 text-slate-950 py-6 rounded-3xl font-black shadow-2xl active:scale-95 transition-all disabled:opacity-10 uppercase tracking-[0.2em] text-xs"
          >
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transfers;
