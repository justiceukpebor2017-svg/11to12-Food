import React, { useState } from 'react';
import { MenuItem } from '../../types';
import { getStructuredMealForDate } from '../../data/menuRotation';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { LAUNCH_CONFIG, isDateBeforeLaunch } from '../../config/launchConfig';

interface InteractiveCalendarProps {
  menuItems?: MenuItem[];
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = () => {
  // Anchored to official launch date (November 2, 2026)
  const [currentYear, setCurrentYear] = useState(LAUNCH_CONFIG.year);
  const [currentMonth, setCurrentMonth] = useState(LAUNCH_CONFIG.monthIndex);
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(LAUNCH_CONFIG.year, LAUNCH_CONFIG.monthIndex, LAUNCH_CONFIG.day)
  );

  const selectedMeal = getStructuredMealForDate(selectedDate) || {
    id: 'default',
    dateStr: LAUNCH_CONFIG.dateString,
    day: 'Monday' as const,
    mealName: 'Jollof Rice + Grilled Chicken',
    mealCategory: 'Rice' as const,
    baseIngredient: 'Jollof Rice',
    protein: 'Grilled Chicken',
    description: 'Slow-simmered aromatic party jollof rice tossed with sweet peppers and tender seasoned grilled chicken.',
    ingredients: ['Parboiled Long-grain Rice', 'Wood-smoked Pepper Puree', 'Grilled Spiced Chicken'],
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800',
    subPackOption: {
      title: 'Sub Pack Alternative',
      description: 'Hot Mini Puff-Puff (6pcs), Spicy Meat Pie, and Chilled Zobo with Ginger.',
      items: ['Puff-Puff', 'Meat Pie', 'Zobo'],
    },
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
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

  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells: {
    dayNumber: number;
    isCurrentMonth: boolean;
    date: Date;
    isWeekend: boolean;
    isBeforeLaunch: boolean;
    isSelected: boolean;
    mealName?: string;
  }[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const date = new Date(currentYear, currentMonth - 1, d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: false,
      date,
      isWeekend,
      isBeforeLaunch: isDateBeforeLaunch(date),
      isSelected: false,
    });
  }

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const date = new Date(currentYear, currentMonth, d);
    const isSelected =
      selectedDate.getFullYear() === currentYear &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getDate() === d;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isBeforeLaunch = isDateBeforeLaunch(date);
    const m = isWeekend ? null : getStructuredMealForDate(date);

    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: true,
      date,
      isWeekend,
      isBeforeLaunch,
      isSelected,
      mealName: m ? m.mealName : undefined,
    });
  }

  const remainingCells = 35 - calendarCells.length > 0 ? 35 - calendarCells.length : 42 - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const date = new Date(currentYear, currentMonth + 1, d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: false,
      date,
      isWeekend,
      isBeforeLaunch: isDateBeforeLaunch(date),
      isSelected: false,
    });
  }

  const isCurrentMonthPreLaunch =
    currentYear < LAUNCH_CONFIG.year ||
    (currentYear === LAUNCH_CONFIG.year && currentMonth < LAUNCH_CONFIG.monthIndex);

  return (
    <section id="menu" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-[#FF4C00] uppercase tracking-wider">
            6-Month Menu Rotation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black mt-1">
            What is the kitchen cooking this week?
          </h2>
          <p className="text-base text-zinc-500 font-normal mt-2">
            Click on any workday below to inspect scheduled meals and what's in it.
          </p>
        </div>

        {/* Calendar & Meal Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Calendar Grid (7 Cols) */}
          <div className="lg:col-span-7 bg-[#FAF7F2] border border-zinc-200/80 rounded-3xl p-4 sm:p-8 max-w-full overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base sm:text-lg font-bold text-black">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pre-launch alert banner if navigating back into past months */}
            {isCurrentMonthPreLaunch && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-[#FF4C00] shrink-0" />
                <span>
                  Pre-launch period. Deliveries begin <strong>{LAUNCH_CONFIG.displayDate}</strong>. All previous dates are locked.
                </span>
              </div>
            )}

            {/* Days of week (Monday to Sunday Worldwide) */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-zinc-400 mb-2">
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div className="text-zinc-400/80">Sa</div>
              <div className="text-zinc-400/80">Su</div>
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarCells.map((cell, idx) => {
                const disabled = !cell.isCurrentMonth || cell.isWeekend || cell.isBeforeLaunch;
                return (
                  <button
                    key={idx}
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) setSelectedDate(cell.date);
                    }}
                    className={`h-10 sm:h-12 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      cell.isSelected
                        ? 'bg-[#FF4C00] text-white shadow-sm scale-105'
                        : cell.isBeforeLaunch
                        ? 'text-zinc-300/60 bg-zinc-100/40 opacity-30 cursor-not-allowed select-none'
                        : disabled
                        ? 'text-zinc-300 bg-transparent cursor-not-allowed'
                        : 'bg-white text-zinc-700 hover:border-zinc-300 border border-zinc-200 cursor-pointer'
                    }`}
                  >
                    <span>{cell.dayNumber}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 text-xs text-zinc-500 flex flex-wrap gap-2 items-center justify-between">
              <span>Weekends reserved for kitchen prep</span>
              <a href="#pricing" className="text-[#FF4C00] font-semibold hover:underline">
                Build your plan →
              </a>
            </div>
          </div>

          {/* Meal Details Card (5 Cols) - Clean: Only Meal Title and What's In It */}
          <div className="lg:col-span-5 bg-[#FAF7F2] border border-zinc-200/80 rounded-3xl p-5 sm:p-8 max-w-full overflow-hidden">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium mb-3">
              <span className="uppercase tracking-wider font-semibold text-[#FF4C00]">
                {selectedMeal.day}
              </span>
              <span>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Meal Title - ONLY Meal Title, no description */}
            <h3 className="text-xl sm:text-2xl font-bold text-black leading-snug">
              {selectedMeal.mealName}
            </h3>

            {/* Friday Swallow Options if applicable */}
            {selectedMeal.swallowOptions && (
              <div className="mt-3 flex items-center space-x-2 text-xs">
                <span className="font-semibold text-zinc-700">Swallow Options:</span>
                <span className="text-[#FF4C00] font-bold">Semo / Eba / Fufu</span>
              </div>
            )}

            {/* What's In It - Displayed ONLY if admin added ingredients */}
            {selectedMeal.ingredients && selectedMeal.ingredients.length > 0 && (
              <div className="mt-6 pt-5 border-t border-zinc-200/80">
                <div className="text-xs font-bold text-black uppercase tracking-wide mb-3">
                  What's In It
                </div>
                <ul className="text-xs text-zinc-700 space-y-2">
                  {selectedMeal.ingredients.map((item, i) => (
                    <li key={i} className="flex items-center space-x-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF4C00] shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA to Plan Builder */}
            <div className="mt-8 pt-4">
              <a
                href="#pricing"
                className="w-full py-3.5 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center transition shadow-sm"
              >
                Select this meal in Build Your Lunch Plan
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
