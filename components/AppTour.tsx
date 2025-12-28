
import React, { useState } from 'react';
import { X, ArrowRight, LayoutGrid, Wallet, Plus, Target, ArrowLeftRight, History, Check } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface AppTourProps {
  onComplete: () => void;
}

const AppTour: React.FC<AppTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TourStep[] = [
    {
      title: "Your Command Center",
      description: "Get a clear view of your total balance and monthly progress across all your wallets.",
      icon: <LayoutGrid size={48} />,
      color: "text-blue-400"
    },
    {
      title: "Multiple Wallets",
      description: "Create separate wallets for different currencies or purposes. We handle all the math.",
      icon: <Wallet size={48} />,
      color: "text-purple-400"
    },
    {
      title: "Quick Logging",
      description: "Tap the big plus button anytime to record an expense or some new income.",
      icon: <Plus size={48} />,
      color: "text-emerald-400"
    },
    {
      title: "Move Money & Goals",
      description: "Transfer funds between wallets or save up for something special with Wealth Targets.",
      icon: <Target size={48} />,
      color: "text-indigo-400"
    },
    {
      title: "Activity History",
      description: "Review every transaction, search by tags, and keep your finances organized.",
      icon: <History size={48} />,
      color: "text-amber-400"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-sm glass rounded-[48px] border-white/10 p-10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 flex">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 h-full transition-all duration-500 ${i <= currentStep ? 'bg-emerald-500' : 'bg-transparent'}`}
            />
          ))}
        </div>

        <button 
          onClick={onComplete}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className={`mb-10 p-8 rounded-[32px] bg-white/5 border border-white/5 shadow-inner ${step.color} animate-in zoom-in-75 duration-500`}>
          {step.icon}
        </div>

        <h2 className="text-2xl font-black text-white italic tracking-tighter mb-4 animate-in slide-in-from-bottom-2 duration-500">
          {step.title}
        </h2>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-12 animate-in slide-in-from-bottom-4 duration-500">
          {step.description}
        </p>

        <button 
          onClick={handleNext}
          className="w-full bg-emerald-500 text-slate-950 py-5 rounded-[28px] font-black flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all uppercase tracking-tighter"
        >
          {currentStep === steps.length - 1 ? (
            <>Let's Begin <Check size={20} strokeWidth={3} /></>
          ) : (
            <>Next Step <ArrowRight size={20} /></>
          )}
        </button>

        <button 
          onClick={onComplete}
          className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-slate-400 transition-colors"
        >
          Skip Introduction
        </button>

        {/* Aesthetic Background Flares */}
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default AppTour;
