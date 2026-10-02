import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface LunchesRemainingCounterProps {
  totalSubscribed?: number; // default 20
  enjoyedCount?: number; // e.g. 17
  remainingCount?: number; // e.g. 3
  onPlanLunches: () => void;
}

export const LunchesRemainingCounter: React.FC<LunchesRemainingCounterProps> = ({
  totalSubscribed = 20,
  enjoyedCount = 17,
  remainingCount = 3,
  onPlanLunches,
}) => {
  const safeTotal = Math.max(1, totalSubscribed);
  const safeEnjoyed = Math.min(safeTotal, Math.max(0, enjoyedCount));
  const safeRemaining = Math.max(0, safeTotal - safeEnjoyed);

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs font-['Poppins'] text-left relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
            Your Remaining Lunches
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black text-black tracking-tight">
              {safeRemaining} / {safeTotal}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-500">
              lunches remaining
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            <strong className="text-black">{safeEnjoyed} lunches enjoyed</strong> ·{' '}
            <strong className="text-[#FF4C00]">{safeRemaining} lunches remaining</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onPlanLunches}
          className="self-start sm:self-auto px-4 py-2 rounded-full border border-zinc-300 hover:border-black hover:bg-zinc-50 text-xs font-bold text-black transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
        >
          <span>Plan my lunches</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Horizontal visual calendar/progress strip of dots */}
      <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-2">
          <span>Desk Drop Cycle</span>
          <span>
            {Math.round((safeEnjoyed / safeTotal) * 100)}% Complete
          </span>
        </div>

        {/* 20 Dots Strip */}
        <div className="flex flex-wrap gap-2 items-center">
          {Array.from({ length: safeTotal }).map((_, i) => {
            const isEnjoyed = i < safeEnjoyed;
            const isNext = i === safeEnjoyed;

            return (
              <div
                key={i}
                title={`Lunch #${i + 1}: ${isEnjoyed ? 'Delivered & Enjoyed' : isNext ? 'Today’s Lunch' : 'Upcoming'}`}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-transform hover:scale-125 cursor-default ${
                  isEnjoyed
                    ? 'bg-black text-white shadow-2xs'
                    : isNext
                    ? 'bg-[#FF4C00] text-white ring-2 ring-orange-200 animate-pulse'
                    : 'bg-zinc-200 text-zinc-400'
                }`}
              >
                {isEnjoyed ? '●' : isNext ? '★' : '○'}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-black inline-block" />
            <span>Enjoyed ({safeEnjoyed})</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#FF4C00] inline-block" />
            <span>Today's Drop</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-zinc-300 inline-block" />
            <span>Upcoming ({safeRemaining})</span>
          </span>
        </div>
      </div>
    </div>
  );
};
