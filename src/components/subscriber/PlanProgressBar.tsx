import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PlanProgressBarProps {
  selectedCount: number; // e.g. 14
  targetCap: number; // e.g. 20
  onAddMoreLunches: () => void;
  onViewPlan: () => void;
}

export const PlanProgressBar: React.FC<PlanProgressBarProps> = ({
  selectedCount,
  targetCap = 20,
  onAddMoreLunches,
  onViewPlan,
}) => {
  const percentage = Math.min(100, Math.round((selectedCount / targetCap) * 100));
  const remainingUntilFree = Math.max(0, targetCap - selectedCount);
  const isTwentySelected = selectedCount >= targetCap;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs font-['Poppins'] text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            {isTwentySelected ? 'Bonus Unlocked' : 'Your Lunch Plan'}
          </span>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-xl font-black text-black">
              {selectedCount} / {targetCap} lunches selected
            </span>
            {isTwentySelected && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                🎉 20th Lunch Free
              </span>
            )}
          </div>
        </div>

        <div>
          {isTwentySelected ? (
            <button
              onClick={onViewPlan}
              className="text-xs font-bold text-black hover:text-[#FF4C00] flex items-center space-x-1 cursor-pointer transition"
            >
              <span>View Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onAddMoreLunches}
              className="text-xs font-bold text-[#FF4C00] hover:text-[#E04300] flex items-center space-x-1 cursor-pointer transition"
            >
              <span>Add More Lunches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3 bg-[#FAF7F2] rounded-full overflow-hidden border border-zinc-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isTwentySelected ? 'bg-emerald-500' : 'bg-[#FF4C00]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Footer promotion text */}
      <div className="mt-3 text-xs flex items-center justify-between">
        {isTwentySelected ? (
          <p className="text-emerald-700 font-bold flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>🎉 20 lunches selected! Your 20th lunch is 100% free on this plan.</span>
          </p>
        ) : (
          <p className="text-zinc-600 font-medium">
            <span className="font-bold text-black">{remainingUntilFree} more lunches</span> until your 20th selected lunch is <span className="font-bold text-[#FF4C00]">FREE 🎉</span>
          </p>
        )}
      </div>
    </div>
  );
};
