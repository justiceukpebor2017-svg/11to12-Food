import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle2,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { SwallowType, CreditRedemptionDayItem } from '../../types';
import { CalendarDayPlan } from './MyLunchesSection';
import { getStructuredMealForDate } from '../../data/menuRotation';

interface CreditUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCredits: number;
  daysMap: Record<string, CalendarDayPlan>;
  isAfter5PM?: boolean;
  onConfirmCreditUsage: (items: CreditRedemptionDayItem[], totalCredits: number) => void;
}

export const CreditUsageModal: React.FC<CreditUsageModalProps> = ({
  isOpen,
  onClose,
  availableCredits,
  daysMap,
  isAfter5PM = false,
  onConfirmCreditUsage,
}) => {
  if (!isOpen) return null;

  // Step state: 1 = choose credit count, 2 = allocate to calendar days, 3 = review
  const [step, setStep] = useState<1 | 2>(1);
  const [creditsToUse, setCreditsToUse] = useState<number>(Math.min(1, availableCredits));

  // Allocations mapping: dateStr -> CreditRedemptionDayItem
  const [allocations, setAllocations] = useState<Record<string, CreditRedemptionDayItem>>({});

  // Moving credit state: when user wants to move an allocated credit to a different date
  const [movingFromDateStr, setMovingFromDateStr] = useState<string | null>(null);

  // Month offset for calendar view (0 = October 2026 / current, 1 = Nov, etc.)
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Sub-modal for Friday Swallow selection
  const [pendingFridayDate, setPendingFridayDate] = useState<{
    dateStr: string;
    dishName: string;
    fullDateFormatted: string;
  } | null>(null);
  const [selectedFridaySwallow, setSelectedFridaySwallow] = useState<SwallowType>('Semo');

  // Compute total allocated credits
  const totalAllocated = (Object.values(allocations) as CreditRedemptionDayItem[]).reduce((acc, item) => acc + item.portions, 0);
  const remainingToAllocate = Math.max(0, creditsToUse - totalAllocated);

  // Month date calculation
  const baseDate = new Date(2026, 9, 1); // October 2026 baseline
  const activeViewMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
  const activeMonthName = activeViewMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Today reference for past dates check
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Generate selectable workdays for the active month
  const getSelectableWorkdays = () => {
    const list: {
      dateStr: string;
      dayName: string;
      dayNum: number;
      fullDateFormatted: string;
      dishTitle: string;
      emoji: string;
      isFriday: boolean;
      isPast: boolean;
    }[] = [];

    const year = activeViewMonthDate.getFullYear();
    const month = activeViewMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // A user cannot use credit for past dates that have gone
      const isPast = dateStr < todayDateStr || (dateStr === todayDateStr && isAfter5PM);

      const existingPlan = daysMap[dateStr];
      const structured = getStructuredMealForDate(d);
      const dishTitle = existingPlan?.dishTitle || structured?.mealName || 'Chef Choice Lunch';
      let emoji = existingPlan?.emoji || '🍚';
      if (dayOfWeek === 5) emoji = '🍲';

      list.push({
        dateStr,
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
        dayNum,
        fullDateFormatted: d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        dishTitle,
        emoji,
        isFriday: dayOfWeek === 5,
        isPast,
      });
    }
    return list;
  };

  const selectableDays = getSelectableWorkdays();

  const handlePickDay = (day: {
    dateStr: string;
    dishTitle: string;
    fullDateFormatted: string;
    isFriday: boolean;
    isPast: boolean;
  }) => {
    // CRITICAL: Block past dates from credit usage
    if (day.isPast) return;

    // If moving an existing credit from movingFromDateStr:
    if (movingFromDateStr) {
      if (movingFromDateStr === day.dateStr) {
        setMovingFromDateStr(null);
        return;
      }
      handleDecrementDay(movingFromDateStr);
      if (day.isFriday) {
        setPendingFridayDate({
          dateStr: day.dateStr,
          dishName: day.dishTitle,
          fullDateFormatted: day.fullDateFormatted,
        });
        setSelectedFridaySwallow('Semo');
      } else {
        setAllocations((prev) => {
          const existing = prev[day.dateStr];
          const newPortions = (existing?.portions || 0) + 1;
          return {
            ...prev,
            [day.dateStr]: {
              dateStr: day.dateStr,
              portions: newPortions,
              dishName: day.dishTitle,
              isFriday: false,
            },
          };
        });
      }
      setMovingFromDateStr(null);
      return;
    }

    if (remainingToAllocate <= 0) return;

    if (day.isFriday) {
      // Trigger Friday Swallow modal
      setPendingFridayDate({
        dateStr: day.dateStr,
        dishName: day.dishTitle,
        fullDateFormatted: day.fullDateFormatted,
      });
      setSelectedFridaySwallow('Semo');
      return;
    }

    // Standard workday allocation
    setAllocations((prev) => {
      const existing = prev[day.dateStr];
      const newPortions = (existing?.portions || 0) + 1;
      return {
        ...prev,
        [day.dateStr]: {
          dateStr: day.dateStr,
          portions: newPortions,
          dishName: day.dishTitle,
          isFriday: false,
        },
      };
    });
  };

  const handleConfirmFridaySelection = () => {
    if (!pendingFridayDate) return;

    setAllocations((prev) => {
      const existing = prev[pendingFridayDate.dateStr];
      const newPortions = (existing?.portions || 0) + 1;
      return {
        ...prev,
        [pendingFridayDate.dateStr]: {
          dateStr: pendingFridayDate.dateStr,
          portions: newPortions,
          dishName: pendingFridayDate.dishName,
          isFriday: true,
          swallowChoice: selectedFridaySwallow,
        },
      };
    });

    setPendingFridayDate(null);
  };

  const handleDecrementDay = (dateStr: string) => {
    setAllocations((prev) => {
      const existing = prev[dateStr];
      if (!existing) return prev;
      if (existing.portions <= 1) {
        const copy = { ...prev };
        delete copy[dateStr];
        return copy;
      }
      return {
        ...prev,
        [dateStr]: {
          ...existing,
          portions: existing.portions - 1,
        },
      };
    });
  };

  const handleFinalSubmit = () => {
    if (totalAllocated === 0) return;
    const itemsList = Object.values(allocations);
    onConfirmCreditUsage(itemsList, totalAllocated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-['Poppins']">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#FAF7F2] border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF4C00] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] block">
                Skipped Credits Bank
              </span>
              <h3 className="text-xl font-black text-black">
                Use Skipped Credits for Extra Plates
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-black transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5:00 PM CUTOFF ENFORCEMENT */}
        {isAfter5PM ? (
          <div className="p-8 sm:p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                5:00 PM Daily Cutoff Reached
              </span>
              <h4 className="text-xl font-black text-black">
                Credit Redemption Locked Until Tomorrow
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
                Chef Justice and the kitchen production line finalize all fresh market sourcing and ingredient prep strictly at <strong>5:00 PM</strong> each evening.
              </p>
              <p className="text-xs text-zinc-500 font-medium">
                To guarantee zero-compromise quality and prompt 11 to 12 desk delivery, extra plates cannot be scheduled after 5:00 PM. Please redeem your credits tomorrow before 5:00 PM.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition cursor-pointer"
              >
                Understood, Close
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            
            {/* STEP 1: SELECT NUMBER OF CREDITS */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-emerald-900 block">Total Skipped Credits in Wallet:</span>
                    <span className="text-2xl font-black text-emerald-800">{availableCredits} Available</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 bg-white px-3 py-1 rounded-full font-bold border border-emerald-200">
                    1 Credit = 1 Extra Gourmet Plate
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600">
                    How many credits would you like to use?
                  </label>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      disabled={creditsToUse <= 1}
                      onClick={() => setCreditsToUse((c) => Math.max(1, c - 1))}
                      className="w-12 h-12 rounded-2xl border-2 border-zinc-300 hover:border-black flex items-center justify-center text-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-300 transition cursor-pointer"
                    >
                      <Minus className="w-5 h-5 stroke-[3]" />
                    </button>

                    <div className="w-24 text-center">
                      <span className="text-4xl font-black text-black block">{creditsToUse}</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        {creditsToUse === 1 ? 'Plate' : 'Plates'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={creditsToUse >= availableCredits}
                      onClick={() => setCreditsToUse((c) => Math.min(availableCredits, c + 1))}
                      className="w-12 h-12 rounded-2xl border-2 border-zinc-300 hover:border-black flex items-center justify-center text-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-300 transition cursor-pointer"
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </button>

                    <div className="flex-1 pl-4 border-l border-zinc-200 text-xs text-zinc-500">
                      You can allocate these <strong>{creditsToUse} credits</strong> across different days, or assign multiple plates to the same day for colleagues.
                    </div>
                  </div>
                </div>

                {/* Next Button */}
                <div className="pt-4 border-t border-zinc-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-xs uppercase tracking-wider flex items-center space-x-2 transition cursor-pointer shadow-sm"
                  >
                    <span>Choose Meal Dates ({creditsToUse} Credits)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ASSIGN TO CALENDAR DAYS */}
            {step === 2 && (
              <div className="space-y-6">
                
                {/* Live Allocation Counter Banner */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] block">
                      Credits Allocation Progress
                    </span>
                    <p className="font-bold text-black text-sm">
                      {totalAllocated} of {creditsToUse} Credits Assigned
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {remainingToAllocate > 0 ? (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs">
                        {remainingToAllocate} more {remainingToAllocate === 1 ? 'plate' : 'plates'} to pick
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All Credits Assigned</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-zinc-500 hover:text-black underline cursor-pointer"
                    >
                      Change Amount
                    </button>
                  </div>
                </div>

                {/* Moving Credit Notification Banner */}
                {movingFromDateStr && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center space-x-2">
                      <RotateCcw className="w-4 h-4 text-[#FF4C00] animate-spin" />
                      <div>
                        <span className="font-black block">Moving 1 Credit from {movingFromDateStr}</span>
                        <span className="text-[11px] text-zinc-600">Select any upcoming workday below to move this credit unlimitedly. Past dates cannot be selected.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMovingFromDateStr(null)}
                      className="px-3 py-1 rounded-full bg-white border border-amber-300 hover:border-black text-[11px] font-bold text-black shrink-0 cursor-pointer"
                    >
                      Cancel Move
                    </button>
                  </div>
                )}

                {/* Calendar Month Navigator & Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={monthOffset <= 0}
                      onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
                      className="p-1.5 rounded-full border border-zinc-300 hover:bg-white text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black text-black uppercase tracking-wider px-2">
                      {activeMonthName}
                    </span>
                    <button
                      type="button"
                      disabled={monthOffset >= 5}
                      onClick={() => setMonthOffset((m) => Math.min(5, m + 1))}
                      className="p-1.5 rounded-full border border-zinc-300 hover:bg-white text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[11px] font-semibold text-zinc-500">
                    💡 Unlimited moving from date to date before 5 PM • Past dates disabled
                  </span>
                </div>

                {/* Calendar Day Picker Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-600">
                      Select Workdays in {activeMonthName}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {remainingToAllocate > 0 ? `${remainingToAllocate} credits waiting to be assigned` : 'All credits assigned'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                    {selectableDays.map((d) => {
                      const currentPortions = allocations[d.dateStr]?.portions || 0;
                      const isFriday = d.isFriday;
                      const isPast = d.isPast;

                      if (isPast) {
                        return (
                          <div
                            key={d.dateStr}
                            className="p-3 rounded-2xl border border-zinc-200 bg-zinc-100/60 text-zinc-400 text-left flex flex-col justify-between opacity-60 cursor-not-allowed select-none"
                          >
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-bold uppercase text-zinc-400">{d.dayName}</span>
                                <span className="font-medium text-zinc-400">{d.fullDateFormatted}</span>
                              </div>
                              <div className="flex items-center space-x-2 my-1">
                                <span className="text-base grayscale opacity-50">{d.emoji}</span>
                                <span className="text-xs font-medium text-zinc-400 truncate">
                                  {d.dishTitle}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                              <span className="flex items-center space-x-1">
                                <Lock className="w-3 h-3 text-zinc-400" />
                                <span>Past Date</span>
                              </span>
                              <span className="text-[9px] uppercase tracking-wider">Unavailable</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={d.dateStr}
                          className={`p-3 rounded-2xl border transition text-left flex flex-col justify-between ${
                            currentPortions > 0
                              ? 'bg-orange-50/60 border-[#FF4C00] shadow-xs'
                              : movingFromDateStr
                              ? 'bg-amber-50/40 border-amber-300 hover:border-black cursor-pointer'
                              : 'bg-white border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-zinc-500 uppercase">{d.dayName}</span>
                              <span className="font-black text-black">{d.fullDateFormatted}</span>
                            </div>
                            <div className="flex items-center space-x-2 my-1">
                              <span className="text-lg">{d.emoji}</span>
                              <span className="text-xs font-bold text-zinc-900 truncate">
                                {d.dishTitle}
                              </span>
                            </div>
                            {isFriday && (
                              <span className="text-[10px] font-bold text-[#FF4C00] block mt-0.5">
                                Swallow Friday
                              </span>
                            )}
                          </div>

                          <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between">
                            {currentPortions > 0 ? (
                              <div className="flex items-center space-x-1.5 w-full justify-between">
                                <span className="text-xs font-black text-[#FF4C00]">
                                  +{currentPortions} {currentPortions === 1 ? 'Plate' : 'Plates'}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDecrementDay(d.dateStr)}
                                    className="w-6 h-6 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-black flex items-center justify-center font-bold text-xs cursor-pointer"
                                    title="Decrease plate"
                                  >
                                    -
                                  </button>
                                  <button
                                    type="button"
                                    disabled={remainingToAllocate <= 0}
                                    onClick={() => handlePickDay(d)}
                                    className="w-6 h-6 rounded-lg bg-black text-white hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center font-bold text-xs cursor-pointer"
                                    title="Add plate"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ) : movingFromDateStr ? (
                              <button
                                type="button"
                                onClick={() => handlePickDay(d)}
                                className="w-full py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-black text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-xs transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Move Credit Here</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={remainingToAllocate <= 0}
                                onClick={() => handlePickDay(d)}
                                className="w-full py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center space-x-1 disabled:opacity-40 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#FF4C00]" />
                                <span>Add Extra Plate</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary of What Was Picked Prompt */}
                {Object.keys(allocations).length > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                        Allocated Extra Plates Summary:
                      </span>
                      <span className="text-[10px] text-zinc-400">Click "Move Date" to transfer a credit to another day</span>
                    </div>

                    <div className="space-y-1.5">
                      {(Object.values(allocations) as CreditRedemptionDayItem[]).map((item) => (
                        <div
                          key={item.dateStr}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-white p-2.5 rounded-xl border border-zinc-200"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-black">{item.dateStr}:</span>
                            <span className="text-zinc-600 truncate max-w-xs">{item.dishName}</span>
                            {item.swallowChoice && (
                              <span className="text-[10px] font-black uppercase bg-orange-100 text-[#FF4C00] px-2 py-0.5 rounded-full">
                                {item.swallowChoice}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 self-end sm:self-auto">
                            <span className="font-black text-[#FF4C00]">
                              +{item.portions} {item.portions === 1 ? 'Plate' : 'Plates'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setMovingFromDateStr(item.dateStr)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition"
                              title="Move this credit to any upcoming workday unlimitedly"
                            >
                              <RotateCcw className="w-3 h-3 text-[#FF4C00]" />
                              <span>Move Date</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-full border border-zinc-300 text-zinc-700 text-xs font-bold hover:border-black cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    disabled={remainingToAllocate > 0 || totalAllocated === 0}
                    onClick={handleFinalSubmit}
                    className="px-6 py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 transition cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Credit Usage ({totalAllocated} Meals)</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* FRIDAY SWALLOW SELECTION SUB-MODAL */}
      {pendingFridayDate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 font-['Poppins']">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 text-left space-y-4 shadow-2xl animate-in zoom-in-95">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] block">
                Friday Swallow Selection
              </span>
              <h4 className="text-lg font-black text-black mt-0.5">
                Choose Your Swallow for Friday Extra Plate
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                {pendingFridayDate.fullDateFormatted} • {pendingFridayDate.dishName}
              </p>
            </div>

            <div className="space-y-2">
              {(['Semo', 'Eba', 'Fufu'] as SwallowType[]).map((swallow) => (
                <button
                  key={swallow}
                  type="button"
                  onClick={() => setSelectedFridaySwallow(swallow)}
                  className={`w-full p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    selectedFridaySwallow === swallow
                      ? 'border-black bg-black text-white shadow-xs'
                      : 'border-zinc-200 bg-[#FAF7F2] text-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">🥣</span>
                    <span>Fresh Hot {swallow}</span>
                  </div>
                  {selectedFridaySwallow === swallow && (
                    <CheckCircle2 className="w-4 h-4 text-[#FF4C00]" />
                  )}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPendingFridayDate(null)}
                className="px-4 py-2.5 rounded-full border border-zinc-200 text-xs font-bold text-zinc-600 hover:border-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFridaySelection}
                className="px-5 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Confirm Friday Swallow
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
