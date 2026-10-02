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
} from 'lucide-react';

interface PlanBuilderProps {
  onProceedToCheckout: (selectedDays: SelectedLunchDay[], summary: OrderSummary) => void;
}

export const PlanBuilder: React.FC<PlanBuilderProps> = ({ onProceedToCheckout }) => {
  // Anchored to October 2026 (Month 1 of the 26-week / 6-month cycle)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 9 is October (0-indexed)

  // Map of dateStr -> SelectedLunchDay
  const [selectedDaysMap, setSelectedDaysMap] = useState<Record<string, SelectedLunchDay>>({});

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

  // 6-month quick navigation tabs
  const sixMonthsCycle = [
    { year: 2026, month: 9, label: 'Oct 2026' },
    { year: 2026, month: 10, label: 'Nov 2026' },
    { year: 2026, month: 11, label: 'Dec 2026' },
    { year: 2027, month: 0, label: 'Jan 2027' },
    { year: 2027, month: 1, label: 'Feb 2027' },
    { year: 2027, month: 2, label: 'Mar 2027' },
  ];

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

  // Generate calendar days for current month grid (Monday to Sunday Worldwide Standard)
  // Monday = 0, Tuesday = 1, Wednesday = 2, Thursday = 3, Friday = 4, Saturday = 5, Sunday = 6
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
        meal: isWeekend ? null : getStructuredMealForDate(date),
      });
    }

    // Next month padding to fill out complete 5 or 6 rows of 7 days
    const totalCellsNeeded = cells.length <= 35 ? 35 : 42;
    const remainingCells = totalCellsNeeded - cells.length;
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
        meal: isWeekend ? null : getStructuredMealForDate(date),
      });
    }

    return cells;
  }, [currentYear, currentMonth, firstDayIndex, totalDaysInMonth, prevMonthDays]);

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Toggle selection for a workday meal
  const toggleSelectMeal = (meal: StructuredMeal) => {
    if (meal.isHoliday || meal.isNoDelivery) return;

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
    // Rule 15: Zero / Empty order validation
    if (selectedCount === 0) {
      setValidationError('Please select at least one lunch day.');
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
    <section id="pricing" className="py-20 bg-[#FAF7F2] border-t border-zinc-200/80">
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

          {/* Calendar Day Header - Monday to Sunday Worldwide Standard */}
          <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-zinc-400">Sat</div>
            <div className="text-zinc-400">Sun</div>
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {calendarDays.map((cell, idx) => {
              const meal = cell.meal;
              const isSelected = Boolean(selectedDaysMap[cell.dateStr]);
              const selectedSwallow = selectedDaysMap[cell.dateStr]?.selectedSwallow || 'Semo';
              const isSwallowMeal = meal?.mealCategory === 'Swallow';

              // Weekend styling (Strictly no meals on Saturday & Sunday)
              if (cell.isWeekend) {
                return (
                  <div
                    key={idx}
                    className="min-h-[95px] sm:min-h-[115px] p-2 sm:p-2.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/70 flex flex-col justify-between opacity-55 select-none cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">{cell.dayNumber}</span>
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

              // Public Holiday styling
              if (cell.meal?.isHoliday || cell.meal?.isNoDelivery) {
                return (
                  <div
                    key={idx}
                    className="min-h-[95px] sm:min-h-[115px] p-2 sm:p-2.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex flex-col justify-between select-none"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700">{cell.dayNumber}</span>
                      <span className="text-[9px] font-semibold text-amber-600 uppercase bg-amber-100 px-1.5 py-0.5 rounded">
                        Holiday
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-800 line-clamp-2">
                      {cell.meal?.holidayName || 'Public Holiday'}
                    </span>
                  </div>
                );
              }

              // Non-current month workdays
              if (!cell.isCurrentMonth || !meal) {
                return (
                  <div
                    key={idx}
                    className="min-h-[95px] sm:min-h-[115px] p-2 rounded-2xl bg-zinc-50/40 border border-zinc-100 opacity-40 select-none"
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
                  className={`min-h-[95px] sm:min-h-[115px] p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative text-left ${
                    isSelected
                      ? 'bg-[#FF4C00] text-white border-[#FF4C00] shadow-md scale-[1.02]'
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
                      <span className="w-4 h-4 rounded-full bg-white text-[#FF4C00] flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-zinc-400 group-hover:text-zinc-600">
                        {meal.day.substring(0, 3)}
                      </span>
                    )}
                  </div>

                  {/* Middle: Meal Name (STRICTLY NO PRICE DISPLAYED) */}
                  <div className="my-1">
                    <p
                      className={`text-[11px] sm:text-xs font-bold leading-snug line-clamp-2 ${
                        isSelected ? 'text-white' : 'text-zinc-800'
                      }`}
                    >
                      {meal.mealName}
                    </p>
                  </div>

                  {/* Bottom: Category tag & Friday swallow selection if selected */}
                  <div>
                    {isSelected && isSwallowMeal ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 pt-1 border-t border-white/30 flex items-center space-x-1"
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
                    ) : (
                      <span
                        className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200'
                        }`}
                      >
                        {meal.mealCategory}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Action Bar & Order Calculation Trigger (No Prices While Picking Days!) */}
        <div className="mt-8 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black text-black">
                {selectedCount} lunch {selectedCount === 1 ? 'day' : 'days'} selected
              </span>
              {selectedCount >= 20 && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>20th Day Free!</span>
                </span>
              )}
            </div>

            {/* Helper status text */}
            <div className="mt-1 text-xs text-zinc-500 font-medium">
              {validationError ? (
                <span className="text-rose-600 font-semibold flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 inline mr-1 shrink-0" />
                  {validationError}
                </span>
              ) : selectedCount === 0 ? (
                <span>Click any workday above to select lunch days.</span>
              ) : selectedCount < 20 ? (
                <span>
                  ✓ {selectedCount} {selectedCount === 1 ? 'day' : 'days'} selected. Ready to calculate!
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
              disabled={isCalculating || isAnimationRunning}
              className="w-full md:w-auto px-8 py-4 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-sm uppercase tracking-wider transition shadow-md active:scale-95 disabled:opacity-75 cursor-pointer flex items-center justify-center space-x-2"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <span>Calculate Order</span>
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
