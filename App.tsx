
import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import WalletsPage from './pages/Wallets';
import Ledger from './pages/Ledger';
import AddTransaction from './pages/AddTransaction';
import BudgetsPage from './pages/Budgets';
import TransfersPage from './pages/Transfers';
import GoalsPage from './pages/Goals';
import SecurityLock from './pages/SecurityLock';
import VisualTour from './components/VisualTour';
import NotificationPrompt from './components/NotificationPrompt';
import { AppTab, Wallet, Transaction, UserProfile, STORAGE_KEY, CurrencyCode, Budget, Transfer, Goal, DEFAULT_CATEGORIES } from './types';
import { ArrowRight, Coins, ShieldCheck, Globe, Lock, Key, AlertCircle, Check } from 'lucide-react';
import AdPlaceholder from './components/AdPlaceholder';
import { CURRENCY_DETAILS, getBudgetStatus } from './services/financeService';
import { checkBudgetAlerts, checkGoalMilestones, sendNotification, notifyRecurringProcessed, notifyDormancy } from './services/notificationService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Load state from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed.user);
      setWallets(parsed.wallets || []);
      setTransactions(parsed.transactions || []);
      setBudgets(parsed.budgets || []);
      setGoals(parsed.goals || []);
      
      if (parsed.user?.securityPin) {
        setIsLocked(true);
      }
    }
    setIsInitialized(true);
  }, []);

  // Sync state to local storage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, wallets, transactions, budgets, goals }));
    }
  }, [user, wallets, transactions, budgets, goals, isInitialized]);

  // Recurring Transaction Engine & Dormancy Check
  useEffect(() => {
    if (!isInitialized || !user || !user.onboarded) return;

    const now = Date.now();
    const lastCheck = user.lastRecurringCheck || now;
    const lastOpen = user.lastOpenDate || now;
    
    // 1. Dormancy Check (2 days = 172800000ms)
    if (user.notificationsEnabled && now - lastOpen > 172800000) {
      notifyDormancy(user.name);
    }

    // 2. Process Recurring Transactions
    let newTxCount = 0;
    const updatedTransactions = [...transactions];
    const updatedWallets = [...wallets];

    // We only process original templates (recurring transactions with no parentId)
    const recurringTemplates = transactions.filter(t => t.isRecurring && !t.parentId);

    recurringTemplates.forEach(template => {
      let nextDate = template.date;
      const interval = getIntervalMs(template.recurringFrequency || 'monthly');

      // Skip forward to the first occurrence after lastCheck
      while (nextDate + interval <= now) {
        nextDate += interval;
        if (nextDate > lastCheck) {
          // Create a new instance
          const newInstance: Transaction = {
            ...template,
            id: Math.random().toString(36).substr(2, 9),
            date: nextDate,
            parentId: template.id,
            isRecurring: false // The instance itself isn't a template
          };
          updatedTransactions.unshift(newInstance);
          newTxCount++;

          // Apply to wallet
          const walletIdx = updatedWallets.findIndex(w => w.id === template.walletId);
          if (walletIdx !== -1) {
            const w = updatedWallets[walletIdx];
            updatedWallets[walletIdx] = {
              ...w,
              balance: template.type === 'income' ? w.balance + template.amount : w.balance - template.amount
            };
          }
        }
      }
    });

    if (newTxCount > 0) {
      setTransactions(updatedTransactions);
      setWallets(updatedWallets);
      if (user.notificationsEnabled) {
        notifyRecurringProcessed(newTxCount);
      }
    }

    // Update session tracking
    setUser(prev => prev ? { ...prev, lastOpenDate: now, lastRecurringCheck: now } : null);

  }, [isInitialized]);

  const getIntervalMs = (freq: string): number => {
    const day = 24 * 60 * 60 * 1000;
    switch (freq) {
      case 'daily': return day;
      case 'weekly': return day * 7;
      case 'monthly': return day * 30; // Approximation
      case 'yearly': return day * 365;
      default: return day * 30;
    }
  };

  const handleOnboarding = (name: string, currency: CurrencyCode, pin: string) => {
    setUser({ 
      name, 
      baseCurrency: currency, 
      onboarded: true, 
      securityPin: pin, 
      notificationsEnabled: false,
      lastOpenDate: Date.now(),
      lastRecurringCheck: Date.now()
    });
    setIsLocked(false);
    setTimeout(() => {
      setIsTourActive(true);
      setShowNotificationPrompt(true);
    }, 500);
  };

  const addWallet = (newWallet: Wallet) => {
    setWallets([...wallets, newWallet]);
    setShowInterstitial(true);
  };

  const addTransaction = (tx: Transaction) => {
    const updatedTransactions = [tx, ...transactions];
    setTransactions(updatedTransactions);
    
    setWallets(prev => prev.map(w => {
      if (w.id === tx.walletId) {
        const newBalance = tx.type === 'income' ? w.balance + tx.amount : w.balance - tx.amount;
        return { ...w, balance: newBalance };
      }
      return w;
    }));

    if (user?.notificationsEnabled && tx.type === 'expense') {
      const status = getBudgetStatus(updatedTransactions, budgets, wallets, user.baseCurrency);
      const budget = status.find(b => b.categoryName === tx.category);
      if (budget) {
        checkBudgetAlerts(budget.categoryName, budget.spent, budget.limit);
      }
    }

    if (Math.random() > 0.3) setTimeout(() => setShowInterstitial(true), 300);
    setActiveTab(AppTab.DASHBOARD);
  };

  const updateGoal = (goalId: string, contribution: number, walletId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newAmount = goal.currentAmount + contribution;
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: newAmount } : g));
    
    if (user?.notificationsEnabled) {
      checkGoalMilestones(goal.name, newAmount, goal.targetAmount);
    }

    addTransaction({
      id: Math.random().toString(36).substr(2, 9),
      walletId,
      amount: contribution,
      type: 'expense',
      category: 'Goal Funding',
      date: Date.now(),
      note: `Added to goal: ${goal.name}`,
      tags: ['goal'],
      isRecurring: false
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.DASHBOARD:
        return <Dashboard user={user!} wallets={wallets} transactions={transactions} setActiveTab={setActiveTab} />;
      case AppTab.WALLETS:
        return <WalletsPage wallets={wallets} onAddWallet={addWallet} />;
      case AppTab.ADD:
        return <AddTransaction wallets={wallets} onAdd={addTransaction} onCancel={() => setActiveTab(AppTab.DASHBOARD)} />;
      case AppTab.BUDGETS:
        return <BudgetsPage user={user!} transactions={transactions} wallets={wallets} budgets={budgets} onAddBudget={(b) => setBudgets([...budgets, b])} />;
      case AppTab.LEDGER:
        return <Ledger user={user!} transactions={transactions} wallets={wallets} onDeleteTransaction={(id) => setTransactions(transactions.filter(t => t.id !== id))} setActiveTab={setActiveTab} />;
      case AppTab.TRANSFERS:
        return <TransfersPage wallets={wallets} onTransfer={(t) => addTransaction({
           id: t.id,
           walletId: t.fromWalletId,
           amount: t.amount,
           type: 'expense',
           category: 'Transfer',
           date: t.date,
           note: t.note,
           tags: ['transfer'],
           isRecurring: false
        })} setActiveTab={setActiveTab} />;
      case AppTab.GOALS:
        return <GoalsPage goals={goals} setGoals={setGoals} wallets={wallets} onFund={updateGoal} setActiveTab={setActiveTab} />;
      default:
        return <Dashboard user={user!} wallets={wallets} transactions={transactions} setActiveTab={setActiveTab} />;
    }
  };

  if (!isInitialized) return null;
  if (isLocked && user?.securityPin) return <SecurityLock correctPin={user.securityPin} onUnlock={() => setIsLocked(false)} />;
  if (!user || !user.onboarded) return <Onboarding onComplete={handleOnboarding} />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {isTourActive && (
        <VisualTour 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onComplete={() => setIsTourActive(false)} 
        />
      )}

      {showNotificationPrompt && (
        <NotificationPrompt 
          onAccept={() => {
            setUser(prev => prev ? { ...prev, notificationsEnabled: true } : null);
            setShowNotificationPrompt(false);
          }}
          onDecline={() => {
            setShowNotificationPrompt(false);
          }}
        />
      )}
      
      <main className="w-full max-w-lg mx-auto px-6 pt-12 pb-32 min-h-screen relative">
        <div id="top-actions" className="flex justify-center gap-4 mb-8">
           <button 
              id="top-nav-transfers"
              onClick={() => setActiveTab(AppTab.TRANSFERS)} 
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest glass border-white/5 transition-all ${activeTab === AppTab.TRANSFERS ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300'}`}
           >
              Transfers
           </button>
           <button 
              id="top-nav-goals"
              onClick={() => setActiveTab(AppTab.GOALS)} 
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest glass border-white/5 transition-all ${activeTab === AppTab.GOALS ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}
           >
              Goals
           </button>
        </div>
        {renderContent()}
      </main>
      {showInterstitial && <AdPlaceholder type="interstitial" onClose={() => setShowInterstitial(false)} />}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="fixed top-[-10%] left-[-10%] w-[80%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
    </div>
  );
};

const Onboarding: React.FC<{ onComplete: (name: string, currency: CurrencyCode, pin: string) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [curr, setCurr] = useState<CurrencyCode>('USD');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);

  const CURRENCIES = Object.keys(CURRENCY_DETAILS).sort() as CurrencyCode[];

  const handlePinInput = (val: string) => {
    if (step === 2) {
      if (pin.length < 4) setPin(pin + val);
    } else if (step === 3) {
      if (confirmPin.length < 4) setConfirmPin(confirmPin + val);
    }
  };

  const handlePinDelete = () => {
    if (step === 2) setPin(pin.slice(0, -1));
    else if (step === 3) setConfirmPin(confirmPin.slice(0, -1));
  };

  useEffect(() => {
    if (step === 3 && confirmPin.length === 4) {
      if (confirmPin !== pin) {
        setError(true);
        setTimeout(() => {
          setConfirmPin('');
          setError(false);
        }, 800);
      }
    }
  }, [confirmPin, step, pin]);

  const isMatched = step === 3 && confirmPin === pin && pin.length === 4;

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xs text-center animate-in fade-in zoom-in duration-1000">
        {step === 1 && (
          <>
            <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-8 rotate-12 mx-auto border border-emerald-500/10 shadow-2xl">
              <Coins size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter italic">CoinFlow</h1>
            <p className="text-slate-500 mb-12 text-sm leading-relaxed font-medium">Simple money tracking for everyone.</p>
            <div className="space-y-6 text-left">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-600 ml-5 mb-2 block tracking-widest">What's your name?</label>
                <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="w-full glass p-5 rounded-[28px] text-white outline-none focus:border-emerald-500/50 border border-white/5 shadow-2xl font-bold" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black text-slate-600 ml-5 mb-2 block tracking-widest">Your Main Currency</label>
                <div className="relative">
                  <select 
                    value={curr} 
                    onChange={e => setCurr(e.target.value as CurrencyCode)} 
                    className="w-full glass p-5 rounded-[28px] text-white outline-none border border-white/5 appearance-none pr-12 font-bold text-sm"
                  >
                    {CURRENCIES.map(code => {
                      const detail = CURRENCY_DETAILS[code];
                      return (
                        <option key={code} value={code}>
                          {detail.country} — {code}
                        </option>
                      );
                    })}
                  </select>
                  <Globe className="absolute right-6 top-5 text-slate-600 pointer-events-none" size={20} />
                </div>
              </div>
              <button onClick={() => name && setStep(2)} disabled={!name} className="w-full bg-emerald-500 text-black py-5 rounded-[28px] font-black text-lg mt-8 shadow-2xl active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2 uppercase tracking-tighter">
                Set Security PIN <ArrowRight size={20} />
              </button>
            </div>
          </>
        )}

        {(step === 2 || step === 3) && (
          <div className="animate-in slide-in-from-right duration-500">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/10 shadow-lg">
              <Lock size={32} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter">
              {step === 2 ? 'Create a PIN' : 'Confirm PIN'}
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 mb-10">
              {step === 2 ? 'Choose 4 digits to keep it safe' : 'Type it again to make sure'}
            </p>

            <div className={`flex justify-center gap-4 mb-12 ${error ? 'animate-bounce' : ''}`}>
              {[0, 1, 2, 3].map((i) => {
                const isFilled = step === 2 ? pin.length > i : confirmPin.length > i;
                return (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    isFilled ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-slate-800 bg-transparent'
                  } ${error ? 'border-rose-500 bg-rose-500' : ''}`}></div>
                );
              })}
            </div>

            {error && (
              <div className="mb-4 flex items-center justify-center gap-2 text-rose-500 animate-in fade-in">
                <AlertCircle size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">PINs don't match</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((val, i) => (
                <button
                  key={i}
                  disabled={isMatched && typeof val === 'number'}
                  onClick={() => {
                    if (val === 'del') handlePinDelete();
                    else if (typeof val === 'number') handlePinInput(val.toString());
                  }}
                  className={`h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${val === '' ? 'pointer-events-none opacity-0' : 'glass border-white/5 text-white active:scale-90 active:bg-emerald-500 active:text-slate-950 disabled:opacity-50'}`}
                >
                  {val === 'del' ? 'DEL' : val}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {isMatched && (
                <button 
                  onClick={() => onComplete(name, curr, pin)}
                  className="w-full bg-emerald-500 text-slate-950 py-5 rounded-[28px] font-black text-lg shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-in zoom-in-95 duration-300 flex items-center justify-center gap-2 uppercase tracking-tighter"
                >
                  Done, Let's go! <Check size={22} strokeWidth={3} />
                </button>
              )}
              
              <div className="flex gap-4">
                {step === 3 && !isMatched && (
                  <button 
                    onClick={() => { setStep(2); setConfirmPin(''); }}
                    className="flex-1 glass border-white/5 text-white py-4 rounded-[28px] font-black text-xs uppercase tracking-widest"
                  >
                    Go Back
                  </button>
                )}
                {step === 2 && (
                  <button 
                    onClick={() => pin.length === 4 && setStep(3)} 
                    disabled={pin.length < 4} 
                    className="w-full bg-emerald-500 text-black py-5 rounded-[28px] font-black text-lg shadow-2xl active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2 uppercase tracking-tighter"
                  >
                    Next <ArrowRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-2 text-[9px] text-slate-600 mt-12 uppercase font-black tracking-widest">
          <ShieldCheck size={12} /> Data is safe on your phone
        </div>
      </div>
    </div>
  );
};

export default App;
