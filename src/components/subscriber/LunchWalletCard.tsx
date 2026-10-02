import React from 'react';
import { Wallet, Sparkles, ArrowRight, CheckCircle2, Plus } from 'lucide-react';

interface LunchWalletCardProps {
  creditsCount: number; // e.g. 0, 1, 2
  creditValuePerMeal?: number; // ₦3,200
  onUseCredit: () => void;
  onViewBilling: () => void;
}

export const LunchWalletCard: React.FC<LunchWalletCardProps> = ({
  creditsCount = 0,
  creditValuePerMeal = 3200,
  onUseCredit,
  onViewBilling,
}) => {
  const totalValueNGN = creditsCount * creditValuePerMeal;
  const hasCredits = creditsCount > 0;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs font-['Poppins'] text-left relative overflow-hidden group">
      
      {/* Subtle background coin/wallet accent */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">💰</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Pre-paid Balance
          </span>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
            hasCredits
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
          }`}
        >
          {hasCredits ? 'Active Credits Available' : 'Zero Outstanding'}
        </span>
      </div>

      <h3 className="text-base font-black text-black">
        Lunch Wallet
      </h3>

      {/* Big Money Figure */}
      <div className="mt-2 flex items-baseline space-x-2">
        <span className="text-3xl sm:text-4xl font-black text-black tracking-tight">
          ₦{totalValueNGN.toLocaleString()}
        </span>
        <span className="text-xs font-bold text-zinc-500">
          {creditsCount} {creditsCount === 1 ? 'lunch credit' : 'lunch credits'}
        </span>
      </div>

      {/* Explanation / Benefit List */}
      <div className="my-4 pt-3 border-t border-zinc-150">
        {hasCredits ? (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Use your credit for:
            </span>
            <ul className="text-xs space-y-1.5 text-zinc-700 font-medium">
              <li className="flex items-center space-x-2">
                <span className="text-sm">🍛</span>
                <span><strong>Extra lunch:</strong> Add a 2nd portion to any workday.</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-sm">👥</span>
                <span><strong>Colleague:</strong> Treat a teammate on your floor.</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-sm">📅</span>
                <span><strong>Future lunch:</strong> Roll over into your next plan cycle.</span>
              </li>
            </ul>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
            Skip a lunch and its full <strong>₦{creditValuePerMeal.toLocaleString()}</strong> value comes back here instantly. You never forfeit a meal.
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-1">
        {hasCredits ? (
          <button
            type="button"
            onClick={onUseCredit}
            className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use Credit (Redeem Meal)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onViewBilling}
            className="w-full py-2.5 rounded-full border border-zinc-300 hover:border-black text-xs font-bold text-zinc-700 hover:text-black transition cursor-pointer flex items-center justify-center space-x-1"
          >
            <span>View Wallet & Invoices</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        )}
      </div>

    </div>
  );
};
