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
  const [filterMode, setFilterMode] = useState<'all' | 'upcoming' | 'past' | 'skipped'>('all');
  const [selectedMealModal, setSelectedMealModal] = useState<any | null>(null);
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
    const allRedemptions: CreditRedemptionOrder[] = [
      ...(userProfile.creditRedemptions || []),
      ...(creditRedemptions || []).filter(
        (r) => r.userId === userProfile.id || (userProfile.email && r.userName === userProfile.name)
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

      // 2. Extra Plates Used with Credits on this Date (rendered immediately after this date's main meal)
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

  // Filtered view
  const filteredLunches = useMemo(() => {
    if (filterMode === 'upcoming') {
      return lunchesList.filter((l) => (l.dateStr >= todayStr && !l.isSkipped) || (l.isCreditPlate && l.dateStr >= todayStr));
    }
    if (filterMode === 'past') {
      return lunchesList.filter((l) => l.isPast && !l.isSkipped);
    }
    if (filterMode === 'skipped') {
      return lunchesList.filter((l) => l.isSkipped || l.isCreditPlate);
    }
    return lunchesList;
  }, [lunchesList, filterMode, todayStr]);

  const handleConfirmSkip = () => {
    if (dateToSkip) {
      onSkipLunch(dateToSkip);
      setDateToSkip(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Lunches</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {lunchesList.length} Scheduled Days
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Your personal workday lunch schedule, delivery tracking, and skip controls
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddDaysModal}
          className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add More Workdays</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-200 pb-3 overflow-x-auto">
        {[
          { id: 'all' as const, label: `All Lunches (${lunchesList.length})` },
          { id: 'upcoming' as const, label: `Upcoming (${lunchesList.filter((l) => l.dateStr >= todayStr && !l.isSkipped).length})` },
          { id: 'past' as const, label: `Past Delivered (${lunchesList.filter((l) => l.isPast && !l.isSkipped).length})` },
          { id: 'skipped' as const, label: `Skipped / Credits (${lunchesList.filter((l) => l.isSkipped).length})` },
        ].map((tab) => {
          const isActive = filterMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lunches Grid / List */}
      <div className="space-y-3">
        {filteredLunches.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
            <CalendarIcon className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No lunches found in this view</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Select another filter tab or add more workdays to your plan.
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

              // Status styles
              let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
              if (item.status === 'Preparing') badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
              if (item.status === 'On the way') badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
              if (item.status === 'Delivered') badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              if (item.status === 'Skipped') badgeStyle = 'bg-zinc-100 text-zinc-600 border-zinc-200';
              if (item.status === 'Credit Plate') badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300';

              const watCutoff = checkWatCutoffStatus();
              const hasUsedCreditOnThisDate = Boolean(
                (userProfile.creditUsedDates || []).includes(item.dateStr) ||
                (userProfile.creditRedemptions || []).some((r) => (r.items || []).some((it) => it.dateStr === item.dateStr))
              );

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4.5 transition shadow-2xs flex flex-col justify-between space-y-3 ${
                    item.isCreditPlate
                      ? 'bg-emerald-50/30 border-2 border-emerald-400/90 ring-2 ring-emerald-500/10'
                      : item.isToday
                      ? 'bg-white border-[#FF4C00] ring-2 ring-[#FF4C00]/10'
                      : item.isSkipped
                      ? 'bg-white border-zinc-200 opacity-75'
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
                            <span>
                              Extra Plate (Credit Used{item.creditTotalForDay && item.creditTotalForDay > 1 ? ` #${item.creditIndex}` : ''})
                            </span>
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
                        <span className="inline-block mt-1 text-[10px] font-bold text-[#FF4C00] bg-orange-50 px-2 py-0.5 rounded-md">
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
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1" title="Credit plate is locked in and cannot be skipped">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Credit Plate Confirmed</span>
                        </span>
                      ) : item.isSkipped ? (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1" title="Already skipped and preserved in wallet">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Credit In Wallet</span>
                        </span>
                      ) : !item.isPast ? (
                        // Day has NOT been skipped and is NOT a credit plate.
                        // Also check if user has already redeemed a credit on this date: if so, skip feature is removed.
                        hasUsedCreditOnThisDate ? (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            Credit active on this date
                          </span>
                        ) : !watCutoff.isActionAllowed ? (
                          <span className="text-[10px] text-zinc-400 font-medium" title={watCutoff.reason}>
                            Skip locked (12–5 PM WAT)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDateToSkip(item.dateStr)}
                            className="text-amber-700 hover:text-amber-900 font-semibold flex items-center space-x-1 cursor-pointer"
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
                This lunch will be removed from that day's delivery schedule. <strong>1 lunch credit</strong> will be instantly added to your Lunch Wallet.
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

      {/* Meal Details Modal */}
      {selectedMealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Dish Overview</h3>
              <button
                onClick={() => setSelectedMealModal(null)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="aspect-video rounded-xl overflow-hidden bg-zinc-100">
                <img
                  src={selectedMealModal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'}
                  alt={selectedMealModal.mealName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#FF4C00]">Category</span>
                <h4 className="text-base font-bold text-zinc-900">{selectedMealModal.mealName}</h4>
              </div>
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
