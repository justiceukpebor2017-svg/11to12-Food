import React, { useState } from 'react';
import { Utensils, Calendar, ChevronLeft, ChevronRight, Check, Plus, Info, Sparkles } from 'lucide-react';
import { getStructuredMealForDate } from '../../data/menuRotation';
import { StructuredMeal } from '../../types';

interface MenuExplorerSectionProps {
  onAddMealToPlan?: (dateStr: string) => void;
  selectedDateStrings: string[];
}

export const MenuExplorerSection: React.FC<MenuExplorerSectionProps> = ({
  selectedDateStrings,
}) => {
  // Start from reference week in October 2026 (Oct 5th 2026 is Monday)
  const [weekOffset, setWeekOffset] = useState(0);

  // Compute the Monday of the current selected week
  const baseMonday = new Date(2026, 9, 5); // Oct 5, 2026
  const currentMonday = new Date(baseMonday);
  currentMonday.setDate(baseMonday.getDate() + weekOffset * 7);

  // Generate 5 workdays (Mon-Fri)
  const weekDays = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + offset);
    const meal = getStructuredMealForDate(d);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    return {
      date: d,
      dateStr,
      dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][offset],
      shortDay: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][offset],
      meal,
      isInPlan: selectedDateStrings.includes(dateStr),
    };
  });

  const weekStartDateStr = weekDays[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEndDateStr = weekDays[4].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6 font-['Poppins'] text-left">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] block">
            11 to 12 Kitchen
          </span>
          <h2 className="text-2xl font-black text-black">
            Weekly Kitchen Menu
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Crafted fresh every morning in Victoria Island and delivered in thermal bowls before 12:00 PM.
          </p>
        </div>

        {/* Week Switcher */}
        <div className="flex items-center space-x-2 bg-[#FAF7F2] p-1.5 rounded-full border border-zinc-200">
          <button
            onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
            disabled={weekOffset === 0}
            className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-black px-2">
            {weekStartDateStr} – {weekEndDateStr}
          </span>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-600 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Plan Days Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-[#FF4C00] shrink-0" />
          <span>
            <strong>Kitchen Menu Explorer:</strong> To add meal days to your plan, use the <strong>Dashboard / Plan & Billing</strong> top-up section. Days are activated immediately upon admin payment verification.
          </span>
        </div>
      </div>

      {/* 5 Workdays Display */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {weekDays.map((item) => {
          const meal = item.meal;
          return (
            <div
              key={item.dateStr}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition hover:shadow-md ${
                item.isInPlan
                  ? 'bg-orange-50/40 border-[#FF4C00]/40'
                  : 'bg-white border-zinc-200'
              }`}
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
                  <span className="text-xs font-black uppercase tracking-wider text-[#FF4C00]">
                    {item.shortDay}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">
                    {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Meal Title & Category */}
                <div className="my-4">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {meal?.mealCategory || 'Daily Special'}
                  </span>
                  <h4 className="text-sm font-black text-black mt-0.5 leading-snug">
                    {meal?.mealName || 'Chef Choice Lunch'}
                  </h4>

                  {meal?.protein && (
                    <p className="text-[11px] text-[#FF4C00] font-semibold mt-1">
                      Protein: {meal.protein}
                    </p>
                  )}
                </div>

                {/* Ingredients list */}
                {meal?.ingredients && meal.ingredients.length > 0 && (
                  <div className="my-3 p-3 rounded-2xl bg-[#FAF7F2] border border-zinc-200 text-[11px] space-y-1">
                    <span className="font-bold text-zinc-500 uppercase text-[9px] block">
                      Ingredients
                    </span>
                    <ul className="text-zinc-700 space-y-0.5">
                      {meal.ingredients.slice(0, 3).map((ing, i) => (
                        <li key={i} className="line-clamp-1">
                          • {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Plan Status / View Only Notice */}
              <div className="pt-3 border-t border-zinc-150 mt-4">
                {item.isInPlan ? (
                  <div className="w-full py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>In Your Plan</span>
                  </div>
                ) : (
                  <div className="w-full py-2 rounded-full bg-zinc-100 text-zinc-500 text-[11px] font-semibold flex items-center justify-center space-x-1">
                    <Utensils className="w-3 h-3 text-zinc-400" />
                    <span>Kitchen Menu Preview</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
