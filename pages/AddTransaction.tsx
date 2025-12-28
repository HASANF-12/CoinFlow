
import React, { useState } from 'react';
import { X, Check, Wallet as WalletIcon, Tag, AlignLeft, Repeat, Camera, Image as ImageIcon } from 'lucide-react';
import { Wallet, Transaction, DEFAULT_CATEGORIES } from '../types';

interface AddTransactionProps {
  wallets: Wallet[];
  onAdd: (tx: Transaction) => void;
  onCancel: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ wallets, onAdd, onCancel }) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily'|'weekly'|'monthly'|'yearly'>('monthly');

  const categories = DEFAULT_CATEGORIES.filter(c => c.type === type);

  const handleSubmit = () => {
    if (!amount || !walletId) return;
    
    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      walletId,
      amount: parseFloat(amount),
      type,
      category,
      note,
      date: Date.now(),
      tags,
      isRecurring,
      recurringFrequency: isRecurring ? frequency : undefined
    };
    onAdd(tx);
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  if (wallets.length === 0) return (
    <div className="py-20 text-center px-12">
      <h2 className="text-2xl font-black text-white mb-4 italic">No Vaults</h2>
      <button onClick={onCancel} className="bg-emerald-500 text-black px-8 py-3 rounded-2xl font-bold">Back</button>
    </div>
  );

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 pb-12">
      <header className="flex justify-between items-center mb-8">
        <button onClick={onCancel} className="p-3 glass rounded-full text-slate-400"><X size={20} /></button>
        <h1 className="text-xl font-black text-white">Log Activity</h1>
        <button onClick={handleSubmit} className="p-3 bg-emerald-500 text-slate-950 rounded-full"><Check size={20} strokeWidth={3} /></button>
      </header>

      <div className="flex p-1 glass rounded-3xl mb-8">
        <button onClick={() => setType('expense')} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${type === 'expense' ? 'bg-white text-black' : 'text-slate-500'}`}>Expense</button>
        <button onClick={() => setType('income')} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${type === 'income' ? 'bg-emerald-500 text-black' : 'text-slate-500'}`}>Income</button>
      </div>

      <div className="space-y-6">
        <div className="text-center py-4">
          <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="bg-transparent text-6xl font-black text-white text-center w-full outline-none placeholder:text-slate-900" />
        </div>

        <div className="space-y-4">
          <div className="glass p-5 rounded-[32px] border-white/5">
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-3 ml-2 tracking-widest">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c.id} onClick={() => setCategory(c.name)} className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${category === c.name ? 'bg-white text-black border-white' : 'border-white/5 text-slate-500 bg-white/5'}`}>
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-5 rounded-[32px] border-white/5">
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-3 ml-2 tracking-widest">Vault</label>
            <div className="space-y-2">
              {wallets.map(w => (
                <button key={w.id} onClick={() => setWalletId(w.id)} className={`w-full p-4 rounded-2xl flex justify-between border-2 ${walletId === w.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-transparent bg-slate-900/50 text-slate-400'}`}>
                  <span className="font-bold text-sm">{w.name}</span>
                  <span className="text-[10px] font-black uppercase opacity-60">{w.currency}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-5 rounded-[32px] border-white/5 flex items-center gap-4">
            <AlignLeft size={18} className="text-slate-600" />
            <input type="text" placeholder="Note / Description" value={note} onChange={e => setNote(e.target.value)} className="bg-transparent flex-1 text-sm text-white outline-none" />
          </div>

          <div className="glass p-5 rounded-[32px] border-white/5">
            <div className="flex items-center gap-4 mb-3">
              <Tag size={18} className="text-slate-600" />
              <input type="text" placeholder="Add tag (Press Enter)" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addTag()} className="bg-transparent flex-1 text-sm text-white outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <span key={t} className="bg-white/10 px-2 py-1 rounded-lg text-[10px] text-emerald-400 font-bold uppercase border border-white/5">{t}</span>
              ))}
            </div>
          </div>

          <div className="glass p-5 rounded-[32px] border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Repeat size={18} className="text-slate-600" />
              <span className="text-sm font-bold text-white">Recurring</span>
            </div>
            <div className="flex items-center gap-4">
              {isRecurring && (
                <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="bg-slate-900 text-[10px] p-2 rounded-lg text-emerald-400 font-black uppercase outline-none">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
              <div onClick={() => setIsRecurring(!isRecurring)} className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${isRecurring ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
          </div>

          <button className="w-full glass p-5 rounded-[32px] border-white/5 border-dashed flex items-center justify-center gap-3 text-slate-500 hover:text-white transition-all">
            <Camera size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Attach Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;
