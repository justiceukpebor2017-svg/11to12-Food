import React, { useState } from 'react';
import { Star, Gift, Calendar as CalendarIcon, Sparkles, CheckCircle2, X } from 'lucide-react';

interface CreditRedemptionProps {
  creditsBalance: number;
  onRedeemCredit: (type: 'extra_meal' | 'extra_sub_pack', selectedDate: string) => void;
}

export const CreditRedemption: React.FC<CreditRedemptionProps> = ({ creditsBalance, onRedeemCredit }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redemptionType, setRedemptionType] = useState<'extra_meal' | 'extra_sub_pack'>('extra_meal');
  const [selectedWorkday, setSelectedWorkday] = useState('2026-08-07'); // Default future workday
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const futureWorkdays = [
    { dateStr: '2026-08-07', label: 'THURSDAY (AUG 7) • Pounded Yam & Egusi' },
    { dateStr: '2026-08-08', label: 'FRIDAY (AUG 8) • Seafood Special' },
    { dateStr: '2026-08-10', label: 'MONDAY (AUG 10) • Party Jollof' },
    { dateStr: '2026-08-11', label: 'TUESDAY (AUG 11) • Ewa Aganyin' },
  ];

  const handleConfirmRedeem = () => {
    if (creditsBalance <= 0) return;

    onRedeemCredit(redemptionType, selectedWorkday);
    setSuccessMsg(`Successfully scheduled 1 ${redemptionType === 'extra_meal' ? 'Extra Meal' : 'Extra Sub Pack'} for ${selectedWorkday}!`);

    setTimeout(() => {
      setSuccessMsg(null);
      setIsModalOpen(false);
    }, 1500);
  };

  return (
    <div className="bg-white border-4 border-black text-black p-6 shadow-[8px_8px_0px_#000]">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Credit Star Bank Display */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-[#FACC15] text-black border-3 border-black flex items-center justify-center font-black shadow-[3px_3px_0px_#000]">
            <Star className="w-8 h-8 fill-black text-black" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-black text-black font-mono-custom">{creditsBalance} STARS</span>
              <span className="text-xs bg-[#22C55E] text-black px-2.5 py-1 border-2 border-black font-black uppercase font-mono-custom shadow-[2px_2px_0px_#000]">
                BANK ACTIVE
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
              1 Star = 1 Free Extra Meal or Extra Sub Pack for team members or meetings.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={creditsBalance <= 0}
          className="px-6 py-4 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-xs uppercase border-3 border-black shadow-[4px_4px_0px_#000] cursor-pointer transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Gift className="w-5 h-5 fill-white stroke-[3]" />
          <span>USE A CREDIT</span>
        </button>

      </div>

      {/* Calendar Redemption Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="relative w-full max-w-lg bg-white border-4 border-black p-6 sm:p-8 shadow-[12px_12px_0px_#000] text-black">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b-3 border-black">
              <div className="flex items-center space-x-2">
                <Star className="w-6 h-6 text-[#FACC15] fill-[#FACC15] stroke-[3]" />
                <h3 className="text-xl font-black uppercase font-heading">REDEEM MEAL CREDIT STAR</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-black text-white border-2 border-black hover:bg-[#FF4C00] cursor-pointer transition-all"
              >
                <X className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            {successMsg ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-[#22C55E] mx-auto animate-bounce stroke-[3]" />
                <p className="text-base font-black text-black uppercase font-heading">{successMsg}</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Select Type */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black font-mono-custom mb-2">
                    SELECT ITEM TO REDEEM
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setRedemptionType('extra_meal')}
                      className={`p-4 border-3 border-black text-left cursor-pointer transition-all ${
                        redemptionType === 'extra_meal'
                          ? 'bg-[#FF4C00] text-white shadow-[4px_4px_0px_#000]'
                          : 'bg-white text-black hover:bg-[#FACC15]'
                      }`}
                    >
                      <span className="block text-sm font-black uppercase font-heading">EXTRA FULL MEAL</span>
                      <span className="text-[10px] font-bold opacity-90 block mt-1">Main dish + Protein + Plantain</span>
                    </button>

                    <button
                      onClick={() => setRedemptionType('extra_sub_pack')}
                      className={`p-4 border-3 border-black text-left cursor-pointer transition-all ${
                        redemptionType === 'extra_sub_pack'
                          ? 'bg-[#A855F7] text-white shadow-[4px_4px_0px_#000]'
                          : 'bg-white text-black hover:bg-[#FACC15]'
                      }`}
                    >
                      <span className="block text-sm font-black uppercase font-heading">EXTRA SUB PACK</span>
                      <span className="text-[10px] font-bold opacity-90 block mt-1">Small chops + Pie + Juice</span>
                    </button>
                  </div>
                </div>

                {/* Calendar Selection */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black font-mono-custom mb-2 flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4 text-[#FF4C00]" />
                    <span>SELECT TARGET WORKDAY</span>
                  </label>
                  <div className="space-y-2">
                    {futureWorkdays.map((wd) => (
                      <button
                        key={wd.dateStr}
                        onClick={() => setSelectedWorkday(wd.dateStr)}
                        className={`w-full p-3 border-2 border-black text-left text-xs font-black uppercase cursor-pointer transition-all ${
                          selectedWorkday === wd.dateStr
                            ? 'bg-[#FACC15] text-black shadow-[3px_3px_0px_#000]'
                            : 'bg-zinc-100 text-black hover:bg-white'
                        }`}
                      >
                        {wd.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmRedeem}
                  className="w-full py-4 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-sm uppercase border-3 border-black shadow-[4px_4px_0px_#000] cursor-pointer transition-all"
                >
                  CONFIRM REDEMPTION (-1 STAR)
                </button>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

