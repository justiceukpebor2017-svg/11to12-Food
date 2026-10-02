import React, { useState, useMemo } from 'react';
import { StructuredMeal, SelectedLunchDay, SwallowType, calculateMealPrice, calculateOrderSummary } from '../../types';
import { getStructuredMealForDate } from '../../data/menuRotation';
import { ChevronLeft, ChevronRight, Check, Sparkles, RotateCcw, Calendar, Utensils } from 'lucide-react';

interface CustomerMealCalendarPickerProps {
  selectedDays: SelectedLunchDay[];
  onChange: (days: SelectedLunchDay[]) => void;
  maxDaysTarget?: number;
}

export const CustomerMealCalendarPicker: React.FC<CustomerMealCalendarPickerProps> = ({
  selectedDays,
  onChange,
  maxDaysTarget,
}) => {
  const today = new Date();
  // Default to October 2026 or current month
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // October (0-indexed: 9)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Convert selectedDays array to a map for O(1) lookup
  const selectedMap = useMemo(() => {
    const map: Record<string, SelectedLunchDay> = {};
    selectedDays.forEach((item) => {
      map[item.dateStr] = item;
    });
    return map;
  }, [selectedDays]);

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

  // Calendar cells for currentMonth (Monday to Sunday Worldwide Standard)
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

    // Next month padding to fill out rows of 7
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(currentYear, currentMonth + 1, i);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = `${date.getFullYear()}-${mm}-${dd}`;
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        cells.push({
          dayNumber: i,
          isCurrentMonth: false,
          date,
          dateStr,
          isWeekend,
          meal: isWeekend ? null : getStructuredMealForDate(date),
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth, firstDayIndex, totalDaysInMonth, prevMonthDays]);

  const handleToggleDay = (cell: { dateStr: string; meal: StructuredMeal | null; isWeekend: boolean }) => {
    if (cell.isWeekend || !cell.meal) return;
    const isSelected = !!selectedMap[cell.dateStr];

    if (isSelected) {
      // Remove day
      const updated = selectedDays.filter((d) => d.dateStr !== cell.dateStr);
      onChange(updated);
    } else {
      // Add day
      const defaultSwallow: SwallowType | undefined = cell.meal.mealCategory === 'Swallow' ? 'Semo' : undefined;
      const newEntry: SelectedLunchDay = {
        dateStr: cell.dateStr,
        meal: cell.meal,
        selectedSwallow: defaultSwallow,
      };
      // Sort chronologically
      const updated = [...selectedDays, newEntry].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
      onChange(updated);
    }
  };

  const handleSwallowChange = (dateStr: string, swallow: SwallowType, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    const updated = selectedDays.map((d) => (d.dateStr === dateStr ? { ...d, selectedSwallow: swallow } : d));
    onChange(updated);
  };

  // Quick preset selector
  const handleSelectNextWorkdays = (count: number) => {
    const newSelected: SelectedLunchDay[] = [];
    // Start from October 1st, 2026 (or first workday of current viewed month)
    let iterDate = new Date(currentYear, currentMonth, 1);
    let selectedCount = 0;

    while (selectedCount < count) {
      const dow = iterDate.getDay();
      if (dow >= 1 && dow <= 5) {
        const mm = String(iterDate.getMonth() + 1).padStart(2, '0');
        const dd = String(iterDate.getDate()).padStart(2, '0');
        const dateStr = `${iterDate.getFullYear()}-${mm}-${dd}`;
        const meal = getStructuredMealForDate(iterDate);

        if (meal) {
          const defaultSwallow: SwallowType | undefined = meal.mealCategory === 'Swallow' ? 'Semo' : undefined;
          newSelected.push({
            dateStr,
            meal,
            selectedSwallow: defaultSwallow,
          });
          selectedCount++;
        }
      }
      iterDate.setDate(iterDate.getDate() + 1);
    }

    onChange(newSelected);
  };

  const orderSummary = useMemo(() => calculateOrderSummary(selectedDays), [selectedDays]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden font-['Poppins']">
      
      {/* Calendar Header with Presets & Navigation */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 bg-[#FAF7F2] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#FF4C00]" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Select Customer's Paid Meal Days
              </span>
            </div>
            <h4 className="text-lg font-black text-zinc-900 mt-0.5">
              {monthNames[currentMonth]} {currentYear}
            </h4>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-zinc-700 min-w-[90px] text-center">
              {monthNames[currentMonth].substring(0, 3)} {currentYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200/60">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Quick Fill:</span>
          <button
            type="button"
            onClick={() => handleSelectNextWorkdays(5)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-800 hover:border-[#FF4C00] hover:text-[#FF4C00] transition cursor-pointer"
          >
            + 5 Days (1 Week)
          </button>
          <button
            type="button"
            onClick={() => handleSelectNextWorkdays(10)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-800 hover:border-[#FF4C00] hover:text-[#FF4C00] transition cursor-pointer"
          >
            + 10 Days (2 Weeks)
          </button>
          <button
            type="button"
            onClick={() => handleSelectNextWorkdays(20)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FF4C00]/10 border border-[#FF4C00]/30 text-[#FF4C00] hover:bg-[#FF4C00] hover:text-white transition cursor-pointer"
          >
            ★ 20 Days (Full Month)
          </button>
          {selectedDays.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-auto"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* Weekday Header: Monday to Sunday */}
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center py-2 text-xs font-bold text-zinc-500">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span className="text-zinc-400">Sat</span>
        <span className="text-zinc-400">Sun</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-zinc-200 p-px">
        {calendarDays.map((cell, idx) => {
          const isSelected = !!selectedMap[cell.dateStr];
          const selectedItem = selectedMap[cell.dateStr];
          const isWorkday = !cell.isWeekend;

          let categoryEmoji = '🍚';
          if (cell.meal) {
            const cat = cell.meal.mealCategory;
            if (cat === 'Swallow') categoryEmoji = '🍲';
            else if (cat === 'Beans / Moi Moi' || cat === 'Rice & Beans') categoryEmoji = '🫘';
            else if (cat === 'Pasta') categoryEmoji = '🍝';
            else if (cat === 'Yam' || cat === 'Plantain') categoryEmoji = '🍠';
          }

          return (
            <div
              key={idx}
              onClick={() => isWorkday && handleToggleDay(cell)}
              className={`min-h-[110px] p-2 flex flex-col justify-between transition text-left relative ${
                cell.isWeekend
                  ? 'bg-zinc-100/60 opacity-40 cursor-not-allowed'
                  : !cell.isCurrentMonth
                  ? 'bg-white opacity-40 cursor-pointer hover:bg-zinc-50'
                  : isSelected
                  ? 'bg-[#FF4C00]/5 ring-2 ring-[#FF4C00] ring-inset cursor-pointer'
                  : 'bg-white hover:bg-zinc-50 cursor-pointer'
              }`}
            >
              {/* Day Number & Selection Indicator */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-[#FF4C00] font-black'
                      : cell.isWeekend
                      ? 'text-zinc-400'
                      : 'text-zinc-700'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {isWorkday && (
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-[#FF4C00] text-white'
                        : 'border border-zinc-300 text-transparent'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Meal Title & Swallow Choice */}
              {isWorkday && cell.meal && (
                <div className="mt-1 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1 text-[11px] font-semibold text-zinc-900 leading-tight line-clamp-2">
                      <span>{categoryEmoji}</span>
                      <span className={isSelected ? 'text-[#FF4C00] font-bold' : ''}>
                        {cell.meal.mealName}
                      </span>
                    </div>
                  </div>

                  {/* Swallow selection dropdown if meal is Swallow */}
                  {cell.meal.mealCategory === 'Swallow' && isSelected && (
                    <div className="mt-1 pt-1 border-t border-orange-200/60" onClick={(e) => e.stopPropagation()}>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-0.5">
                        Swallow Choice:
                      </label>
                      <select
                        value={selectedItem?.selectedSwallow || 'Semo'}
                        onChange={(e) => handleSwallowChange(cell.dateStr, e.target.value as SwallowType, e)}
                        className="w-full text-[10px] font-bold bg-white border border-[#FF4C00]/40 rounded px-1 py-0.5 text-zinc-800 focus:outline-hidden"
                      >
                        <option value="Semo">Semo</option>
                        <option value="Eba">Eba</option>
                        <option value="Fufu">Fufu</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar Bottom Bar: Selected Summary & Calculated Total */}
      <div className="p-4 bg-zinc-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF4C00] flex items-center justify-center font-black text-lg text-white">
            {selectedDays.length}
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Customer Days Selected
            </span>
            <p className="text-sm font-semibold text-white">
              {selectedDays.length} Workday Lunches
              {maxDaysTarget && (
                <span className="text-zinc-400 font-normal ml-1">
                  (Target: {maxDaysTarget} days)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 self-end sm:self-auto">
          {orderSummary.hasTwentyDayBonus && (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-full">
              ★ 20th Day Free Applied
            </span>
          )}
          <div className="text-right">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Total Subscription Amount
            </span>
            <span className="text-xl font-black text-[#FF4C00]">
              ₦{orderSummary.finalTotalNGN.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
