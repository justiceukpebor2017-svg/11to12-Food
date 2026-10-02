import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  X,
  Sparkles,
  Info,
  Clock,
  Lock,
  PhoneCall,
  CreditCard,
  ArrowRight,
  ShoppingBag,
  Calculator,
  AlertCircle,
  Loader2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { getStructuredMealForDate } from '../../data/menuRotation';
import {
  SwallowType,
  SelectedLunchDay,
  OrderSummary,
  calculateOrderSummary,
  calculateMealPrice,
  PER_DAY_FEE,
  CreditRedemptionDayItem,
  CreditRedemptionOrder,
  OrderSubmission,
  UserProfile,
  parseLocalDate,
} from '../../types';
import { CreditUsageModal } from './CreditUsageModal';
import { InvoiceSlipModal } from '../marketing/InvoiceSlipModal';
import { downloadInvoiceDocument } from '../../utils/invoiceDownload';

export interface CalendarDayPlan {
  dateStr: string; // "2026-10-06"
  dayNum: number;
  dayName: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  fullDateFormatted: string; // "Tuesday, October 6, 2026"
  dishTitle: string;
  emoji: string;
  ingredients: string[];
  isSwallow?: boolean;
  selectedSwallow?: SwallowType;
  status: 'selected' | 'skipped' | 'unselected';
  portions?: number;
  hasApprovedCreditPlate?: boolean;
}

interface MyLunchesSectionProps {
  daysMap: Record<string, CalendarDayPlan>;
  onToggleDaySelection: (dateStr: string) => void;
  onToggleSkipDay: (dateStr: string) => void;
  onSelectSwallow: (dateStr: string, swallow: SwallowType) => void;
  totalSubscribed: number; // e.g. 20
  creditsCount: number;
  isAfter12PM?: boolean;
  isAfter4PM?: boolean;
  skipCount?: number;
  maxSkips?: number;
  todayDateStr?: string;
  onProceedToCheckout?: (selectedDays: SelectedLunchDay[], summary: OrderSummary) => void;
  onAddDaysPreset?: (daysCount: number) => void;
  onConfirmCreditUsage?: (items: CreditRedemptionDayItem[], totalCredits: number) => void;
  pendingCreditRedemptions?: CreditRedemptionOrder[];
  onMoveCreditDate?: (redemptionId: string, oldDateStr: string, newDateStr: string, newSwallow?: SwallowType) => void;
  userProfile?: UserProfile;
  onTopUpOrderSubmitted?: (order: OrderSubmission) => void;
}

export const MyLunchesSection: React.FC<MyLunchesSectionProps> = ({
  daysMap,
  onToggleDaySelection,
  onToggleSkipDay,
  onSelectSwallow,
  totalSubscribed = 20,
  creditsCount = 0,
  isAfter12PM = false,
  isAfter4PM = false,
  skipCount = 0,
  maxSkips = 4,
  todayDateStr = new Date().toISOString().split('T')[0],
  onProceedToCheckout,
  onAddDaysPreset,
  onConfirmCreditUsage,
  pendingCreditRedemptions = [],
  onMoveCreditDate,
  userProfile,
  onTopUpOrderSubmitted,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [activeDateModal, setActiveDateModal] = useState<CalendarDayPlan | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Move Existing Credit State
  const [movingRedemptionItem, setMovingRedemptionItem] = useState<{
    redemptionId: string;
    oldDateStr: string;
    dishName?: string;
    swallowChoice?: SwallowType;
  } | null>(null);
  const [movingTargetDateStr, setMovingTargetDateStr] = useState<string | null>(null);
  const [movingTargetSwallow, setMovingTargetSwallow] = useState<SwallowType>('Semo');
  const [moveMonthOffset, setMoveMonthOffset] = useState<number>(0);
  const [creditMoveSuccessNotice, setCreditMoveSuccessNotice] = useState<string | null>(null);

  // New Lunch Plan state (for days clicked that are not in plan)
  const [newPlanDays, setNewPlanDays] = useState<CalendarDayPlan[]>([]);
  const [modalSwallow, setModalSwallow] = useState<SwallowType>('Semo');
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);
  const [submittedTopUpOrder, setSubmittedTopUpOrder] = useState<OrderSubmission | null>(null);
  const [showTopUpSlipModal, setShowTopUpSlipModal] = useState(false);
  const [copiedBankAcc, setCopiedBankAcc] = useState(false);

  // Top-Up Calculation State (Exact calculation synced with home page)
  const [topUpCalculatedSummary, setTopUpCalculatedSummary] = useState<OrderSummary | null>(null);
  const [isCalculatingTopUp, setIsCalculatingTopUp] = useState(false);
  const [topUpValidationError, setTopUpValidationError] = useState<string | null>(null);

  // Helper to convert queued newPlanDays into standard SelectedLunchDay format
  const getTopUpLunchDays = (): SelectedLunchDay[] => {
    return newPlanDays.map((d) => {
      const targetDate = parseLocalDate(d.dateStr);
      const structured = getStructuredMealForDate(targetDate) || {
        id: `meal-${d.dateStr}`,
        dateStr: d.dateStr,
        day: (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetDate.getDay()]) as any,
        mealName: d.dishTitle,
        mealCategory: (d.isSwallow ? 'Swallow' : 'Rice') as any,
        ingredients: d.ingredients,
      };

      return {
        dateStr: d.dateStr,
        meal: structured,
        selectedSwallow: d.selectedSwallow,
      };
    });
  };

  const handleCalculateTopUpOrder = () => {
    if (newPlanDays.length === 0) {
      setTopUpValidationError('Please select at least one lunch day to add to your plan.');
      return;
    }
    setTopUpValidationError(null);
    setIsCalculatingTopUp(true);

    setTimeout(() => {
      const days = getTopUpLunchDays();
      const summary = calculateOrderSummary(days);
      setTopUpCalculatedSummary(summary);
      setIsCalculatingTopUp(false);
    }, 350);
  };

  // Check 5:00 PM cutoff
  const currentHour = new Date().getHours();
  const isAfter5PM = currentHour >= 17;

  // Month navigation: dynamically start at the real current month
  const now = new Date();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  // Generate all Monday-Friday workdays for the viewed month
  const getWorkdaysForMonth = () => {
    const list: CalendarDayPlan[] = [];
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonthIndex, day);
      const dayOfWeek = d.getDay(); // 0 Sun, 6 Sat
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // Check if user already has an entry in daysMap
      if (daysMap[dateStr]) {
        list.push(daysMap[dateStr]);
      } else {
        // Fallback to structured menu rotation
        const structured = getStructuredMealForDate(d);
        const dayNamesShort: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const dayShort = dayNamesShort[dayOfWeek - 1] || 'Mon';

        const dishTitle = structured?.mealName || 'Chef Choice Lunch';
        let emoji = '🍚';
        if (dishTitle.toLowerCase().includes('bean')) emoji = '🫘';
        else if (dishTitle.toLowerCase().includes('pasta') || dishTitle.toLowerCase().includes('spag')) emoji = '🍝';
        else if (dishTitle.toLowerCase().includes('swallow') || dishTitle.toLowerCase().includes('egusi') || dishTitle.toLowerCase().includes('semo')) emoji = '🍲';
        else if (dishTitle.toLowerCase().includes('chicken')) emoji = '🍗';
        else if (dishTitle.toLowerCase().includes('meat') || dishTitle.toLowerCase().includes('beef')) emoji = '🥩';
        else if (dishTitle.toLowerCase().includes('yam')) emoji = '🍠';
        else if (dishTitle.toLowerCase().includes('fish')) emoji = '🐟';

        list.push({
          dateStr,
          dayNum: day,
          dayName: dayShort,
          fullDateFormatted: d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          dishTitle,
          emoji,
          ingredients: structured?.ingredients || ['Fresh locally sourced produce', 'Chef seasonings'],
          isSwallow: structured?.mealCategory === 'Swallow',
          selectedSwallow: structured?.mealCategory === 'Swallow' ? 'Semo' : undefined,
          status: 'unselected',
        });
      }
    }
    return list;
  };

  const workdays = getWorkdaysForMonth();

  // Metrics
  const selectedCount = (Object.values(daysMap) as CalendarDayPlan[]).filter((d) => d.status === 'selected').length;
  const remainingLunchesToPick = Math.max(0, totalSubscribed - selectedCount);

  // Convert selected days to SelectedLunchDay format for ordering/pricing
  const selectedLunchDays: SelectedLunchDay[] = (Object.values(daysMap) as CalendarDayPlan[])
    .filter((d) => d.status === 'selected')
    .map((d) => {
      const targetDate = parseLocalDate(d.dateStr);
      const structured = getStructuredMealForDate(targetDate) || {
        id: `meal-${d.dateStr}`,
        dateStr: d.dateStr,
        day: (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetDate.getDay()]) as any,
        mealName: d.dishTitle,
        mealCategory: (d.isSwallow ? 'Swallow' : 'Rice') as any,
        ingredients: d.ingredients,
      };

      return {
        dateStr: d.dateStr,
        meal: structured,
        selectedSwallow: d.selectedSwallow,
      };
    });

  const calculatedBill = calculateOrderSummary(selectedLunchDays);

  const handleProceedCheckout = () => {
    if (onProceedToCheckout) {
      onProceedToCheckout(selectedLunchDays, calculatedBill);
    }
  };

  // Monday to Sunday Worldwide Standard Calendar: Monday = 0, ..., Sunday = 6
  const firstDayIndex = (new Date(currentYear, currentMonthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate();

  const monthGridCells = useMemo(() => {
    const cells: {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isWeekend: boolean;
      dayPlan?: CalendarDayPlan;
    }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const cellDate = new Date(currentYear, currentMonthIndex - 1, d);
      const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
      const dd = String(cellDate.getDate()).padStart(2, '0');
      const dateStr = `${cellDate.getFullYear()}-${mm}-${dd}`;
      const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isWeekend,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentYear, currentMonthIndex, day);
      const dayOfWeek = cellDate.getDay(); // 0 Sun, 6 Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const yyyy = cellDate.getFullYear();
      const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      let dayPlan: CalendarDayPlan | undefined = undefined;

      if (!isWeekend) {
        if (daysMap[dateStr]) {
          dayPlan = daysMap[dateStr];
        } else {
          const structured = getStructuredMealForDate(cellDate);
          const dayNamesShort: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          const dayShort = dayNamesShort[dayOfWeek - 1] || 'Mon';

          const dishTitle = structured?.mealName || 'Chef Choice Lunch';
          let emoji = '🍚';
          if (dishTitle.toLowerCase().includes('bean')) emoji = '🫘';
          else if (dishTitle.toLowerCase().includes('pasta') || dishTitle.toLowerCase().includes('spag')) emoji = '🍝';
          else if (dishTitle.toLowerCase().includes('swallow') || dishTitle.toLowerCase().includes('egusi') || dishTitle.toLowerCase().includes('semo')) emoji = '🍲';
          else if (dishTitle.toLowerCase().includes('chicken')) emoji = '🍗';
          else if (dishTitle.toLowerCase().includes('meat') || dishTitle.toLowerCase().includes('beef')) emoji = '🥩';
          else if (dishTitle.toLowerCase().includes('yam')) emoji = '🍠';
          else if (dishTitle.toLowerCase().includes('fish')) emoji = '🐟';

          dayPlan = {
            dateStr,
            dayNum: day,
            dayName: dayShort,
            fullDateFormatted: cellDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            dishTitle,
            emoji,
            ingredients: structured?.ingredients || ['Fresh locally sourced produce', 'Chef seasonings'],
            isSwallow: structured?.mealCategory === 'Swallow',
            selectedSwallow: structured?.mealCategory === 'Swallow' ? 'Semo' : undefined,
            status: 'unselected',
          };
        }
      }

      cells.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isWeekend,
        dayPlan,
      });
    }

    // Next month padding to fill out complete rows of 7
    const totalCellsNeeded = cells.length <= 35 ? 35 : 42;
    const remaining = totalCellsNeeded - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const cellDate = new Date(currentYear, currentMonthIndex + 1, d);
      const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${cellDate.getFullYear()}-${mm}-${dd}`;
      const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isWeekend,
      });
    }

    return cells;
  }, [currentYear, currentMonthIndex, firstDayIndex, daysInMonth, prevMonthDays, daysMap]);

  return (
    <div className="space-y-6 font-['Poppins'] text-left">
      
      {/* Header & Sub-Bar */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] block">
            Custom Lunch Planner
          </span>
          <h2 className="text-2xl font-black text-black">
            My Lunches
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Modify your lunch days directly without starting over. Select, skip, choose your swallow, or pay for more days.
          </p>
        </div>

        {/* Stats Pill Badges & Use Credit CTA */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-black text-white text-xs font-bold">
            <span className="text-zinc-400 block text-[9px] uppercase">Selected</span>
            <span>{selectedCount} of {totalSubscribed} Days</span>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-[#FAF7F2] border border-zinc-200 text-xs font-bold text-black">
            <span className="text-zinc-400 block text-[9px] uppercase">Remaining to pick</span>
            <span className="text-[#FF4C00]">{remainingLunchesToPick} Days</span>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <span className="text-emerald-600 block text-[9px] uppercase">Credits</span>
            <span>{creditsCount} Available</span>
          </div>

          {creditsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCreditModal(true)}
              className="px-4 py-2 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs animate-pulse hover:animate-none"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use {creditsCount} {creditsCount === 1 ? 'Credit' : 'Credits'} →</span>
            </button>
          )}
        </div>
      </div>

      {/* Credit Move Success Toast/Notice */}
      {creditMoveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{creditMoveSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setCreditMoveSuccessNotice(null)}
            className="text-xs text-emerald-800 underline hover:text-black cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Credit Redemptions Banner */}
      {pendingCreditRedemptions && pendingCreditRedemptions.length > 0 && (
        <div className="space-y-2">
          {pendingCreditRedemptions.map((red) => (
            <div
              key={red.id}
              className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start sm:items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-amber-950 text-sm">
                      Extra Plate Request ({red.totalCreditsUsed} {red.totalCreditsUsed === 1 ? 'Credit' : 'Credits'} Used)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                      Pending Admin Verification
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {red.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center space-x-2 bg-white/90 text-zinc-900 px-3 py-1 rounded-xl text-xs font-semibold border border-amber-200 shadow-2xs"
                      >
                        <span>📅 {it.dateStr} (+{it.portions} plate{it.portions > 1 ? 's' : ''}{it.swallowChoice ? ` • ${it.swallowChoice}` : ''})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setMovingRedemptionItem({
                              redemptionId: red.id,
                              oldDateStr: it.dateStr,
                              dishName: it.dishName,
                              swallowChoice: it.swallowChoice,
                            });
                            setMovingTargetDateStr(null);
                            setMoveMonthOffset(0);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-[#FF4C00] hover:text-black text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition"
                          title="Move this credit plate to any upcoming workday unlimitedly"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Move Date</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 self-start sm:self-center font-medium">
                Unlimited date moving allowed before 5:00 PM
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Month Navigation & View Toggle */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Month Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-600 cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-black text-black px-3">
            {monthNames[currentMonthIndex]} {currentYear}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-600 cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar vs List Mode */}
        <div className="flex items-center space-x-1 bg-[#FAF7F2] p-1 rounded-full border border-zinc-200">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'calendar' ? 'bg-black text-white shadow-xs' : 'text-zinc-600 hover:text-black'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'list' ? 'bg-black text-white shadow-xs' : 'text-zinc-600 hover:text-black'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 1. CALENDAR VIEW (HYBRID WORKDAY GRID) */}
      {/* ============================================================== */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl border border-zinc-200 p-5 sm:p-6 shadow-xs overflow-hidden">
          
          {/* Day of Week Header: Mon to Sun Worldwide Standard */}
          <div className="grid grid-cols-7 gap-2 text-center pb-3 border-b border-zinc-150 text-[11px] font-black text-zinc-400 uppercase tracking-wider">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-zinc-400">Sat</span>
            <span className="text-zinc-400">Sun</span>
          </div>

          {/* Calendar Grid of 7 Columns */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 mt-3">
            {monthGridCells.map((cell, idx) => {
              // 1. Previous or next month cell
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`pad-${idx}`}
                    className="p-2 sm:p-2.5 rounded-2xl bg-zinc-50/40 border border-zinc-100 opacity-30 select-none min-h-[105px] sm:min-h-[120px] flex flex-col justify-start"
                  >
                    <span className="text-xs font-semibold text-zinc-300">{cell.dayNumber}</span>
                  </div>
                );
              }

              // 2. Weekend cell (Strictly no meals on Saturday & Sunday)
              if (cell.isWeekend) {
                return (
                  <div
                    key={cell.dateStr}
                    className="p-2 sm:p-2.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/70 opacity-55 select-none cursor-not-allowed min-h-[105px] sm:min-h-[120px] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400">{cell.dayNumber}</span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-200/60 px-1 py-0.2 rounded">
                        Weekend
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-zinc-500 font-semibold block leading-tight">Kitchen Closed</span>
                      <span className="text-[8px] text-zinc-400 font-medium block">Weekdays strictly</span>
                    </div>
                  </div>
                );
              }

              // 3. Workday cell (Monday - Friday) with meal plan data
              const day = cell.dayPlan!;
              const isSelected = day.status === 'selected';
              const isSkipped = day.status === 'skipped';
              const isPast = day.dateStr < todayDateStr;
              const isToday = day.dateStr === todayDateStr;
              const isDelivered = isPast || (isToday && isAfter12PM);

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setActiveDateModal(day)}
                  className={`p-2 sm:p-2.5 rounded-2xl border transition text-left cursor-pointer hover:border-black hover:shadow-xs flex flex-col justify-between min-h-[105px] sm:min-h-[120px] ${
                    isDelivered
                      ? 'bg-zinc-100/70 border-zinc-200 opacity-40 grayscale-[35%]'
                      : isSelected
                      ? 'bg-[#FAF7F2] border-zinc-300'
                      : isSkipped
                      ? 'bg-zinc-100/60 border-zinc-200 opacity-60'
                      : 'bg-white border-dashed border-zinc-250 hover:bg-zinc-50/50'
                  }`}
                >
                  {/* Top: Day Num & Status Symbol */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black text-black">
                      {day.dayNum}
                    </span>
                    
                    {isDelivered ? (
                      <span className="w-4 h-4 rounded-full bg-zinc-400 text-white flex items-center justify-center text-[9px] font-bold" title="Delivered">
                        ✓
                      </span>
                    ) : isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    ) : isSkipped ? (
                      <span className="w-4 h-4 rounded-full bg-zinc-300 text-zinc-700 flex items-center justify-center text-[10px] font-bold">
                        —
                      </span>
                    ) : (
                      <span className="text-zinc-300 text-xs font-bold">
                        +
                      </span>
                    )}
                  </div>

                  {/* Middle: Emoji & Dish Name */}
                  <div className="my-1">
                    <span className="text-sm sm:text-base block">{day.emoji}</span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-zinc-900 line-clamp-1 block mt-0.5" title={day.dishTitle}>
                      {day.dishTitle}
                    </span>
                  </div>

                  {/* Swallow Choice Selector right on card - identical to homepage */}
                  {day.isSwallow && isSelected && !isDelivered && (
                    <div
                      className="my-1 pt-1 border-t border-zinc-200/90"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-500 mb-0.5">
                        <span>Swallow:</span>
                        <span className="text-[#FF4C00] font-black">{day.selectedSwallow || 'Semo'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-0.5">
                        {(['Semo', 'Eba', 'Fufu'] as SwallowType[]).map((swallow) => (
                          <button
                            key={swallow}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSwallow(day.dateStr, swallow);
                            }}
                            className={`py-0.5 px-0.5 rounded text-[8px] font-bold transition cursor-pointer text-center ${
                              (day.selectedSwallow || 'Semo') === swallow
                                ? 'bg-[#FF4C00] text-white shadow-xs'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            {swallow}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extra plate approved badge */}
                  {day.portions && day.portions > 1 && (
                    <div className="mt-0.5 px-1 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[8px] font-black flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#FF4C00] shrink-0" />
                      <span>2 Plates</span>
                    </div>
                  )}

                  {/* Queued in New Plan badge */}
                  {newPlanDays.some((p) => p.dateStr === day.dateStr) && (
                    <div className="mt-0.5 px-1 py-0.5 rounded-md bg-orange-100 border border-orange-300 text-[#FF4C00] text-[8px] font-black">
                      + Queued
                    </div>
                  )}

                  {/* Bottom Tag */}
                  <div className="text-[8px] sm:text-[9px] font-bold mt-1">
                    {isDelivered ? (
                      <span className="text-zinc-500">Delivered</span>
                    ) : isSelected ? (
                      <span className="text-emerald-700">✓ Selected</span>
                    ) : isSkipped ? (
                      <span className="text-zinc-400">Skipped</span>
                    ) : newPlanDays.some((p) => p.dateStr === day.dateStr) ? (
                      <span className="text-[#FF4C00]">Queued Below</span>
                    ) : (
                      <span className="text-zinc-400">+ Add To Plan</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LIST VIEW */}
      {/* ============================================================== */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-zinc-100">
            {workdays.map((day) => {
              const isSelected = day.status === 'selected';
              const isSkipped = day.status === 'skipped';

              return (
                <div
                  key={day.dateStr}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/70 transition cursor-pointer"
                  onClick={() => {
                    setActiveDateModal(day);
                    setModalSwallow(day.selectedSwallow || 'Semo');
                  }}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">
                        {day.dayName}
                      </span>
                      <span className="text-xs font-black text-black">
                        {day.dayNum}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{day.emoji}</span>
                        <span className="text-xs sm:text-sm font-bold text-black">
                          {day.dishTitle}
                        </span>
                        {day.portions && day.portions > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                            2 Plates (Approved)
                          </span>
                        )}
                        {newPlanDays.some((p) => p.dateStr === day.dateStr) && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#FF4C00] border border-orange-300 text-[10px] font-black">
                            In New Plan Queue
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 block">
                        {day.fullDateFormatted}
                      </span>

                      {/* Swallow Selector in List View */}
                      {day.isSwallow && isSelected && (
                        <div className="flex items-center space-x-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] font-bold text-zinc-500">Swallow choice:</span>
                          <div className="flex gap-1">
                            {(['Semo', 'Eba', 'Fufu'] as SwallowType[]).map((swallow) => (
                              <button
                                key={swallow}
                                type="button"
                                onClick={() => onSelectSwallow(day.dateStr, swallow)}
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                  (day.selectedSwallow || 'Semo') === swallow
                                    ? 'bg-[#FF4C00] text-white shadow-xs'
                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                }`}
                              >
                                {swallow}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    {isSelected ? (
                      <>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                          ✓ In Your Plan
                        </span>
                        <button
                          onClick={() => onToggleSkipDay(day.dateStr)}
                          className="px-3 py-1 rounded-full text-xs font-bold text-zinc-600 hover:text-black border border-zinc-200 hover:bg-zinc-100 cursor-pointer"
                        >
                          Skip
                        </button>
                      </>
                    ) : isSkipped ? (
                      <>
                        <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
                          Skipped
                        </span>
                        <button
                          onClick={() => onToggleSkipDay(day.dateStr)}
                          className="px-3 py-1 rounded-full text-xs font-bold text-black border border-zinc-200 hover:bg-zinc-100 cursor-pointer"
                        >
                          Unskip
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveDateModal(day);
                          setModalSwallow(day.selectedSwallow || 'Semo');
                        }}
                        className="px-4 py-1.5 rounded-full bg-black hover:bg-[#FF4C00] text-white text-xs font-bold cursor-pointer transition"
                      >
                        + Add To Plan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. NEW LUNCH PLAN SECTION (BELOW CALENDAR) */}
      {/* ============================================================== */}
      <div id="new-lunch-plan-section" className="mt-8 bg-white rounded-3xl border border-zinc-200 p-5 sm:p-7 shadow-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-150">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#FF4C00]" />
              <h3 className="text-lg font-black text-black">New Lunch Plan (Top-Up Days)</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF4C00] font-black text-xs">
                {newPlanDays.length} Days Queued
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Click any open date without a meal on your calendar above to queue extra days here. When ready, confirm payment and Chef Justice will activate them.
            </p>
          </div>

          {newPlanDays.length > 0 && (
            <button
              onClick={() => setNewPlanDays([])}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer self-start sm:self-auto"
            >
              Clear Queue
            </button>
          )}
        </div>

        {/* Top-up Confirmation Banner if just submitted */}
        {submittedTopUpOrder && (
          <div className="my-5 p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <h4 className="text-sm font-black text-emerald-900">
                Payment Submitted for Top-Up #{submittedTopUpOrder.id}!
              </h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Your invoice slip has been downloaded. Chef Justice's admin desk has received the alert and will confirm your transfer to activate these <strong>{submittedTopUpOrder.totalDays} extra meal days</strong> directly onto your calendar.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadInvoiceDocument(submittedTopUpOrder)}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1.5"
              >
                <span>Download Invoice Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTopUpSlipModal(true)}
                className="px-4 py-2 rounded-full bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs transition cursor-pointer"
              >
                View Slip Preview
              </button>
            </div>
          </div>
        )}

        {/* Empty or Populated List */}
        {newPlanDays.length === 0 ? (
          <div className="py-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-zinc-250 my-4 p-6">
            <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-700">No extra days added yet</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-md mx-auto">
              Click any workday on the calendar above that isn't currently in your lunch plan and tap <strong>"+ Add To My Lunch Plan"</strong>. If selecting a Friday, you will lock in your preferred swallow.
            </p>
          </div>
        ) : (
          <div className="space-y-6 my-5">
            {/* Days Queue Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {newPlanDays.map((day) => (
                <div
                  key={day.dateStr}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-start justify-between gap-2 text-left"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm">{day.emoji}</span>
                      <span className="text-xs font-black text-black">{day.dishTitle}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-500 block">
                      {day.fullDateFormatted}
                    </span>
                    {day.selectedSwallow && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-orange-100 text-[#FF4C00] font-black text-[10px]">
                        🍲 Swallow: {day.selectedSwallow}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPlanDays((prev) => prev.filter((p) => p.dateStr !== day.dateStr));
                      setTopUpCalculatedSummary(null);
                      setTopUpValidationError(null);
                    }}
                    className="p-1 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Remove from queue"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Calculations & Order Trigger (Exact sync with Homepage Build Your Lunch Plan) */}
            <div className="bg-[#FAF7F2] p-5 sm:p-6 rounded-3xl border border-zinc-200 space-y-4">
              
              {/* If not yet calculated, show Calculate Order Button */}
              {!topUpCalculatedSummary ? (
                <div className="space-y-3 py-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                    <div>
                      <h4 className="text-sm font-black text-black">
                        {newPlanDays.length} Workday{newPlanDays.length > 1 ? 's' : ''} Ready to Add
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Synced with daily kitchen menu rotation and packaging logistics. Select 20 days and the 20th day is completely FREE!
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isCalculatingTopUp}
                      onClick={handleCalculateTopUpOrder}
                      className="px-6 py-3 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center space-x-2 shrink-0"
                    >
                      {isCalculatingTopUp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Calculating Order...</span>
                        </>
                      ) : (
                        <>
                          <Calculator className="w-4 h-4" />
                          <span>Calculate Order →</span>
                        </>
                      )}
                    </button>
                  </div>

                  {topUpValidationError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{topUpValidationError}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-[11px] text-zinc-500">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4C00]" />
                    <span>Click <strong>"Calculate Order"</strong> above to compute your exact order bill and lock in your desk drop schedule.</span>
                  </div>
                </div>
              ) : (
                /* Calculated Bill Breakdown (Identical to Homepage Formula & Summary) */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          ✓ Order Calculated
                        </span>
                        {topUpCalculatedSummary.hasTwentyDayBonus && (
                          <span className="text-xs font-bold text-[#FF4C00] bg-orange-100/80 px-2 py-0.5 rounded-full border border-orange-200">
                            ★ 20th Meal Free Bonus Applied!
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-black text-black mt-1">
                        {topUpCalculatedSummary.totalDays} Workdays Top-Up Plan
                      </h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Payable</span>
                      <span className="text-2xl font-black text-[#FF4C00]">₦{topUpCalculatedSummary.finalTotalNGN.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Pricing Itemized Lines matching Home Page */}
                  <div className="bg-white p-4 rounded-2xl border border-zinc-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-600">
                      <span>Workdays Chosen:</span>
                      <span className="font-bold text-black">{topUpCalculatedSummary.totalDays} Days</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600">
                      <span>Fresh Kitchen Meals Food Total:</span>
                      <span className="font-bold text-black">₦{topUpCalculatedSummary.foodTotalNGN.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600">
                      <span>Desk Drop Packaging & Logistics (₦500/day):</span>
                      <span className="font-bold text-black">₦{topUpCalculatedSummary.perDayAdditionNGN.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600 pt-1 border-t border-zinc-100">
                      <span>Subtotal:</span>
                      <span className="font-bold text-zinc-800">₦{topUpCalculatedSummary.subtotalNGN.toLocaleString()}</span>
                    </div>
                    {topUpCalculatedSummary.discountNGN > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 font-bold">
                        <span>Bonus 20th Day Reward:</span>
                        <span>-₦{topUpCalculatedSummary.discountNGN.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm font-black text-black pt-2 border-t border-zinc-200">
                      <span>Final Total Payable:</span>
                      <span className="text-base text-[#FF4C00]">₦{topUpCalculatedSummary.finalTotalNGN.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Official Bank Details Box */}
                  <div className="p-4 rounded-2xl bg-white border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Official Bank Transfer Details
                      </span>
                      <p className="text-xs font-black text-zinc-900">
                        Flutterwave MFB (Formerly OK MFB) • <span className="text-[#FF4C00]">9838242145</span>
                      </p>
                      <p className="text-[11px] text-zinc-500">Account Name: 11 TO 12 FOODS LTD 11 TO 12 FOODS FLW</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('9838242145');
                        setCopiedBankAcc(true);
                        setTimeout(() => setCopiedBankAcc(false), 2000);
                      }}
                      className="px-3.5 py-1.5 rounded-full border border-zinc-200 hover:border-black text-xs font-bold text-black transition cursor-pointer self-start sm:self-auto"
                    >
                      {copiedBankAcc ? '✓ Copied' : 'Copy Account'}
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    No need to re-enter your delivery address or contact info — your subscriber profile is already linked! After transferring ₦{topUpCalculatedSummary.finalTotalNGN.toLocaleString()}, click the button below. Chef Justice's admin desk will receive the notification to confirm and add your days directly to your active calendar.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSubmittingTopUp}
                      onClick={() => {
                        setIsSubmittingTopUp(true);
                        setTimeout(() => {
                          const orderId = `TOP-${Math.floor(100000 + Math.random() * 900000)}`;
                          const topUpDays = getTopUpLunchDays();
                          const topUpOrder: OrderSubmission = {
                            id: orderId,
                            fullName: userProfile?.name || 'Valued Subscriber',
                            email: userProfile?.email || 'subscriber@example.com',
                            phone: userProfile?.phone || '08031234567',
                            company: userProfile?.company || 'Lagos Business District',
                            officeAddress: userProfile?.address || 'Office Suite, Victoria Island',
                            floorSuite: userProfile?.floorSuite || '',
                            deliveryArea: userProfile?.deliveryArea || 'Victoria Island',
                            selectedDays: topUpDays,
                            totalDays: topUpDays.length,
                            subtotalNGN: topUpCalculatedSummary.subtotalNGN,
                            discountNGN: topUpCalculatedSummary.discountNGN,
                            finalTotalNGN: topUpCalculatedSummary.finalTotalNGN,
                            submittedAt: new Date().toISOString(),
                            paymentStatus: 'Pending Verification',
                            memberCode: userProfile?.memberCode,
                            isTopUp: true,
                          };

                          downloadInvoiceDocument(topUpOrder);
                          setSubmittedTopUpOrder(topUpOrder);
                          if (onTopUpOrderSubmitted) {
                            onTopUpOrderSubmitted(topUpOrder);
                          }
                          setNewPlanDays([]);
                          setTopUpCalculatedSummary(null);
                          setIsSubmittingTopUp(false);
                        }, 500);
                      }}
                      className="w-full sm:flex-1 py-3.5 px-6 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-xs transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
                    >
                      {isSubmittingTopUp ? (
                        <span>Submitting & Generating Invoice...</span>
                      ) : (
                        <span>I Have Paid (₦{topUpCalculatedSummary.finalTotalNGN.toLocaleString()}) • Submit for Admin Confirmation</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTopUpCalculatedSummary(null);
                      }}
                      className="py-3 px-5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-bold text-xs transition cursor-pointer"
                    >
                      Modify / Recalculate
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewPlanDays([]);
                        setTopUpCalculatedSummary(null);
                      }}
                      className="py-3 px-5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-rose-600 font-bold text-xs transition cursor-pointer"
                    >
                      Cancel / Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* DAY DETAIL & MODIFICATION MODAL */}
      {/* ============================================================== */}
      {activeDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-['Poppins'] overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-5 sm:p-6 text-left my-auto max-h-[90vh] overflow-y-auto flex flex-col">
            <button
              onClick={() => setActiveDateModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider block mb-0.5">
              {activeDateModal.fullDateFormatted}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{activeDateModal.emoji}</span>
              <h3 className="text-lg font-black text-black">
                {activeDateModal.dishTitle}
              </h3>
            </div>

            {/* What's In It Section */}
            <div className="my-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-zinc-200 space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                What's In It
              </span>
              <ul className="text-xs font-semibold text-zinc-800 space-y-1">
                {activeDateModal.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4C00]" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Friday Swallow Selector: Enforced Mandatory */}
            {(activeDateModal.isSwallow || activeDateModal.dayName === 'Fri') && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300">
                <div className="flex items-center space-x-1.5 text-[11px] font-black text-amber-900 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4C00]" />
                  <span>Mandatory Friday Swallow Selection:</span>
                </div>
                <p className="text-[10px] text-zinc-600 mb-2 leading-relaxed">
                  Every Friday features hot local soups. Please select your swallow to lock in this day:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Semo', 'Eba', 'Fufu'] as SwallowType[]).map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => {
                        setModalSwallow(sw);
                        if (activeDateModal.status === 'selected') {
                          onSelectSwallow(activeDateModal.dateStr, sw);
                        }
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        modalSwallow === sw
                          ? 'bg-[#FF4C00] text-white border-[#FF4C00] shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-black'
                      }`}
                    >
                      {sw}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Indicator */}
            <div className="flex items-center justify-between text-xs py-2 border-t border-zinc-150 mb-3">
              <span className="font-semibold text-zinc-500">Current Status:</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  activeDateModal.status === 'selected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeDateModal.status === 'skipped'
                    ? 'bg-zinc-100 text-zinc-600'
                    : 'bg-orange-50 text-orange-800'
                }`}
              >
                {activeDateModal.status === 'selected'
                  ? '✓ In Your Plan'
                  : activeDateModal.status === 'skipped'
                  ? 'Skipped (Credit Saved)'
                  : 'Not in Plan'}
              </span>
            </div>

            {/* Action Buttons */}
            {(() => {
              const isModalPast = activeDateModal.dateStr < todayDateStr;
              const isModalToday = activeDateModal.dateStr === todayDateStr;
              const isModalDelivered = isModalPast || (isModalToday && isAfter12PM);
              const isModalLocked4PM = isAfter4PM && isModalToday;
              const isSkipLimitReached = skipCount >= maxSkips;

              if (isModalDelivered) {
                return (
                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl bg-zinc-100 text-zinc-600 text-xs">
                      ✓ <strong>Fulfilled & Delivered:</strong> Past meals are concluded.
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveDateModal(null)}
                      className="w-full py-2.5 rounded-full bg-black text-white font-bold text-xs cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {activeDateModal.status === 'selected' ? (
                    <>
                      {/* Active meal day: ONLY Skip is available, remove options removed as instructed */}
                      {isModalLocked4PM ? (
                        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Locked after 4:00 PM for morning prep.</span>
                          </div>
                          <a
                            href="https://wa.me/2348031234567"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[#FF4C00] underline shrink-0"
                          >
                            Call Care
                          </a>
                        </div>
                      ) : isSkipLimitReached ? (
                        <div className="p-3 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs flex items-center space-x-2">
                          <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>Maximum 4 skips reached ({skipCount}/4 used).</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleSkipDay(activeDateModal.dateStr);
                            setActiveDateModal(null);
                          }}
                          className="w-full py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs cursor-pointer transition flex items-center justify-center space-x-1.5"
                        >
                          <span>Skip Lunch on this Date (+1 Credit)</span>
                          <span className="text-[10px] text-zinc-400">({4 - skipCount} left)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveDateModal(null)}
                        className="w-full py-2.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-bold text-xs transition cursor-pointer"
                      >
                        Cancel / Close
                      </button>
                    </>
                  ) : activeDateModal.status === 'skipped' ? (
                    <>
                      {isSkipLimitReached ? (
                        <div className="p-3 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs flex items-center space-x-2">
                          <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>Action locked: Maximum 4 skips reached.</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleSkipDay(activeDateModal.dateStr);
                            setActiveDateModal(null);
                          }}
                          className="w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs cursor-pointer transition flex items-center justify-center space-x-1.5"
                        >
                          <span>Unskip / Restore Lunch</span>
                          <span className="text-[10px] text-zinc-400">({4 - skipCount} left)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveDateModal(null)}
                        className="w-full py-2.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-bold text-xs transition cursor-pointer"
                      >
                        Cancel / Close
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Option to use 1 Credit if available and not a past date */}
                      {creditsCount > 0 && !isModalPast && (
                        <button
                          type="button"
                          onClick={() => {
                            const isFriday = activeDateModal.dayName === 'Fri' || activeDateModal.isSwallow;
                            const item: CreditRedemptionDayItem = {
                              dateStr: activeDateModal.dateStr,
                              dishName: activeDateModal.dishTitle,
                              portions: 1,
                              isFriday,
                              swallowChoice: isFriday ? modalSwallow : undefined,
                            };
                            if (onConfirmCreditUsage) {
                              onConfirmCreditUsage([item], 1);
                            }
                            setActiveDateModal(null);
                          }}
                          className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition shadow-xs flex items-center justify-center space-x-1.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Use 1 Credit for this Date ({creditsCount} Available)</span>
                        </button>
                      )}

                      {/* Day without meal: Add To My Lunch Plan */}
                      <button
                        type="button"
                        onClick={() => {
                          const isFriday = activeDateModal.dayName === 'Fri' || activeDateModal.isSwallow;
                          const chosenSwallow = isFriday ? modalSwallow : undefined;
                          const dayToAdd: CalendarDayPlan = {
                            ...activeDateModal,
                            isSwallow: isFriday,
                            selectedSwallow: chosenSwallow,
                          };
                          setNewPlanDays((prev) => {
                            if (prev.some((p) => p.dateStr === dayToAdd.dateStr)) return prev;
                            return [...prev, dayToAdd];
                          });
                          setTopUpCalculatedSummary(null);
                          setTopUpValidationError(null);
                          setActiveDateModal(null);
                          setTimeout(() => {
                            const el = document.getElementById('new-lunch-plan-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        }}
                        className="w-full py-3 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs cursor-pointer transition shadow-xs flex items-center justify-center space-x-1.5"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>+ Add To My Lunch Plan {(activeDateModal.dayName === 'Fri' || activeDateModal.isSwallow) ? `(Swallow: ${modalSwallow})` : ''}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveDateModal(null)}
                        className="w-full py-2.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-bold text-xs transition cursor-pointer"
                      >
                        Cancel / Close
                      </button>
                    </>
                  )}
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* Move Credit Date Modal (Unlimited date moving, past dates blocked) */}
      {movingRedemptionItem && (() => {
        const baseDate = new Date(2026, 9, 1);
        const viewMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + moveMonthOffset, 1);
        const monthName = viewMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const year = viewMonthDate.getFullYear();
        const month = viewMonthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const workdaysList = [];

        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
          const d = new Date(year, month, dayNum);
          const dayOfWeek = d.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;

          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          const isPast = dateStr < todayDateStr || (dateStr === todayDateStr && isAfter5PM);
          const structured = getStructuredMealForDate(d);
          const dishTitle = daysMap[dateStr]?.dishTitle || structured?.mealName || 'Chef Daily Special';
          const isFriday = dayOfWeek === 5;

          workdaysList.push({
            dateStr,
            dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
            dayNum,
            fullDateFormatted: d.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            dishTitle,
            isFriday,
            isPast,
          });
        }

        const isTargetSelectedFriday = workdaysList.find((w) => w.dateStr === movingTargetDateStr)?.isFriday;

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-['Poppins']">
            <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setMovingRedemptionItem(null);
                  setMovingTargetDateStr(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] block">
                  Flexible Credit Scheduler
                </span>
                <h3 className="text-xl font-black text-black mt-0.5">
                  Move Credit Plate to Another Date
                </h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Moving credit currently on <strong>{movingRedemptionItem.oldDateStr}</strong>. You can move dates unlimitedly across upcoming workdays. Past dates cannot be selected.
                </p>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={moveMonthOffset <= 0}
                    onClick={() => setMoveMonthOffset((m) => Math.max(0, m - 1))}
                    className="p-1.5 rounded-full border border-zinc-300 hover:bg-white text-zinc-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-black uppercase tracking-wider px-2">
                    {monthName}
                  </span>
                  <button
                    type="button"
                    disabled={moveMonthOffset >= 5}
                    onClick={() => setMoveMonthOffset((m) => Math.min(5, m + 1))}
                    className="p-1.5 rounded-full border border-zinc-300 hover:bg-white text-zinc-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-[11px] font-bold text-zinc-500">
                  Select Target Workday
                </span>
              </div>

              {/* Workday Tiles */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block">
                  Upcoming Workdays in {monthName}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {workdaysList.map((w) => {
                    const isSelected = movingTargetDateStr === w.dateStr;
                    const isOldDate = movingRedemptionItem.oldDateStr === w.dateStr;

                    if (w.isPast) {
                      return (
                        <div
                          key={w.dateStr}
                          className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-400 text-xs opacity-60 flex items-center justify-between cursor-not-allowed select-none"
                        >
                          <div>
                            <span className="font-bold block">{w.fullDateFormatted}</span>
                            <span className="text-[10px] truncate block text-zinc-400">{w.dishTitle}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 flex items-center space-x-1 shrink-0">
                            <Lock className="w-3 h-3" />
                            <span>Past Date</span>
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={w.dateStr}
                        onClick={() => {
                          if (!isOldDate) {
                            setMovingTargetDateStr(w.dateStr);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#FF4C00] text-white border-[#FF4C00] shadow-xs'
                            : isOldDate
                            ? 'bg-amber-50 border-amber-300 text-amber-900 opacity-70'
                            : 'bg-white border-zinc-200 hover:border-black text-black'
                        }`}
                      >
                        <div>
                          <span className="font-bold block">{w.fullDateFormatted}</span>
                          <span className={`text-[10px] truncate block ${isSelected ? 'text-white/90' : 'text-zinc-500'}`}>
                            {w.dishTitle} {w.isFriday ? '• Swallow' : ''}
                          </span>
                        </div>
                        {isOldDate ? (
                          <span className="text-[10px] font-bold text-amber-700 uppercase">Current</span>
                        ) : isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400">Select</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Friday Swallow choice if target is Friday */}
              {isTargetSelectedFriday && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-amber-900 block">
                    Friday Soup Swallow Selection:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Semo', 'Eba', 'Fufu'] as SwallowType[]).map((sw) => (
                      <button
                        key={sw}
                        type="button"
                        onClick={() => setMovingTargetSwallow(sw)}
                        className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          movingTargetSwallow === sw
                            ? 'bg-[#FF4C00] text-white border-[#FF4C00]'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-black'
                        }`}
                      >
                        {sw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setMovingRedemptionItem(null);
                    setMovingTargetDateStr(null);
                  }}
                  className="px-4 py-2.5 rounded-full border border-zinc-300 hover:border-black text-zinc-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!movingTargetDateStr || movingTargetDateStr === movingRedemptionItem.oldDateStr}
                  onClick={() => {
                    if (!movingTargetDateStr) return;
                    if (onMoveCreditDate) {
                      onMoveCreditDate(
                        movingRedemptionItem.redemptionId,
                        movingRedemptionItem.oldDateStr,
                        movingTargetDateStr,
                        isTargetSelectedFriday ? movingTargetSwallow : undefined
                      );
                    }
                    setCreditMoveSuccessNotice(
                      `✓ Credit successfully moved to ${movingTargetDateStr}! You can move dates unlimitedly before 5:00 PM.`
                    );
                    setMovingRedemptionItem(null);
                    setMovingTargetDateStr(null);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer shadow-xs transition"
                >
                  Confirm Move Date →
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Credit Usage Modal */}
      <CreditUsageModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        availableCredits={creditsCount}
        daysMap={daysMap}
        isAfter5PM={isAfter5PM}
        onConfirmCreditUsage={(items, totalCredits) => {
          if (onConfirmCreditUsage) {
            onConfirmCreditUsage(items, totalCredits);
          }
        }}
      />

      {/* Top-up Invoice Slip Modal */}
      {showTopUpSlipModal && submittedTopUpOrder && (
        <InvoiceSlipModal
          isOpen={showTopUpSlipModal}
          onClose={() => setShowTopUpSlipModal(false)}
          order={submittedTopUpOrder}
        />
      )}

    </div>
  );
};
