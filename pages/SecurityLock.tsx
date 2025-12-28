
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Delete, ArrowRight, Lock } from 'lucide-react';

interface SecurityLockProps {
  correctPin: string;
  onUnlock: () => void;
}

const SecurityLock: React.FC<SecurityLockProps> = ({ correctPin, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          setTimeout(onUnlock, 300);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/10 shadow-lg">
          <ShieldCheck size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-white italic tracking-tighter">Vault Locked</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Enter PIN to Decrypt</p>
      </div>

      <div className={`flex gap-4 mb-16 transition-transform ${error ? 'animate-bounce' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              pin.length > i 
                ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                : 'border-slate-800 bg-transparent'
            } ${error ? 'border-rose-500 bg-rose-500' : ''}`}
          ></div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-[280px] w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button 
            key={num} 
            onClick={() => handleKeyPress(num.toString())}
            className="w-16 h-16 rounded-full glass border-white/5 text-xl font-black text-white active:scale-95 active:bg-emerald-500 active:text-slate-950 transition-all flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        <div className="w-16 h-16"></div>
        <button 
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-full glass border-white/5 text-xl font-black text-white active:scale-95 active:bg-emerald-500 active:text-slate-950 transition-all flex items-center justify-center"
        >
          0
        </button>
        <button 
          onClick={handleDelete}
          className="w-16 h-16 rounded-full flex items-center justify-center text-slate-500 active:text-white transition-colors"
        >
          <Delete size={24} />
        </button>
      </div>

      <button className="mt-12 text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] hover:text-slate-400 transition-colors">
        Forgot Your PIN?
      </button>
    </div>
  );
};

export default SecurityLock;
