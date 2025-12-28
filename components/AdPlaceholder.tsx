
import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Info } from 'lucide-react';

interface AdPlaceholderProps {
  type: 'banner' | 'card' | 'interstitial';
  onClose?: () => void;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ type, onClose }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (type === 'interstitial' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, type]);

  if (type === 'interstitial') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
        <div className="flex justify-between items-center p-6 bg-slate-900 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-black text-[10px] px-1.5 py-0.5 rounded font-black">AD</span>
            <span className="text-white font-bold text-sm">WealthBuilder Pro</span>
          </div>
          <button 
            onClick={onClose}
            disabled={countdown > 0}
            className={`p-2 rounded-full transition-all ${countdown > 0 ? 'text-slate-700' : 'text-white bg-white/10'}`}
          >
            {countdown > 0 ? `Close in ${countdown}s` : <X size={24} />}
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-900 to-black">
          <div className="w-24 h-24 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-3xl mb-8 flex items-center justify-center shadow-2xl shadow-amber-500/20 rotate-6">
            <ExternalLink size={48} className="text-black" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Maximize Your Returns</h2>
          <p className="text-slate-400 mb-12 max-w-xs leading-relaxed">Join 500k+ investors using WealthBuilder to automate their global portfolio. One-click diversification.</p>
          <button className="w-full max-w-xs bg-white text-black py-5 rounded-2xl font-black text-lg active:scale-95 transition-all">
            Install Now
          </button>
          <p className="mt-6 text-[10px] text-slate-600 uppercase tracking-widest font-bold">App Store Rating 4.9/5 ★</p>
        </div>
      </div>
    );
  }

  if (type === 'banner') {
    return (
      <div className="w-full bg-[#1e293b]/50 border border-white/5 rounded-xl h-24 flex items-center px-4 overflow-hidden my-6 relative group cursor-pointer hover:bg-[#1e293b]/80 transition-all">
        <div className="absolute top-2 right-2 text-[8px] text-slate-600 flex items-center gap-1 font-bold">
          AD <Info size={8} />
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <ExternalLink size={24} className="text-white" />
        </div>
        <div className="ml-4">
          <h4 className="text-white text-xs font-black uppercase tracking-tight">Trade Crypto Smart</h4>
          <p className="text-slate-500 text-[10px] leading-tight mt-1">Zero fees on your first $1,000. Regulated global exchange.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-white/5 rounded-[32px] p-6 my-8 relative overflow-hidden group shadow-2xl">
      <div className="absolute top-4 right-4 px-2 py-0.5 bg-slate-800 text-[8px] rounded uppercase font-black text-slate-500 border border-white/5">Ad</div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/10">
          <Info className="text-emerald-500" size={24} />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-bold text-sm tracking-tight">Is your money working?</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Discover high-yield savings accounts with up to 5.2% APY. Secure your future today.</p>
        </div>
      </div>
      <button className="w-full bg-white/5 hover:bg-white/10 text-white text-xs py-3.5 rounded-2xl font-black transition-all border border-white/5">
        Explore Offers
      </button>
    </div>
  );
};

export default AdPlaceholder;
