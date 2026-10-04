import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StructuredMeal,
  SelectedLunchDay,
  SwallowType,
  calculateOrderSummary,
  OrderSummary,
  PER_DAY_FEE,
} from '../../types';
import { getStructuredMealForDate } from '../../data/menuRotation';
import { LAUNCH_CONFIG, isDateBeforeLaunch } from '../../config/launchConfig';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Calendar as CalendarIcon,
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Utensils,
} from 'lucide-react';

interface MealPopupState {
  meal: StructuredMeal;
  action: 'added' | 'removed';
  formattedDate: string;
}

interface PlanBuilderProps {
  onProceedToCheckout: (selectedDays: SelectedLunchDay[], summary: OrderSummary) => void;
}

export const PlanBuilder: React.FC<PlanBuilderProps> = ({ onProceedToCheckout }) => {
  // Anchored to official Launch Date (November 2, 2026)
  const [currentYear, setCurrentYear] = useState(LAUNCH_CONFIG.year);
  const [currentMonth, setCurrentMonth] = useState(LAUNCH_CONFIG.monthIndex);

  // Map of dateStr -> SelectedLunchDay
  const [selectedDaysMap, setSelectedDaysMap] = useState<Record<string, SelectedLunchDay>>({});

  // 2-Second Top Floating Meal Preview Popup state
  const [activeMealPopup, setActiveMealPopup] = useState<MealPopupState | null>(null);
  const popupTimeoutRef = useRef<number | null>(null);

  // Calculation Modal & Animation State
  const [showOrderBill, setShowOrderBill] = useState(false);
  const [calculatedSummary, setCalculatedSummary] = useState<OrderSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Price-reveal animation states (Rule 6, 7, 8, 9)
  const [displayedPrice, setDisplayedPrice] = useState<number>(0);
  const [isAnimationRunning, setIsAnimationRunning] = useState(false);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const billSectionRef = useRef<HTMLDivElement | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // 6-month quick navigation tabs starting from launch date
  const sixMonthsCycle = useMemo(() => {
    const tabs = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(LAUNCH_CONFIG.year, LAUNCH_CONFIG.monthIndex + i, 1);
      tabs.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: `${monthNames[d.getMonth()].substring(0, 3)} ${d.getFullYear()}`,
      });
    }
    return tabs;
  }, []);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generate calendar days for current month grid (Monday to Sunday - Worldwide standard)
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = useMemo(() => {
    const cells: {
      dayNumber: number;
      isCurrentMonth: boolean;
      date: Date;
      dateStr: string;
      isWeekend: boolean;
      isBeforeLaunch: boolean;
      meal: StructuredMeal | null;
    }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const date = new Date(currentYear, currentMonth - 1, d);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${mm}-${dd}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      cells.push({
        dayNumber: d,
        isCurrentMonth: false,
        date,
        dateStr,
        isWeekend,
        isBeforeLaunch: isDateBeforeLaunch(date),
        meal: isWeekend ? null : getStructuredMealForDate(date),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${mm}-${dd}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      cells.push({
        dayNumber: d,
        isCurrentMonth: true,
        date,
        dateStr,
        isWeekend,
        isBeforeLaunch: isDateBeforeLaunch(date),
        meal: isWeekend ? null : getStructuredMealForDate(date),
      });
    }

    // Next month padding to fill grid
    const remainingCells = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let d = 1; d <= remainingCells; d++) {
      const date = new Date(currentYear, currentMonth + 1, d);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${mm}-${dd}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      cells.push({
        dayNumber: d,
        isCurrentMonth: false,
        date,
        dateStr,
        isWeekend,
        isBeforeLaunch: isDateBeforeLaunch(date),
        meal: isWeekend ? null : getStructuredMealForDate(date),
      });
    }

    return cells;
  }, [currentYear, currentMonth, firstDayIndex, prevMonthDays, totalDaysInMonth]);

  // Clean animation frame & popup timer on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  // Toggle selection for a workday meal
  const toggleSelectMeal = (meal: StructuredMeal) => {
    if (meal.isHoliday || meal.isNoDelivery) return;

    const isCurrentlySelected = Boolean(selectedDaysMap[meal.dateStr]);
    const action: 'added' | 'removed' = isCurrentlySelected ? 'removed' : 'added';

    setSelectedDaysMap((prev) => {
      const copy = { ...prev };
      if (copy[meal.dateStr]) {
        delete copy[meal.dateStr];
      } else {
        copy[meal.dateStr] = {
          dateStr: meal.dateStr,
          meal,
          selectedSwallow: meal.mealCategory === 'Swallow' ? 'Semo' : undefined,
        };
      }
      return copy;
    });

    setValidationError(null);

    // Show floating top popup displaying the meal for this day, fading out in 2 seconds
    const dateObj = new Date(meal.dateStr + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }

    setActiveMealPopup({
      meal,
      action,
      formattedDate,
    });

    popupTimeoutRef.current = window.setTimeout(() => {
      setActiveMealPopup(null);
    }, 2000);

    // Rule 14: If customer changes their selected dates:
    // Clear previous calculated result and reset animation state
    if (showOrderBill || calculatedSummary) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setShowOrderBill(false);
      setCalculatedSummary(null);
      setIsAnimationRunning(false);
      setIsRevealComplete(false);
      setIsCalculating(false);
    }
  };

  // Change swallow choice for a swallow meal
  const handleSelectSwallow = (dateStr: string, swallow: SwallowType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDaysMap((prev) => {
      if (!prev[dateStr]) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...prev[dateStr],
          selectedSwallow: swallow,
        },
      };
    });

    // Also display the meal with updated swallow choice in the top popup for 2 seconds
    const dateObj = new Date(dateStr + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    const currentMeal = selectedDaysMap[dateStr]?.meal || getStructuredMealForDate(dateObj);
    if (currentMeal) {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      setActiveMealPopup({
        meal: {
          ...currentMeal,
          mealName: `${currentMeal.mealName.split('(')[0].trim()} (Swallow: ${swallow})`,
        },
        action: 'added',
        formattedDate,
      });
      popupTimeoutRef.current = window.setTimeout(() => {
        setActiveMealPopup(null);
      }, 2000);
    }
  };

  // Select all deliverable workdays in current month
  const selectAllWorkdaysThisMonth = () => {
    setSelectedDaysMap((prev) => {
      const copy = { ...prev };
      calendarDays.forEach((cell) => {
        if (cell.isCurrentMonth && !cell.isWeekend && cell.meal && !cell.meal.isHoliday && !cell.meal.isNoDelivery) {
          copy[cell.dateStr] = {
            dateStr: cell.dateStr,
            meal: cell.meal,
            selectedSwallow: cell.meal.mealCategory === 'Swallow' ? 'Semo' : undefined,
          };
        }
      });
      return copy;
    });
    setValidationError(null);
    setShowOrderBill(false);
    setCalculatedSummary(null);
    setIsRevealComplete(false);
  };

  const clearAllSelected = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setSelectedDaysMap({});
    setShowOrderBill(false);
    setCalculatedSummary(null);
    setIsRevealComplete(false);
    setIsAnimationRunning(false);
    setIsCalculating(false);
    setValidationError(null);
  };

  const isCurrentMonthPreLaunch =
    currentYear < LAUNCH_CONFIG.year ||
    (currentYear === LAUNCH_CONFIG.year && currentMonth < LAUNCH_CONFIG.monthIndex);

  // Sorted list of selected days (only deliverable days without holidays)
  const selectedDaysList = useMemo(() => {
    return (Object.values(selectedDaysMap) as SelectedLunchDay[])
      .filter((d) => !d.meal.isHoliday && !d.meal.isNoDelivery)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [selectedDaysMap]);

  const selectedCount = selectedDaysList.length;

  // Rule 5, 6, 7, 8, 9, 10, 11:
  // Calculate Order Button with dynamic downward animation from ~1.35x to actual Final Total
  const handleCalculateOrder = () => {
    // Minimum Requirement: More than 8 days (9+ days)
    if (selectedCount < 9) {
      setValidationError('Minimum Requirement: More than 8 days (9+ days). You must select at least 9 lunch days to calculate your order.');
      setShowOrderBill(false);
      return;
    }

    setValidationError(null);
    setIsCalculating(true);
    setIsRevealComplete(false);

    // Step 1 - 8: Calculate real final total as single source of truth
    const summary = calculateOrderSummary(selectedDaysList);
    setCalculatedSummary(summary);

    // Rule 7: Dynamic start: round(Final Total * 1.35) to clean 100s
    const realFinalTotal = summary.finalTotalNGN;
    const rawStart = Math.round(realFinalTotal * 1.35);
    const animationStart = Math.ceil(rawStart / 100) * 100;

    setDisplayedPrice(animationStart);
    setShowOrderBill(true);

    // Smooth scroll to bill section
    setTimeout(() => {
      if (billSectionRef.current) {
        billSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Stage 1 -> Stage 2 -> Stage 3 sequence:
    // Brief button loading state (350ms), then launch smooth 1.4s downward price reduction
    setTimeout(() => {
      setIsCalculating(false);
      setIsAnimationRunning(true);

      const animationDuration = 1400; // 1.4 seconds (within 1.2-1.8s recommendation)
      const startTime = performance.now();

      const animateDown = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / animationDuration);

        // Cubic ease-out curve for natural deceleration as it nears the real price
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentPrice = Math.round(animationStart - (animationStart - realFinalTotal) * easeOut);

        // Round to nearest 100 during intermediate steps for clean appearance
        if (progress < 1) {
          const roundedIntermediate = Math.round(currentPrice / 100) * 100;
          setDisplayedPrice(Math.max(realFinalTotal, roundedIntermediate));
          animationFrameRef.current = requestAnimationFrame(animateDown);
        } else {
          // Exact final total reached
          setDisplayedPrice(realFinalTotal);
          setIsAnimationRunning(false);
          setIsRevealComplete(true);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateDown);
    }, 400);
  };

  const handleProceedToPayout = () => {
    if (!calculatedSummary) return;
    onProceedToCheckout(selectedDaysList, calculatedSummary);
  };

  return (
    <section id="pricing" className="py-20 bg-[#FAF7F2] border-t border-zinc-200/80 relative">
      
      {/* 2-Second Floating Top Meal Preview Popup with Smooth Fade Out */}
      {activeMealPopup && (
        <div
          key={`${activeMealPopup.meal.dateStr}-${activeMealPopup.action}-${activeMealPopup.meal.mealName}`}
          className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-md sm:max-w-xl rounded-2xl sm:rounded-3xl border shadow-2xl p-4 sm:p-5 backdrop-blur-md font-['Poppins'] animate-in fade-in slide-in-from-top-4 duration-300 ${
            activeMealPopup.action === 'added'
              ? 'bg-zinc-950/95 text-white border-[#FF4C00]/40 shadow-orange-500/10'
              : 'bg-zinc-900/95 text-zinc-200 border-zinc-700/80 shadow-black/40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                activeMealPopup.action === 'added'
                  ? 'bg-[#FF4C00] text-white border-[#FF4C00]/50 shadow-md shadow-[#FF4C00]/25'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {activeMealPopup.action === 'added' ? (
                <Utensils className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400">
                    {activeMealPopup.formattedDate}
                  </span>
                  <span
                    className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      activeMealPopup.action === 'added'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {activeMealPopup.action === 'added' ? '✓ Added to Plan' : 'Removed from Plan'}
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={() => setActiveMealPopup(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer shrink-0"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Full Meal Title */}
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug break-words">
                {activeMealPopup.meal.mealName}
              </h4>

              {/* Meal Composition Tags */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-300">
                {activeMealPopup.meal.mealCategory && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/90">
                    {activeMealPopup.meal.mealCategory}
                  </span>
                )}
                {activeMealPopup.meal.protein && (
                  <span className="truncate">Protein: <strong className="text-white">{activeMealPopup.meal.protein}</strong></span>
                )}
                {activeMealPopup.meal.soup && (
                  <span className="truncate">• Soup: <strong className="text-white">{activeMealPopup.meal.soup}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* 2-Second Visual Countdown Indicator Bar */}
          <div className="mt-3 w-full bg-white/10 h-0.5 rounded-full overflow-hidden">
            <div
              className={`h-full animate-shrink-width ${
                activeMealPopup.action === 'added' ? 'bg-[#FF4C00]' : 'bg-zinc-500'
              }`}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-semibold text-[#FF4C00] uppercase tracking-wider">
            6-Month Interactive Calendar
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black mt-1">
            Build Your Lunch Plan
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 font-medium mt-2">
            Choose the days you want lunch. Click any workday to select your meals.
          </p>
          
          {/* Rules and 20th Day Bonus Badge */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-zinc-200/80 text-zinc-800">
              Minimum Requirement: More than 8 days (9+ days)
            </span>
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-[#FF4C00]/10 text-[#FF4C00] border border-[#FF4C00]/30">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Special: Select 20 days & the 20th day is completely FREE!
            </span>
          </div>
        </div>

        {/* 6-Month Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
          {sixMonthsCycle.map((item) => {
            const isCurrent = currentYear === item.year && currentMonth === item.month;
            return (
              <button
                key={`${item.year}-${item.month}`}
                onClick={() => {
                  setCurrentYear(item.year);
                  setCurrentMonth(item.month);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Calendar View Container */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-8 shadow-sm">
          
          {/* Month Navigation & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-zinc-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF4C00]/10 flex items-center justify-center text-[#FF4C00]">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <p className="text-xs text-zinc-400">
                  Select workdays for your office desk drop
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={selectAllWorkdaysThisMonth}
                className="text-xs font-semibold text-[#FF4C00] hover:underline cursor-pointer"
              >
                Select All Workdays
              </button>
              <span className="text-zinc-300">•</span>
              <button
                onClick={clearAllSelected}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                Clear All
              </button>
              <div className="flex items-center space-x-1 pl-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Pre-launch alert banner */}
          {isCurrentMonthPreLaunch && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-[#FF4C00] shrink-0" />
              <span>
                Pre-launch period. Deliveries begin <strong>{LAUNCH_CONFIG.displayDate}</strong>. All previous dates are locked.
              </span>
            </div>
          )}

          {/* Calendar Day Header: Monday to Sunday Worldwide */}
          <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-zinc-400/80">Sat</div>
            <div className="text-zinc-400/80">Sun</div>
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-3">
            {calendarDays.map((cell, idx) => {
              const meal = cell.meal;
              const isSelected = Boolean(selectedDaysMap[cell.dateStr]);
              const selectedSwallow = selectedDaysMap[cell.dateStr]?.selectedSwallow || 'Semo';
              const isSwallowMeal = meal?.mealCategory === 'Swallow';

              // Pre-launch dates (Faded out till infinity)
              if (cell.isBeforeLaunch) {
                return (
                  <div
                    key={idx}
                    className="min-h-[85px] sm:min-h-[115px] p-1.5 sm:p-2.5 rounded-2xl bg-zinc-100/40 border border-zinc-200/50 flex flex-col justify-between opacity-30 select-none cursor-not-allowed overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">{cell.dayNumber}</span>
                      <span className="text-[7px] sm:text-[8px] font-semibold text-zinc-400 uppercase bg-zinc-200 px-1 py-0.5 rounded truncate">
                        <span className="hidden sm:inline">Pre-Launch</span>
                        <span className="sm:hidden">Pre</span>
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 italic text-center py-1 sm:py-2">Locked</span>
                  </div>
                );
              }

              // Weekend styling (Strictly No Meals - Saturday & Sunday)
              if (cell.isWeekend) {
                return (
                  <div
                    key={idx}
                    className="min-h-[85px] sm:min-h-[115px] p-1.5 sm:p-2.5 rounded-2xl bg-zinc-50/70 border border-zinc-150 flex flex-col justify-between opacity-50 select-none cursor-not-allowed overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">{cell.dayNumber}</span>
                      <span className="text-[7px] sm:text-[8px] font-semibold text-zinc-400 uppercase bg-zinc-200/60 px-1 py-0.5 rounded">Off</span>
                    </div>
                    <span className="text-[8px] sm:text-[10px] text-zinc-400 font-medium italic text-center py-1 sm:py-2 leading-tight">
                      <span className="hidden sm:inline">Strictly No Meals (Closed)</span>
                      <span className="sm:hidden">Closed</span>
                    </span>
                  </div>
                );
              }

              // Public Holiday styling
              if (cell.meal?.isHoliday || cell.meal?.isNoDelivery) {
                return (
                  <div
                    key={idx}
                    className="min-h-[85px] sm:min-h-[115px] p-1.5 sm:p-2.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex flex-col justify-between select-none overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700">{cell.dayNumber}</span>
                      <span className="text-[8px] sm:text-[9px] font-semibold text-amber-600 uppercase bg-amber-100 px-1 py-0.5 rounded truncate">
                        Holiday
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-amber-800 line-clamp-2 leading-tight break-words">
                      {cell.meal?.holidayName || 'Holiday'}
                    </span>
                  </div>
                );
              }

              // Non-current month workdays
              if (!cell.isCurrentMonth || !meal) {
                return (
                  <div
                    key={idx}
                    className="min-h-[85px] sm:min-h-[115px] p-1.5 sm:p-2 rounded-2xl bg-zinc-50/40 border border-zinc-100 opacity-40 select-none"
                  >
                    <span className="text-xs font-semibold text-zinc-300">{cell.dayNumber}</span>
                  </div>
                );
              }

              // Active Workday Card
              return (
                <div
                  key={cell.dateStr}
                  onClick={() => toggleSelectMeal(meal)}
                  className={`min-h-[85px] sm:min-h-[115px] p-1.5 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative text-left overflow-hidden ${
                    isSelected
                      ? 'bg-[#FF4C00] text-white border-[#FF4C00] shadow-md scale-[1.01]'
                      : 'bg-white text-zinc-800 border-zinc-200 hover:border-[#FF4C00]/60 hover:bg-[#FAF7F2]'
                  }`}
                >
                  {/* Top: Day number & selection badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isSelected ? 'text-white' : 'text-zinc-900 group-hover:text-[#FF4C00]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {isSelected ? (
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white text-[#FF4C00] flex items-center justify-center shadow-xs shrink-0">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[8px] sm:text-[9px] font-semibold text-zinc-400 group-hover:text-zinc-600 truncate">
                        {meal.day.substring(0, 3)}
                      </span>
                    )}
                  </div>

                  {/* Middle: Meal Name (ONLY Food Title, no extra description) */}
                  <div className="my-0.5 sm:my-1 min-w-0">
                    <p
                      className={`text-[9px] sm:text-xs font-bold leading-tight line-clamp-2 break-words ${
                        isSelected ? 'text-white' : 'text-zinc-800'
                      }`}
                    >
                      {meal.mealName}
                    </p>
                  </div>

                  {/* Bottom: Friday swallow selection if selected */}
                  <div>
                    {isSelected && isSwallowMeal ? (
                      <>
                        {/* Mobile Swallow Switcher */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextSwallow: SwallowType =
                              selectedSwallow === 'Semo' ? 'Eba' : selectedSwallow === 'Eba' ? 'Fufu' : 'Semo';
                            handleSelectSwallow(cell.dateStr, nextSwallow, e);
                          }}
                          className="sm:hidden mt-0.5 pt-0.5 border-t border-white/30 flex items-center justify-between text-[8px] font-black uppercase text-white cursor-pointer"
                          title="Tap to change swallow"
                        >
                          <span className="truncate">{selectedSwallow}</span>
                          <span className="text-[8px] opacity-80">↻</span>
                        </div>

                        {/* Desktop Swallow Buttons */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="hidden sm:flex mt-1 pt-1 border-t border-white/30 items-center space-x-1"
                        >
                          {(['Semo', 'Eba', 'Fufu'] as SwallowType[]).map((swallow) => (
                            <button
                              key={swallow}
                              type="button"
                              onClick={(e) => handleSelectSwallow(cell.dateStr, swallow, e)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black transition cursor-pointer ${
                                selectedSwallow === swallow
                                  ? 'bg-black text-white shadow-xs'
                                  : 'bg-white/30 text-white hover:bg-white/50'
                              }`}
                            >
                              {swallow}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Action Bar & Order Calculation Trigger (No Prices While Picking Days!) */}
        <div className="mt-8 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-full overflow-hidden">
          
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-black">
                {selectedCount} lunch {selectedCount === 1 ? 'day' : 'days'} selected
              </span>
              {selectedCount >= 20 && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>20th Day Free!</span>
                </span>
              )}
            </div>

            {/* Helper status text */}
            <div className="mt-1 text-xs text-zinc-500 font-medium break-words">
              {validationError ? (
                <span className="text-rose-600 font-semibold flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 inline mr-1 shrink-0" />
                  {validationError}
                </span>
              ) : selectedCount === 0 ? (
                <span>Click any workday above to select lunch days (Minimum requirement: 9+ days).</span>
              ) : selectedCount < 9 ? (
                <span className="text-amber-700 font-semibold">
                  ⚠️ Minimum Requirement: More than 8 days ({selectedCount}/9 days selected. Please select {9 - selectedCount} more to calculate).
                </span>
              ) : selectedCount < 20 ? (
                <span>
                  ✓ {selectedCount} days selected (Meets 9+ days requirement). Ready to calculate!
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">
                  ✓ 20-day threshold reached! Your 20th day will be automatically discounted to ₦0.
                </span>
              )}
            </div>
          </div>

          {/* Calculate Order Button (Rule 5 & 8) */}
          <div>
            <button
              onClick={handleCalculateOrder}
              disabled={isCalculating || isAnimationRunning || selectedCount < 9}
              className={`w-full md:w-auto px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wider transition shadow-md active:scale-95 flex items-center justify-center space-x-2 ${
                selectedCount < 9
                  ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                  : 'bg-[#FF4C00] hover:bg-[#E04300] text-white cursor-pointer'
              }`}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <span>{selectedCount < 9 ? `Select 9+ Days (${selectedCount}/9)` : 'Calculate Order'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Calculated Order Bill Section / Price Reveal (Rules 3, 4, 6, 8, 9, 10, 11, 12, 13, 17) */}
        {showOrderBill && calculatedSummary && (
          <div
            ref={billSectionRef}
            className="mt-8 bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div>
                <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
                  {isAnimationRunning ? 'Calculating your lunch plan...' : 'Your Lunch Plan'}
                </span>
                <h3 className="text-2xl font-black text-black mt-0.5">
                  {isRevealComplete ? 'Your lunch plan is ready.' : 'Calculating your lunch plan...'}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                  }
                  setShowOrderBill(false);
                }}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer"
                title="Close bill"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price-Reveal Showcase Card (Down from 1.35x -> Real Final Total) */}
            <div className="my-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FFF8F4] to-[#FAF7F2] border border-[#FF4C00]/25 text-center shadow-xs">
              <span className="text-xs font-bold tracking-widest text-[#FF4C00] uppercase">
                {isAnimationRunning ? 'Calculating personalized rate...' : 'Total'}
              </span>

              {/* Animated Price Figure */}
              <div className="my-3 flex items-center justify-center">
                <div
                  className={`text-4xl sm:text-6xl font-black text-black tracking-tight transition-transform duration-300 select-none ${
                    isRevealComplete ? 'scale-105 text-[#FF4C00]' : isAnimationRunning ? 'text-zinc-800' : ''
                  }`}
                >
                  ₦{displayedPrice.toLocaleString()}
                </div>
              </div>

              {/* Sub-status (Clean & truthful: no fake discount tags or separate ₦500 line item) */}
              <p className="text-xs sm:text-sm text-zinc-600 font-medium max-w-md mx-auto">
                {isAnimationRunning ? (
                  <span className="inline-flex items-center space-x-1.5 text-zinc-700">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF4C00]" />
                    <span>Calculating schedule for {calculatedSummary.totalDays} delivery {calculatedSummary.totalDays === 1 ? 'day' : 'days'}...</span>
                  </span>
                ) : (
                  <span>
                    Direct office desk delivery schedule • All taxes included
                  </span>
                )}
              </p>
            </div>

            {/* Order Summary (Rule 5 & 13) */}
            <div className="my-6">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-sm font-bold text-black uppercase tracking-wider">
                  Your Lunch Plan
                </span>
                <span className="text-xs font-black text-[#FF4C00] bg-[#FF4C00]/10 px-2.5 py-1 rounded-full">
                  {calculatedSummary.totalDays} lunch {calculatedSummary.totalDays === 1 ? 'day' : 'days'}
                </span>
              </div>

              {/* Selected Meals List */}
              <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-2 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
                {selectedDaysList.map((item) => {
                  const dateObj = new Date(item.dateStr);
                  const formatted = dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <div
                      key={item.dateStr}
                      className="text-xs flex items-center justify-between text-zinc-700 bg-white p-2.5 rounded-xl border border-zinc-100"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-[#FF4C00] shrink-0" />
                        <span className="font-semibold text-zinc-900">{item.meal.mealName}</span>
                        {item.selectedSwallow && (
                          <span className="text-[10px] text-[#FF4C00] bg-orange-50 px-2 py-0.5 rounded-full font-bold border border-orange-200">
                            {item.selectedSwallow}
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-400 text-[11px] font-medium shrink-0 pl-2">
                        {formatted}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Payable Block (Incorporates meal prices + ₦500/day internally without separate ₦500 line item) */}
              <div className="mt-5 p-5 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Total
                  </span>
                  <p className="text-3xl font-black text-black mt-0.5">
                    ₦{calculatedSummary.finalTotalNGN.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-zinc-500">
                    {calculatedSummary.totalDays} delivery {calculatedSummary.totalDays === 1 ? 'day' : 'days'} scheduled
                  </span>
                </div>

                {calculatedSummary.hasTwentyDayBonus && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold self-start sm:self-auto flex items-center space-x-1 border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>20th Day Free Applied</span>
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                onClick={() => {
                  if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                  }
                  setShowOrderBill(false);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
              >
                Modify Days
              </button>

              <button
                onClick={handleProceedToPayout}
                disabled={isAnimationRunning}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-black uppercase tracking-wider transition shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
