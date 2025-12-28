
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, Check, X } from 'lucide-react';
import { AppTab } from '../types';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  tab?: AppTab;
}

interface VisualTourProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onComplete: () => void;
}

const VisualTour: React.FC<VisualTourProps> = ({ activeTab, setActiveTab, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const lastStepRef = useRef(-1);

  const steps: TourStep[] = [
    {
      targetId: 'dashboard-balance',
      title: 'Your Total Money',
      description: 'This is your financial heart. It shows the combined value of all your wallets in your main currency.',
      tab: AppTab.DASHBOARD
    },
    {
      targetId: 'top-actions',
      title: 'Quick Tools',
      description: 'Need to move money between wallets or check your saving goals? These shortcuts have you covered.',
      tab: AppTab.DASHBOARD
    },
    {
      targetId: 'nav-wallets',
      title: 'Manage Accounts',
      description: 'Tap here to see all your different bank accounts, cash, or crypto wallets in one place.',
      tab: AppTab.WALLETS
    },
    {
      targetId: 'nav-add',
      title: 'The Magic Button',
      description: 'Whenever you buy something or get paid, tap this big plus to keep your records perfect!',
      tab: AppTab.ADD
    },
    {
      targetId: 'nav-ledger',
      title: 'Activity History',
      description: 'Review everything you have done. You can search, filter, and even export your data from here.',
      tab: AppTab.LEDGER
    }
  ];

  const updatePosition = useCallback(() => {
    const step = steps[currentStep];
    const el = document.getElementById(step.targetId);
    
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setCoords({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
        setIsVisible(true);
        return;
      }
    }
    
    // If element is not found or has no width (not rendered yet), hide and retry
    setIsVisible(false);
  }, [currentStep]);

  // FIX: Handle Tab Navigation - ONLY when the step index actually changes
  // Removed 'activeTab' from dependencies to prevent snap-back loop
  useEffect(() => {
    if (lastStepRef.current !== currentStep) {
      const step = steps[currentStep];
      if (step.tab && activeTab !== step.tab) {
        setActiveTab(step.tab);
      }
      lastStepRef.current = currentStep;
    }
  }, [currentStep, setActiveTab]);

  // Handle Positioning - whenever step or tab changes
  useEffect(() => {
    // Small delay to allow page transitions to finish
    const timer = setTimeout(updatePosition, 300);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [currentStep, activeTab, updatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const padding = 8;
  const isTopHalf = coords.y < window.innerHeight / 2;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none font-sans">
      <svg className="w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect 
              x={coords.x - padding} 
              y={coords.y - padding} 
              width={coords.width + padding * 2} 
              height={coords.height + padding * 2} 
              rx="16" 
              fill="black" 
              className="transition-all duration-500 ease-in-out"
            />
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(2, 6, 23, 0.85)" 
          mask="url(#tour-spotlight-mask)" 
          className="transition-all duration-500"
        />
      </svg>
      <div 
        className="fixed border-2 border-emerald-500/50 rounded-[16px] transition-all duration-500 ease-in-out shadow-[0_0_20px_rgba(16,185,129,0.3)] pointer-events-none"
        style={{
          left: coords.x - padding,
          top: coords.y - padding,
          width: coords.width + padding * 2,
          height: coords.height + padding * 2
        }}
      />
      <div 
        className={`fixed w-[280px] glass p-6 rounded-[32px] border border-white/10 shadow-2xl pointer-events-auto transition-all duration-500 ease-in-out animate-in fade-in zoom-in-95`}
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: isTopHalf ? coords.y + coords.height + 30 : 'auto',
          bottom: !isTopHalf ? (window.innerHeight - coords.y) + 30 : 'auto'
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <button onClick={onComplete} className="text-slate-500 hover:text-white transition-colors pointer-events-auto">
            <X size={16} />
          </button>
        </div>
        <h3 className="text-white font-black text-lg italic tracking-tighter mb-2 leading-tight">{step.title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed mb-6 font-medium">
          {step.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-emerald-500 w-4' : 'bg-slate-800 w-1.5'}`} />
            ))}
          </div>
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg pointer-events-auto"
          >
            {currentStep === steps.length - 1 ? 'Start Flow' : 'Next'}
            {currentStep === steps.length - 1 ? <Check size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualTour;
