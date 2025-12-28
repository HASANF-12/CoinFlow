
import React from 'react';
import { Bell, ShieldCheck, X } from 'lucide-react';
import { requestNotificationPermission } from '../services/notificationService';

interface NotificationPromptProps {
  onAccept: () => void;
  onDecline: () => void;
}

const NotificationPrompt: React.FC<NotificationPromptProps> = ({ onAccept, onDecline }) => {
  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      onAccept();
    } else {
      onDecline();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="w-full max-w-sm glass rounded-[40px] border border-white/10 p-10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-8 border border-emerald-500/10 shadow-lg">
          <Bell size={40} className="text-emerald-500 animate-bounce" />
        </div>

        <h2 className="text-2xl font-black text-white italic tracking-tighter mb-4 leading-tight">
          Stay on track with Alerts
        </h2>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium">
          Get notified when you exceed budgets, reach savings goals, or forget to log your daily expenses.
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={handleEnable}
            className="w-full bg-emerald-500 text-slate-950 py-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs"
          >
            Enable Notifications
          </button>
          
          <button 
            onClick={onDecline}
            className="w-full text-slate-500 py-2 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
          >
            Maybe Later
          </button>
        </div>

        <div className="flex items-center gap-2 mt-8 text-[9px] text-slate-600 font-black uppercase tracking-widest">
          <ShieldCheck size={12} /> Privacy first • No spam
        </div>

        {/* Background Gradients */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
