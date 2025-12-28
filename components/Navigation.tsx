
import React from 'react';
import { LayoutGrid, Wallet, Plus, PieChart, History } from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: AppTab.DASHBOARD, label: 'Home', icon: LayoutGrid },
    { id: AppTab.WALLETS, label: 'Vaults', icon: Wallet },
    { id: AppTab.ADD, label: 'Add', icon: Plus, primary: true },
    { id: AppTab.BUDGETS, label: 'Plans', icon: PieChart },
    { id: AppTab.LEDGER, label: 'Ledger', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/5 safe-bottom z-50">
      <div className="flex justify-around items-end h-20 max-w-lg mx-auto px-4 pb-2">
        {tabs.map(({ id, label, icon: Icon, primary }) => (
          <button
            key={id}
            id={`nav-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center transition-all duration-300 relative pb-2 ${
              primary ? 'translate-y-[-15px]' : ''
            } ${
              activeTab === id ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {primary ? (
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 text-slate-950 mb-1">
                <Icon size={28} strokeWidth={3} />
              </div>
            ) : (
              <>
                <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
                <span className="text-[10px] mt-1 font-semibold uppercase tracking-wider">{label}</span>
              </>
            )}
            {activeTab === id && !primary && (
              <div className="absolute bottom-0 w-1 h-1 bg-emerald-400 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
