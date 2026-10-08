import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  Minus,
  Sparkles,
  X,
  RotateCcw,
  ArrowRight,
  Clock,
  MapPin,
  Utensils,
} from 'lucide-react';
import { SwallowType } from '../../types';

export interface WeekDayMeal {
  dateStr: string; // "2026-10-05"
  dayName: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
  dayNum: number;
  dishName: string;
  shortDishName: string;
  emoji: string;
  isSwallow?: boolean;
  selectedSwallow?: SwallowType;
  status: 'selected' | 'skipped' | 'unselected';
  ingredients?: string[];
}

interface ThisWeekPreviewProps {
  days: WeekDayMeal[];
  onToggleSkipDay: (dateStr: string) => void;
  onSelectSwallow?: (dateStr: string, swallow: SwallowType) => void;
  onOpenFullCalendar: () => void;
}

export const ThisWeekPreview: React.FC<ThisWeekPreviewProps> = ({
  days,
  onToggleSkipDay,
  onSelectSwallow,
  onOpenFullCalendar,
}) => {
  const [activeModalDay, setActiveModalDay] = useState<WeekDayMeal | null>(null);

  // Keep modal in sync with any prop changes (e.g. if user skips active day)
  const currentModalDay = activeModalDay
    ? days.find((d) => d.dateStr === activeModalDay.dateStr) || activeModalDay
    : null;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 shadow-xs font-['Poppins'] text-left relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] block">
            This Week's Lunches
          </span>
          <h3 className="text-xl font-black text-black">
            YOUR WEEK
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenFullCalendar}
          className="text-xs font-bold text-zinc-500 hover:text-black flex items-center space-x-1 cursor-pointer transition"
        >
          <span>Full month plan</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* 5-Column Horizontal Calendar Strip */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {days.map((day) => {
          const isSelected = day.status === 'selected';
          const isSkipped = day.status === 'skipped';

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setActiveModalDay(day)}
              className={`p-3 sm:p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between cursor-pointer group hover:scale-[1.03] ${
                isSelected
                  ? 'bg-[#FAF7F2] border-zinc-200 hover:border-black shadow-2xs'
                  : isSkipped
                  ? 'bg-zinc-100 border-zinc-200 opacity-60'
                  : 'bg-white border-dashed border-zinc-300'
              }`}
            >
              {/* Day Label (MON, TUE, etc.) */}
              <span className="text-[10px] sm:text-[11px] font-black text-zinc-400 tracking-wider">
                {day.dayName}
              </span>

              {/* Status Circle indicator (✓ or ○) */}
              <div className="my-1.5">
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center shadow-2xs">
                    ✓
                  </span>
                ) : isSkipped ? (
                  <span className="w-5 h-5 rounded-full bg-zinc-300 text-zinc-600 text-[11px] font-black flex items-center justify-center">
                    ○
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 text-[11px] font-bold flex items-center justify-center">
                    +
                  </span>
                )}
              </div>

              {/* Meal Emoji */}
              <span className="text-xl sm:text-2xl my-0.5 group-hover:scale-110 transition-transform">
                {day.emoji}
              </span>

              {/* Meal Short Title */}
              <span className="text-[10px] sm:text-xs font-bold text-zinc-800 truncate w-full mt-1">
                {day.shortDishName}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-zinc-400 mt-3 text-center sm:text-left">
        💡 Tap any weekday to change your swallow, view chef notes, or skip without losing credit.
      </p>

      {/* ============================================================== */}
      {/* IN-DASHBOARD DAY MANAGEMENT MODAL */}
      {/* ============================================================== */}
      {currentModalDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModalDay(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] block mb-1">
              Lunch Manager
            </span>
            <h3 className="text-xl font-black text-black">
              {currentModalDay.dayName} · {currentModalDay.dateStr}
            </h3>

            {/* Dish Card */}
            <div className="my-4 p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-start space-x-3.5">
              <span className="text-3xl">{currentModalDay.emoji}</span>
              <div className="flex-1">
                <h4 className="text-sm font-black text-black">
                  {currentModalDay.dishName}
                </h4>
                <div className="mt-1 flex items-center space-x-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      currentModalDay.status === 'selected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {currentModalDay.status === 'selected' ? 'Lunch Selected ✓' : 'Skipped (Credit in Wallet)'}
                  </span>
                  {currentModalDay.selectedSwallow && (
                    <span className="text-[11px] text-zinc-500 font-semibold">
                      Swallow: <strong>{currentModalDay.selectedSwallow}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Swallow Selector (for swallow days like Friday) */}
            {currentModalDay.isSwallow && onSelectSwallow && currentModalDay.status === 'selected' && (
              <div className="mb-4 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <span className="text-xs font-bold text-black block">
                  Choose Preferred Swallow:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Eba', 'Semo', 'Fufu'] as SwallowType[]).map((swallow) => (
                    <button
                      key={swallow}
                      type="button"
                      onClick={() => onSelectSwallow(currentModalDay.dateStr, swallow)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                        currentModalDay.selectedSwallow === swallow
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {swallow}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Skip or Restore Action Button */}
            <div className="space-y-2 pt-1">
              {currentModalDay.status === 'selected' ? (
                <button
                  type="button"
                  onClick={() => {
                    onToggleSkipDay(currentModalDay.dateStr);
                    setActiveModalDay(null);
                  }}
                  className="w-full py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Skip this lunch (+1 Wallet Credit)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onToggleSkipDay(currentModalDay.dateStr);
                    setActiveModalDay(null);
                  }}
                  className="w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Lunch to Desk Drop</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveModalDay(null)}
                className="w-full py-2.5 text-xs font-bold text-zinc-400 hover:text-black cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
