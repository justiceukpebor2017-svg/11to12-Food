import React from 'react';
import { DollarSign, Users, ShoppingBag, Star, TrendingUp } from 'lucide-react';

interface AdminKpiCardsProps {
  todayRevenueNGN: number;
  activeSubscribersCount: number;
  todayMealCount: number;
  todaySubPackCount: number;
  creditsRedeemedTotal: number;
}

export const AdminKpiCards: React.FC<AdminKpiCardsProps> = ({
  todayRevenueNGN,
  activeSubscribersCount,
  todayMealCount,
  todaySubPackCount,
  creditsRedeemedTotal,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* KPI 1: Today's Revenue */}
      <div className="bg-white border-4 border-black text-black p-6 shadow-[6px_6px_0px_#000] relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-black font-mono-custom">TODAY'S REVENUE</span>
          <div className="w-10 h-10 bg-[#22C55E] text-black border-2 border-black flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_#000]">
            ₦
          </div>
        </div>
        <div className="text-3xl font-black text-black font-mono-custom mt-3">
          ₦{todayRevenueNGN.toLocaleString()}
        </div>
        <div className="flex items-center space-x-1 text-xs text-black font-black mt-2 font-mono-custom uppercase">
          <TrendingUp className="w-4 h-4 text-[#22C55E] stroke-[3]" />
          <span>+14.2% FROM YESTERDAY</span>
        </div>
      </div>

      {/* KPI 2: Active Subscribers */}
      <div className="bg-white border-4 border-black text-black p-6 shadow-[6px_6px_0px_#000] relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-black font-mono-custom">ACTIVE SUBSCRIBERS</span>
          <div className="w-10 h-10 bg-[#FACC15] text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <Users className="w-5 h-5 stroke-[3]" />
          </div>
        </div>
        <div className="text-3xl font-black text-black font-mono-custom mt-3">
          {activeSubscribersCount}
        </div>
        <div className="text-xs font-bold text-zinc-700 mt-2 uppercase">
          Lagos Corporate Desks Locked In
        </div>
      </div>

      {/* KPI 3: Today's Order Volume */}
      <div className="bg-white border-4 border-black text-black p-6 shadow-[6px_6px_0px_#000] relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-black font-mono-custom">TODAY'S DISPATCH</span>
          <div className="w-10 h-10 bg-[#FF4C00] text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <ShoppingBag className="w-5 h-5 stroke-[3]" />
          </div>
        </div>
        <div className="text-3xl font-black text-black font-mono-custom mt-3">
          {todayMealCount + todaySubPackCount} PACKS
        </div>
        <div className="text-xs font-black text-zinc-700 mt-2 font-mono-custom uppercase">
          {todayMealCount} MEALS • {todaySubPackCount} SUB PACKS
        </div>
      </div>

      {/* KPI 4: Credits Redeemed */}
      <div className="bg-white border-4 border-black text-black p-6 shadow-[6px_6px_0px_#000] relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-black font-mono-custom">CREDITS REDEEMED</span>
          <div className="w-10 h-10 bg-[#A855F7] text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <Star className="w-5 h-5 fill-white stroke-[3]" />
          </div>
        </div>
        <div className="text-3xl font-black text-black font-mono-custom mt-3">
          {creditsRedeemedTotal} STARS
        </div>
        <div className="text-xs font-bold text-zinc-700 mt-2 uppercase">
          Extra meals scheduled by users
        </div>
      </div>

    </div>
  );
};

