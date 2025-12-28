
import React, { useState, useEffect } from 'react';
import { Timer, Brain, CheckSquare, Music } from 'lucide-react';

const Tools: React.FC = () => {
  const [seconds, setSeconds] = useState(1500); // 25 mins
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setSeconds(1500);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Toolkit</h1>
        <p className="text-slate-400 text-sm">Boost your efficiency every day</p>
      </header>

      <section className="mb-8 glass p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Timer size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Focus Timer</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Pomodoro Method</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <span className="text-6xl font-black text-white tabular-nums tracking-tighter">
            {formatTime(seconds)}
          </span>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={toggleTimer}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all active:scale-95 ${
              isActive ? 'bg-slate-700 text-white' : 'bg-indigo-600 text-white'
            }`}
          >
            {isActive ? 'Pause' : 'Start Session'}
          </button>
          <button 
            onClick={resetTimer}
            className="px-6 py-4 glass rounded-2xl text-slate-400 active:scale-95"
          >
            Reset
          </button>
        </div>
      </section>

      <h2 className="text-lg font-bold text-white mb-4">Other Tools</h2>
      <div className="grid grid-cols-1 gap-4">
        <div className="glass p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-indigo-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Brain size={24} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Brain Teasers</h3>
              <p className="text-xs text-slate-500">Daily logic puzzles for mental agility</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
            →
          </div>
        </div>

        <div className="glass p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-orange-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <CheckSquare size={24} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Micro Tasks</h3>
              <p className="text-xs text-slate-500">Break down large goals into tiny wins</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-slate-500 group-hover:text-orange-500 transition-colors">
            →
          </div>
        </div>

        <div className="glass p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-pink-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Music size={24} className="text-pink-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Zen Ambient</h3>
              <p className="text-xs text-slate-500">Curated Lo-Fi and Nature sounds</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-slate-500 group-hover:text-pink-500 transition-colors">
            →
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
