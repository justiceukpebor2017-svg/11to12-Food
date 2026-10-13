import React, { useState, useMemo, useEffect } from 'react';
import {
  UserProfile,
  SelectedLunchDay,
  CreditRedemptionOrder,
  StructuredMeal,
  SwallowType,
} from '../../../types';
import { getStructuredMealForDateStr, subscribeMenuChanges } from '../../../data/menuRotation';
import { checkWatCutoffStatus } from '../../../utils/timeCutoff';
import {
  Calendar as CalendarIcon,
  RotateCcw,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Truck,
  Filter,
  X,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Utensils,
} from 'lucide-react';

export interface LunchScheduleItem {
  id: string;
  dateStr: string;
  day: string;
  meal: StructuredMeal;
  selectedSwallow?: SwallowType;
  status: 'Scheduled' | 'Preparing' | 'On the way' | 'Delivered' | 'Skipped' | 'Credit Plate';
  isPast: boolean;
  isToday: boolean;
  isSkipped: boolean;
  isCreditPlate: boolean;
  creditIndex?: number;
  creditTotalForDay?: number;
}

interface CustomerMyLunchesTabProps {
  userProfile: UserProfile;
  onSkipLunch: (dateStr: string) => void;
  onOpenAddDaysModal: () => void;
  creditRedemptions?: CreditRedemptionOrder[];
}

export const CustomerMyLunchesTab: React.FC<CustomerMyLunchesTabProps> = ({
  userProfile,
  onSkipLunch,
  onOpenAddDaysModal,
  creditRedemptions = [],
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterMode, setFilterMode] = useState<'all' | 'upcoming' | 'past' | 'skipped'>('all');
  const [selectedMealModal, setSelectedMealModal] = useState<StructuredMeal | null>(null);
  const [dateToSkip, setDateToSkip] = useState<string | null>(null);
  const [, setMenuUpdateVersion] = useState(0);

  useEffect(() => {
    const unsub = subscribeMenuChanges(() => {
      setMenuUpdateVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  const formatYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = formatYmd(new Date());

  // Unified schedule list incorporating both standard meals and extra plates from used credits
  const lunchesList = useMemo(() => {
    const skippedSet = new Set(userProfile.skippedDates || []);

    // Combine redemptions from userProfile and creditRedemptions prop
    const cleanUserEmail = (userProfile.email || '').toLowerCase().trim();
    const allRedemptions: CreditRedemptionOrder[] = [
      ...(userProfile.creditRedemptions || []),
      ...(creditRedemptions || []).filter(
        (r) =>
          (userProfile.id && r.userId === userProfile.id) ||
          Boolean(cleanUserEmail && r.email && r.email.toLowerCase().trim() === cleanUserEmail)
      ),
    ];

    // Deduplicate redemptions by id
    const redemptionMap = new Map<string, CreditRedemptionOrder>();
    allRedemptions.forEach((r) => {
      if (r && r.id && !redemptionMap.has(r.id)) {
        redemptionMap.set(r.id, r);
      }
    });

    // Group credit plates by dateStr
    const creditPlatesByDate: Record<
      string,
      Array<{
        redemptionId: string;
        dishName: string;
        swallowChoice?: SwallowType;
        index: number;
      }>
    > = {};

    Array.from(redemptionMap.values()).forEach((order) => {
      (order.items || []).forEach((item) => {
        const d = item.dateStr;
        if (!creditPlatesByDate[d]) creditPlatesByDate[d] = [];
        const count = Math.max(1, item.portions || 1);
        for (let p = 0; p < count; p++) {
          creditPlatesByDate[d].push({
            redemptionId: order.id,
            dishName: item.dishName,
            swallowChoice: item.swallowChoice,
            index: creditPlatesByDate[d].length + 1,
          });
        }
      });
    });

    // Fallback: also ensure any dates in userProfile.creditUsedDates are scheduled
    (userProfile.creditUsedDates || []).forEach((d) => {
      if (!creditPlatesByDate[d]) {
        creditPlatesByDate[d] = [
          {
            redemptionId: `credit-date-${d}`,
            dishName: getStructuredMealForDateStr(d)?.mealName || 'Chef Fresh Daily Special',
            swallowChoice: undefined,
            index: 1,
          },
        ];
      }
    });

    // Collect all unique dates across selectedDays and credit redemptions
    const allDatesSet = new Set<string>();
    (userProfile.selectedDays || []).forEach((d) => allDatesSet.add(d.dateStr));
    Object.keys(creditPlatesByDate).forEach((d) => allDatesSet.add(d));

    const sortedDates = Array.from(allDatesSet).sort((a, b) => a.localeCompare(b));
    const result: LunchScheduleItem[] = [];

    sortedDates.forEach((dateStr) => {
      const targetDate = new Date(dateStr + 'T00:00:00');
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetDate.getDay()];
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;

      // 1. Primary Scheduled Meal (if on plan)
      const primaryPlanDay = (userProfile.selectedDays || []).find((d) => d.dateStr === dateStr);
      if (primaryPlanDay) {
        const currentMeal = getStructuredMealForDateStr(dateStr) || primaryPlanDay.meal;
        const isSkipped = skippedSet.has(dateStr);

        let status: 'Scheduled' | 'Preparing' | 'On the way' | 'Delivered' | 'Skipped' = 'Scheduled';
        if (isSkipped) {
          status = 'Skipped';
        } else if (isPast) {
          status = 'Delivered';
        } else if (isToday) {
          const curHour = new Date().getHours();
          if (curHour >= 12) status = 'Delivered';
          else if (curHour >= 11) status = 'On the way';
          else if (curHour >= 10) status = 'Preparing';
          else status = 'Scheduled';
        }

        result.push({
          id: `main-${dateStr}`,
          dateStr,
          day: primaryPlanDay.day || dayName,
          meal: currentMeal,
          selectedSwallow: primaryPlanDay.selectedSwallow,
          status,
          isPast,
          isToday,
          isSkipped,
          isCreditPlate: false,
        });
      }

      // 2. Extra Plates Used with Credits on this Date
      const creditsForThisDate = creditPlatesByDate[dateStr] || [];
      creditsForThisDate.forEach((creditItem) => {
        const structuredMeal = getStructuredMealForDateStr(dateStr) || {
          id: `credit-meal-${dateStr}-${creditItem.index}`,
          dateStr,
          day: dayName as any,
          mealName: creditItem.dishName || 'Chef Fresh Daily Special',
          mealCategory: (creditItem.swallowChoice ? 'Swallow' : 'Rice') as any,
          ingredients: ['Fresh seasonal office lunch', 'Protein', 'Side'],
        };

        result.push({
          id: `credit-${dateStr}-${creditItem.redemptionId}-${creditItem.index}`,
          dateStr,
          day: dayName,
          meal: structuredMeal,
          selectedSwallow: creditItem.swallowChoice,
          status: isPast ? 'Delivered' : 'Credit Plate',
          isPast,
          isToday,
          isSkipped: false,
          isCreditPlate: true,
          creditIndex: creditItem.index,
          creditTotalForDay: creditsForThisDate.length,
        });
      });
    });

    return result;
  }, [userProfile.selectedDays, userProfile.skippedDates, userProfile.creditRedemptions, creditRedemptions, userProfile.id, userProfile.email, userProfile.name, todayStr]);

  // Strict count separation: Skipped days are removed from the active count as requested!
  const activeLunches = useMemo(() => {
    return lunchesList.filter((l) => !l.isSkipped);
  }, [lunchesList]);

  const skippedLunches = useMemo(() => {
    return lunchesList.filter((l) => l.isSkipped);
  }, [lunchesList]);

  const activeCount = activeLunches.length;
  const skippedCount = skippedLunches.length;
  const upcomingCount = lunchesList.filter(
    (l) => (l.dateStr >= todayStr && !l.isSkipped) || (l.isCreditPlate && l.dateStr >= todayStr)
  ).length;
  const pastDeliveredCount = lunchesList.filter((l) => l.isPast && !l.isSkipped).length;

  // Filtered view for Card List
  const filteredLunches = useMemo(() => {
    if (filterMode === 'upcoming') {
      return lunchesList.filter((l) => (l.dateStr >= todayStr && !l.isSkipped) || (l.isCreditPlate && l.dateStr >= todayStr));
    }
    if (filterMode === 'past') {
      return lunchesList.filter((l) => l.isPast && !l.isSkipped);
    }
    if (filterMode === 'skipped') {
      return lunchesList.filter((l) => l.isSkipped);
    }
    // "all": Strictly active lunches (skipped days removed from count and list)
    return activeLunches;
  }, [lunchesList, activeLunches, filterMode, todayStr]);

  // Calendar Month State
  const initialMonthDate = useMemo(() => {
    const firstDate = lunchesList.find((l) => !l.isSkipped)?.dateStr || lunchesList[0]?.dateStr;
    if (firstDate) {
      const parts = firstDate.split('-').map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return new Date(parts[0], parts[1] - 1, 1);
      }
    }
    return new Date(2026, 11, 1); // Launch month: Dec 2026
  }, [lunchesList]);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(initialMonthDate);

  const handlePrevMonth = () => {
    setCurrentMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const monthYearLabel = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Calendar Day Grid Computation
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    // Week starts on Monday: Monday = 0, ..., Sunday = 6
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isWeekend: boolean;
      isFriday: boolean;
      isToday: boolean;
      items: LunchScheduleItem[];
    }> = [];

    // Prepend blanks for leading days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateStr: `blank-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
        isWeekend: false,
        isFriday: false,
        isToday: false,
        items: [],
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      const dayOfWeek = new Date(year, month, d).getDay(); // 0 Sun, 6 Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFriday = dayOfWeek === 5;
      const isToday = dateStr === todayStr;

      const items = lunchesList.filter((l) => l.dateStr === dateStr);

      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isWeekend,
        isFriday,
        isToday,
        items,
      });
    }

    return days;
  }, [currentMonthDate, lunchesList, todayStr]);

  const handleConfirmSkip = () => {
    if (dateToSkip) {
      onSkipLunch(dateToSkip);
      setDateToSkip(null);
    }
  };

  const watCutoff = checkWatCutoffStatus();

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-['Poppins']">
      
      {/* Header with Brand Styling */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">My Lunches</h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-[#FF4C00] border border-orange-200/80 shadow-2xs">
              {activeCount} Active Lunches
            </span>
            {skippedCount > 0 && (
              <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                {skippedCount} Skipped in Wallet
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Personal workday deliveries, live status, and meal skip controls.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Calendar vs List Segmented Switcher */}
          <div className="flex items-center bg-zinc-100/90 p-1 rounded-2xl border border-zinc-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddDaysModal}
            className="px-3.5 py-2 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Workdays</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4C00] flex items-center justify-center font-bold">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                  {monthYearLabel}
                </h2>
                <span className="text-[11px] text-zinc-500 font-medium">
                  Desk deliveries 11:00 AM – 12:00 PM • Monday to Friday
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 transition cursor-pointer shadow-2xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 transition cursor-pointer shadow-2xs"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider pb-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span className="text-[#FF4C00]">Fri</span>
            <span className="text-zinc-400">Sat</span>
            <span className="text-zinc-400">Sun</span>
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`blank-${idx}`}
                    className="min-h-[85px] sm:min-h-[110px] rounded-2xl bg-zinc-50/40 border border-transparent"
                  />
                );
              }

              const hasItems = cell.items.length > 0;
              const activeItem = cell.items.find((it) => !it.isSkipped);
              const skippedItem = cell.items.find((it) => it.isSkipped);
              const creditPlateItem = cell.items.find((it) => it.isCreditPlate);

              // Cell Styling
              let cellBg = 'bg-white border-zinc-200/80 hover:border-zinc-300';
              if (cell.isWeekend) {
                cellBg = 'bg-zinc-50/60 border-zinc-100 text-zinc-400';
              } else if (cell.isToday) {
                cellBg = 'bg-orange-50/30 border-[#FF4C00] ring-2 ring-[#FF4C00]/20 shadow-xs';
              } else if (creditPlateItem) {
                cellBg = 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-400';
              } else if (activeItem) {
                cellBg = 'bg-white border-orange-200/90 hover:border-[#FF4C00]/70 hover:shadow-xs';
              } else if (skippedItem) {
                cellBg = 'bg-zinc-50/70 border-dashed border-zinc-300 opacity-80';
              }

              return (
                <div
                  key={cell.dateStr}
                  className={`min-h-[92px] sm:min-h-[115px] p-2 rounded-2xl border transition flex flex-col justify-between ${cellBg}`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        cell.isToday
                          ? 'text-[#FF4C00]'
                          : cell.isWeekend
                          ? 'text-zinc-400'
                          : activeItem
                          ? 'text-zinc-900'
                          : 'text-zinc-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {cell.isToday && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-white bg-[#FF4C00] px-1.5 py-0.2 rounded-full">
                        Today
                      </span>
                    )}

                    {cell.isFriday && !cell.isWeekend && (
                      <span className="text-[9px] font-bold text-[#FF4C00] hidden sm:inline">
                        Swallow
                      </span>
                    )}
                  </div>

                  {/* Day Content */}
                  <div className="my-1 flex-1 flex flex-col justify-center">
                    {cell.isWeekend ? (
                      <span className="text-[10px] text-zinc-400 font-medium block text-center">
                        Weekend
                      </span>
                    ) : hasItems ? (
                      <div className="space-y-1">
                        {cell.items.map((item) => {
                          const isItemSkipped = item.isSkipped;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedMealModal(item.meal)}
                              className={`p-1 sm:p-1.5 rounded-xl text-left cursor-pointer transition ${
                                isItemSkipped
                                  ? 'bg-zinc-100 text-zinc-500 border border-dashed border-zinc-300'
                                  : item.isCreditPlate
                                  ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 hover:bg-emerald-200/80'
                                  : 'bg-orange-50/80 text-zinc-900 border border-orange-200/80 hover:bg-orange-100/80'
                              }`}
                              title={`${item.meal.mealName} (Tap to view)`}
                            >
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] sm:text-[11px] font-bold truncate block">
                                  {item.meal.mealName}
                                </span>
                              </div>

                              {item.selectedSwallow && (
                                <span className="text-[9px] font-black text-[#FF4C00] block mt-0.5">
                                  {item.selectedSwallow}
                                </span>
                              )}

                              {isItemSkipped ? (
                                <span className="text-[9px] font-bold text-amber-700 block mt-0.5">
                                  Skipped · Credit
                                </span>
                              ) : item.isCreditPlate ? (
                                <span className="text-[9px] font-black text-emerald-800 block mt-0.5">
                                  ⭐ Extra Plate
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-400 block text-center">
                        —
                      </span>
                    )}
                  </div>

                  {/* Quick Action Footer in Day Cell */}
                  {activeItem && !activeItem.isPast && !activeItem.isCreditPlate && !activeItem.isSkipped && (
                    <div className="pt-1 border-t border-zinc-100 flex items-center justify-between text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSelectedMealModal(activeItem.meal)}
                        className="text-zinc-600 hover:text-black font-semibold cursor-pointer"
                      >
                        Details
                      </button>

                      {watCutoff.isActionAllowed && (
                        <button
                          type="button"
                          onClick={() => setDateToSkip(activeItem.dateStr)}
                          className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  )}

                  {skippedItem && (
                    <div className="pt-0.5 border-t border-zinc-200 text-[9px] text-emerald-700 font-bold text-center">
                      Preserved in Wallet
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Quick Legend Bar */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-zinc-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4C00]" />
                <span className="font-semibold text-zinc-800">Active Lunch</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-zinc-800">Credit Extra Plate</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                <span className="font-semibold text-zinc-800">Skipped (In Wallet)</span>
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">
              Cutoff Window: 12:00 PM – 5:00 PM WAT
            </span>
          </div>

        </div>
      )}

      {/* VIEW 2: CARD LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          
          {/* Filter Tabs: Strict exclusion of skipped days from All Lunches count! */}
          <div className="flex items-center space-x-2 border-b border-zinc-200 pb-3 overflow-x-auto">
            {[
              { id: 'all' as const, label: `All Lunches (${activeCount})` },
              { id: 'upcoming' as const, label: `Upcoming (${upcomingCount})` },
              { id: 'past' as const, label: `Past Delivered (${pastDeliveredCount})` },
              { id: 'skipped' as const, label: `Skipped (${skippedCount})` },
            ].map((tab) => {
              const isActive = filterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-2xs font-bold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Lunches Cards */}
          {filteredLunches.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
              <CalendarIcon className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-700">No lunches in this filter</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Switch filters or tap Add Workdays to book more meals.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredLunches.map((item) => {
                const dateObj = new Date(item.dateStr + 'T00:00:00');
                const formattedDate = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                let badgeStyle = 'bg-orange-50 text-[#FF4C00] border-orange-200';
                if (item.status === 'Preparing') badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                if (item.status === 'On the way') badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
                if (item.status === 'Delivered') badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                if (item.status === 'Skipped') badgeStyle = 'bg-zinc-100 text-zinc-600 border-zinc-200';
                if (item.status === 'Credit Plate') badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300';

                const hasUsedCreditOnThisDate = Boolean(
                  (userProfile.creditUsedDates || []).includes(item.dateStr) ||
                  (userProfile.creditRedemptions || []).some((r) =>
                    (r.items || []).some((it) => it.dateStr === item.dateStr)
                  )
                );

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4.5 transition shadow-2xs flex flex-col justify-between space-y-3 ${
                      item.isCreditPlate
                        ? 'bg-emerald-50/30 border-2 border-emerald-400 ring-2 ring-emerald-500/10'
                        : item.isToday
                        ? 'bg-white border-[#FF4C00] ring-2 ring-[#FF4C00]/10'
                        : item.isSkipped
                        ? 'bg-zinc-50/70 border-dashed border-zinc-300 opacity-80'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      {/* Top Date & Status Badge */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-zinc-900">
                            {formattedDate}
                          </span>
                          {item.isToday && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-white bg-[#FF4C00] px-1.5 py-0.5 rounded-full">
                              Today
                            </span>
                          )}
                          {item.isCreditPlate && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Extra Plate (Credit)</span>
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Meal Title & Swallow */}
                      <div className="mt-2.5">
                        <h3 className="text-sm font-bold text-zinc-900 leading-snug">
                          {item.meal.mealName}
                        </h3>
                        {item.selectedSwallow && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-[#FF4C00] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/80">
                            Swallow: {item.selectedSwallow}
                          </span>
                        )}
                        <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                          {item.isCreditPlate
                            ? 'Extra meal redeemed with Lunch Wallet credit • Warm desk delivery'
                            : `Category: ${item.meal.mealCategory}`}
                        </p>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedMealModal(item.meal)}
                        className="text-zinc-600 hover:text-black font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Meal Details</span>
                      </button>

                      {item.isCreditPlate ? (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Credit Plate Confirmed</span>
                        </span>
                      ) : item.isSkipped ? (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Credit In Wallet</span>
                        </span>
                      ) : !item.isPast ? (
                        hasUsedCreditOnThisDate ? (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            Credit locked
                          </span>
                        ) : !watCutoff.isActionAllowed ? (
                          <span className="text-[10px] text-zinc-400 font-medium" title={watCutoff.reason}>
                            Skip locked (12–5 PM WAT)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDateToSkip(item.dateStr)}
                            className="text-amber-700 hover:text-amber-900 font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Skip Lunch</span>
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Skip Confirmation Modal */}
      {dateToSkip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-zinc-900">Skip Lunch for {dateToSkip}?</h3>
              <p className="text-xs text-zinc-600">
                This meal will be removed from that day's delivery. <strong>1 lunch credit</strong> will be safely added to your Lunch Wallet.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDateToSkip(null)}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                className="px-4 py-2 rounded-xl bg-[#FF4C00] text-white text-xs font-bold hover:bg-[#E04300] cursor-pointer shadow-xs"
              >
                Yes, Skip Lunch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rich Meal Details Modal */}
      {selectedMealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <Utensils className="w-4 h-4 text-[#FF4C00]" />
                <h3 className="text-base font-bold text-zinc-900">Meal Details</h3>
              </div>
              <button
                onClick={() => setSelectedMealModal(null)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {selectedMealModal.imageUrl && (
                <div className="aspect-video rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                  <img
                    src={selectedMealModal.imageUrl}
                    alt={selectedMealModal.mealName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF4C00]">
                  {selectedMealModal.mealCategory}
                </span>
                <h4 className="text-base font-bold text-zinc-900 mt-0.5">
                  {selectedMealModal.mealName}
                </h4>
                {selectedMealModal.description && (
                  <p className="text-zinc-600 mt-1 leading-relaxed">
                    {selectedMealModal.description}
                  </p>
                )}
              </div>

              {selectedMealModal.ingredients && selectedMealModal.ingredients.length > 0 && (
                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-[11px] font-bold text-zinc-800 block mb-1">
                    Ingredients & Sides:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMealModal.ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 text-[10px] font-medium"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMealModal(null)}
                className="px-4 py-2 rounded-xl bg-black text-white font-semibold text-xs hover:bg-zinc-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
