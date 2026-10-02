import React, { useState } from 'react';
import { Gift, Sparkles, CheckCircle2, ArrowRight, X, Flame } from 'lucide-react';

interface LunchRewardStreakCardProps {
  currentLunches: number; // e.g. 17
  targetLunches?: number; // e.g. 20
  onClaimOrRenew?: () => void;
}

export const LunchRewardStreakCard: React.FC<LunchRewardStreakCardProps> = ({
  currentLunches = 17,
  targetLunches = 20,
  onClaimOrRenew,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const safeCurrent = Math.max(0, currentLunches);
  const remaining = Math.max(0, targetLunches - safeCurrent);
  const percentage = Math.min(100, Math.round((safeCurrent / targetLunches) * 100));

  const getEncouragementText = () => {
    if (safeCurrent >= targetLunches) {
      return {
        badge: 'UNLOCKED! 🎉',
        headline: '🎉 FREE LUNCH UNLOCKED!',
        sub: 'Your 20th lunch was 100% on the house! Keep the streak going on your next desk cycle.',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
        barColor: 'bg-emerald-500',
      };
    }
    if (safeCurrent === targetLunches - 1) {
      return {
        badge: 'ONE MORE! 🔥',
        headline: '“ONE MORE! 🔥”',
        sub: 'Eat 1 more lunch to unlock your 100% FREE desk drop lunch reward!',
        color: 'text-orange-950 bg-orange-100 border-orange-300',
        barColor: 'bg-[#FF4C00]',
      };
    }
    if (safeCurrent === targetLunches - 2) {
      return {
        badge: 'Almost there 👀',
        headline: '“Almost there 👀”',
        sub: 'Just 2 more lunches until your 20th day reward is unlocked.',
        color: 'text-amber-950 bg-amber-100 border-amber-300',
        barColor: 'bg-amber-500',
      };
    }
    return {
      badge: `${remaining} to go`,
      headline: `${remaining} more lunches → FREE LUNCH`,
      sub: 'Every 20-lunch desk drop cycle automatically gives you a free chef meal bonus.',
      color: 'text-zinc-800 bg-zinc-100 border-zinc-200',
      barColor: 'bg-[#FF4C00]',
    };
  };

  const statusInfo = getEncouragementText();

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs font-['Poppins'] text-left relative overflow-hidden group cursor-pointer hover:border-black transition"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎁</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Your Next Reward
            </span>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusInfo.color}`}>
            {statusInfo.badge}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            {safeCurrent} / {targetLunches}
          </span>
          <span className="text-xs font-bold text-zinc-400">
            Lunches enjoyed
          </span>
        </div>

        {/* Progress Bar (Representing █████████████████░░░) */}
        <div className="my-3 w-full h-3.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${statusInfo.barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs mt-2">
          <span className="font-black text-black">
            {statusInfo.headline}
          </span>
          <span className="text-zinc-400 group-hover:text-black font-bold flex items-center space-x-1 transition text-[11px]">
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Interactive Modal Explaining Reward */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#FF4C00] mb-1">
              <Gift className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                11 to 12 Streak Reward
              </span>
            </div>

            <h3 className="text-xl font-black text-black">
              20th Day Free Lunch Program
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Consistent good food deserves to be rewarded.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 font-medium">Current Streak:</span>
                <span className="font-black text-black">{safeCurrent} of {targetLunches} Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 font-medium">Lunches Needed:</span>
                <span className="font-bold text-[#FF4C00]">{remaining} Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 font-medium">Reward Value:</span>
                <span className="font-bold text-emerald-700">₦2,900 Free Chef Dish</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200/80 text-xs text-orange-950 space-y-1.5 font-medium leading-relaxed">
              <p className="font-bold flex items-center space-x-1.5 text-black">
                <Sparkles className="w-4 h-4 text-[#FF4C00]" />
                <span>How the free lunch works:</span>
              </p>
              <p>
                When you hit 20 lunches on your monthly subscription, Chef Justice knocks off ₦2,900 from your bill. Your 20th lunch is 100% complimentary!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Keep Eating & Winning
            </button>
          </div>
        </div>
      )}
    </>
  );
};
