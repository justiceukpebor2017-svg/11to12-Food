import React from 'react';
import { MenuItem, TimeWindow, UserOrderState } from '../../types';
import { Clock, CheckCircle2, X, RefreshCw, Truck } from 'lucide-react';

interface TimeAdaptiveCardProps {
  timeWindow: TimeWindow;
  todayMeal: MenuItem;
  tomorrowMeal: MenuItem;
  orderState: UserOrderState;
  onAcceptMeal: () => void;
  onSkipMeal: () => void;
  onSwapSubPack: () => void;
  onConfirmReceived: () => void;
}

export const TimeAdaptiveCard: React.FC<TimeAdaptiveCardProps> = ({
  timeWindow,
  todayMeal,
  tomorrowMeal,
  orderState,
  onAcceptMeal,
  onSkipMeal,
  onSwapSubPack,
  onConfirmReceived,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-md font-['Poppins']">
      
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-100">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-black">
            Today's Lunch
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal">
            {todayMeal.day}, {todayMeal.dateStr}
          </p>
        </div>

        {/* Phase Badge */}
        {timeWindow === 'morning' && (
          <span className="px-3.5 py-1.5 bg-orange-50 text-[#FF4C00] rounded-full text-xs font-semibold flex items-center space-x-1.5 border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-[#FF4C00]" />
            <span>Decision Window (Before 10:30 AM)</span>
          </span>
        )}

        {timeWindow === 'delivery' && (
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold flex items-center space-x-1.5 border border-emerald-200">
            <Truck className="w-3.5 h-3.5" />
            <span>Riders Out (11:00 AM - 12:00 PM)</span>
          </span>
        )}

        {timeWindow === 'post_lunch' && (
          <span className="px-3.5 py-1.5 bg-zinc-100 text-zinc-700 rounded-full text-xs font-semibold flex items-center space-x-1.5 border border-zinc-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Kitchen Closed For Today</span>
          </span>
        )}
      </div>

      {/* Main Meal Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-6">
        
        {/* Meal Photo */}
        <div className="md:col-span-4 h-48 sm:h-56 rounded-2xl overflow-hidden shadow-sm">
          <img
            src={todayMeal.imageUrl}
            alt={todayMeal.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Meal Info & Actions */}
        <div className="md:col-span-8 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#FF4C00] tracking-wider uppercase">
              {todayMeal.category}
            </span>
            <h4 className="text-2xl sm:text-3xl font-bold text-black">
              {orderState.status === 'sub_pack' ? todayMeal.subPackOption.title : todayMeal.title}
            </h4>
            <p className="text-sm text-zinc-600 font-normal leading-relaxed">
              {orderState.status === 'sub_pack' ? todayMeal.subPackOption.description : todayMeal.description}
            </p>
          </div>

          {/* Current Choice Status */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800">
            <span>Status:</span>
            <span className="text-[#FF4C00] capitalize">
              {orderState.status === 'accepted' && 'Delivering standard meal'}
              {orderState.status === 'sub_pack' && 'Swapped to Sub Pack'}
              {orderState.status === 'skipped' && 'Skipped (Credit Star added)'}
            </span>
          </div>

          {/* Action Buttons */}
          {timeWindow === 'morning' && (
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={onAcceptMeal}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  orderState.status === 'accepted'
                    ? 'bg-[#FF4C00] text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Eat Today</span>
              </button>

              <button
                onClick={onSwapSubPack}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  orderState.status === 'sub_pack'
                    ? 'bg-[#FF4C00] text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Swap to Sub Pack</span>
              </button>

              <button
                onClick={onSkipMeal}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  orderState.status === 'skipped'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <X className="w-4 h-4" />
                <span>Skip Day (+1 Star)</span>
              </button>
            </div>
          )}

          {timeWindow === 'delivery' && (
            <div className="pt-2">
              {!orderState.confirmedReceived ? (
                <button
                  onClick={onConfirmReceived}
                  className="bg-[#22C55E] hover:bg-emerald-600 text-white px-6 py-3 rounded-full text-xs font-bold transition shadow-sm cursor-pointer flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Received at Desk</span>
                </button>
              ) : (
                <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Meal received & verified at desk</span>
                </div>
              )}
            </div>
          )}

          {timeWindow === 'post_lunch' && (
            <div className="pt-2 text-xs text-zinc-500 font-normal">
              Tomorrow's lunch: <strong className="text-zinc-800">{tomorrowMeal.title}</strong>. Window opens tomorrow at 6:00 AM.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
