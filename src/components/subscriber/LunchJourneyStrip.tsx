import React from 'react';
import { Clock, CheckCircle2, Truck, Calendar } from 'lucide-react';
import { TodayLunchDeliveryState } from './TodayLunchHeroCard';

interface LunchJourneyStripProps {
  todayStatus: TodayLunchDeliveryState;
  todayMealTitle?: string;
  tomorrowMealTitle?: string;
}

export const LunchJourneyStrip: React.FC<LunchJourneyStripProps> = ({
  todayStatus,
  todayMealTitle = 'Jollof Rice + Grilled Chicken',
  tomorrowMealTitle = 'Honey Beans + Fried Plantain + Fish',
}) => {
  const journeyItems = [
    {
      period: 'Yesterday',
      date: 'Fri, Oct 2',
      meal: 'Party Fried Rice + Peppered Chicken',
      emoji: '🍚',
      statusBadge: '✓ Delivered (11:38 AM)',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: CheckCircle2,
    },
    {
      period: 'Today',
      date: 'Mon, Oct 5',
      meal: todayMealTitle,
      emoji: '🍛',
      statusBadge:
        todayStatus === 'delivered'
          ? '✓ Delivered (11:42 AM)'
          : todayStatus === 'on_the_way'
          ? '🚚 On the way'
          : todayStatus === 'packed'
          ? '📦 Packed in Kitchen'
          : todayStatus === 'skipped'
          ? '⏸ Skipped (Preserved in Wallet)'
          : '👨‍🍳 Preparing',
      statusColor:
        todayStatus === 'delivered'
          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
          : todayStatus === 'skipped'
          ? 'text-zinc-600 bg-zinc-100 border-zinc-200'
          : 'text-[#FF4C00] bg-orange-50 border-orange-200 font-black animate-pulse',
      icon: todayStatus === 'delivered' ? CheckCircle2 : Truck,
    },
    {
      period: 'Tomorrow',
      date: 'Tue, Oct 6',
      meal: tomorrowMealTitle,
      emoji: '🫘',
      statusBadge: '📅 Scheduled',
      statusColor: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: Calendar,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 shadow-xs font-['Poppins'] text-left">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            Timeline
          </span>
          <h3 className="text-xl font-black text-black">
            Your Lunch Journey
          </h3>
        </div>
        <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
          Desk Drop Subscription in Motion
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {journeyItems.map((item, idx) => {
          const Icon = item.icon;
          const isToday = item.period === 'Today';

          return (
            <div
              key={item.period}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                isToday
                  ? 'bg-orange-50/40 border-[#FF4C00]/40 shadow-xs ring-1 ring-orange-200'
                  : 'bg-[#FAF7F2] border-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-black uppercase tracking-wider ${isToday ? 'text-[#FF4C00]' : 'text-zinc-500'}`}>
                    {item.period}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-semibold">
                    {item.date}
                  </span>
                </div>

                <div className="flex items-start space-x-2.5 my-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="text-xs sm:text-sm font-bold text-black line-clamp-2 leading-snug">
                    {item.meal}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-200/60">
                <span
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.statusColor}`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{item.statusBadge}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
