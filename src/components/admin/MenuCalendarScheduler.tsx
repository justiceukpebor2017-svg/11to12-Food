import React, { useState } from 'react';
import { MenuItem, DayOfWeek } from '../../types';
import { TWENTY_SIX_WEEK_MENU, WeekMenuPlan, getMealDetails } from '../../data/menuRotation';
import { Calendar as CalendarIcon, ShieldAlert, Plus, Edit3, CheckCircle2, RotateCw, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface MenuCalendarSchedulerProps {
  menuItems: MenuItem[];
  onUpdateMenuItem: (item: MenuItem) => void;
}

export const MenuCalendarScheduler: React.FC<MenuCalendarSchedulerProps> = ({
  menuItems,
  onUpdateMenuItem,
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0); // 0 to 25 (Week 1 to 26)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Mon');
  const [weekendAttemptAlert, setWeekendAttemptAlert] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MenuItem | null>(null);

  const activeWeekPlan: WeekMenuPlan = TWENTY_SIX_WEEK_MENU[selectedWeekIndex];

  // Derive current meal from active 26-week plan
  const mealTitleForDay = activeWeekPlan.days[selectedDay as keyof WeekMenuPlan['days']] || 'Jollof rice + grilled chicken';
  const currentMeal: MenuItem = getMealDetails(mealTitleForDay, selectedDay, `2026-W${activeWeekPlan.weekNumber}`);

  const handleSelectDay = (day: DayOfWeek) => {
    if (day === 'Sat' || day === ('Sun' as any)) {
      setWeekendAttemptAlert(true);
      setTimeout(() => setWeekendAttemptAlert(false), 3000);
      return;
    }
    setWeekendAttemptAlert(false);
    setSelectedDay(day);
  };

  const handleSaveMealEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMeal) {
      onUpdateMenuItem(editingMeal);
      setEditingMeal(null);
    }
  };

  return (
    <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      
      {/* Header with 26-Week Cycle Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-black">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase text-black bg-[#FACC15] px-3 py-1 border-2 border-black font-mono-custom shadow-[2px_2px_0px_#000]">
              26-WEEK MENU ENGINE
            </span>
            <span className="text-xs font-black uppercase text-white bg-[#22C55E] px-2.5 py-1 border-2 border-black font-mono-custom flex items-center space-x-1">
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>AUTO-RESTART ENABLED</span>
            </span>
          </div>
          <h3 className="text-2xl font-black uppercase font-heading text-black mt-2">
            CANONICAL 26-WEEK ROTATION SCHEDULER
          </h3>
          <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
            All 26 weeks sync automatically across the marketing calendar, desk drops, and subscriber portal. Cycles loop continuously.
          </p>
        </div>

        <button
          onClick={() => setEditingMeal(currentMeal)}
          className="px-5 py-3 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-xs uppercase border-3 border-black shadow-[3px_3px_0px_#000] cursor-pointer transition-all flex items-center space-x-1.5"
        >
          <Edit3 className="w-4 h-4 stroke-[3]" />
          <span>EDIT DISH RECIPE</span>
        </button>
      </div>

      {/* Week Selector Bar (Week 1 through Week 26) */}
      <div className="bg-[#FAF7F2] p-4 border-3 border-black space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase font-mono-custom text-zinc-700">
              ACTIVE ROTATION:
            </span>
            <span className="text-sm font-black uppercase text-[#FF4C00] font-heading">
              WEEK {activeWeekPlan.weekNumber} OF 26 (MONTH {activeWeekPlan.monthNumber})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedWeekIndex((prev) => (prev === 0 ? 25 : prev - 1))}
              className="p-1.5 bg-white border-2 border-black hover:bg-[#FACC15] transition"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>
            <span className="text-xs font-mono-custom font-black px-2">
              Wk {activeWeekPlan.weekNumber}
            </span>
            <button
              onClick={() => setSelectedWeekIndex((prev) => (prev === 25 ? 0 : prev + 1))}
              className="p-1.5 bg-white border-2 border-black hover:bg-[#FACC15] transition"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Scrollable quick pills for all 26 weeks */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {TWENTY_SIX_WEEK_MENU.map((w, idx) => (
            <button
              key={w.weekNumber}
              onClick={() => setSelectedWeekIndex(idx)}
              className={`px-3 py-1 text-[11px] font-black font-mono-custom whitespace-nowrap border-2 border-black transition ${
                idx === selectedWeekIndex
                  ? 'bg-[#FF4C00] text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-black hover:bg-[#FACC15]'
              }`}
            >
              Wk {w.weekNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Weekend Guard Banner Alert */}
      {weekendAttemptAlert && (
        <div className="p-4 bg-[#FF4C00] text-white border-3 border-black text-xs font-black uppercase flex items-center space-x-3 shadow-[4px_4px_0px_#000] animate-bounce">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 stroke-[3]" />
          <span>
            WEEKEND GUARD ACTIVE: Kitchen operations are closed on Saturdays & Sundays. Dispatch team is offline.
          </span>
        </div>
      )}

      {/* 5 Workdays for Selected Week */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day) => {
          const isWeekend = day === 'Sat';
          const isSelected = day === selectedDay;
          const dishName = !isWeekend ? activeWeekPlan.days[day as keyof WeekMenuPlan['days']] : 'Kitchen Closed';

          return (
            <button
              key={day}
              onClick={() => handleSelectDay(day)}
              className={`p-3 border-3 border-black text-left transition cursor-pointer flex flex-col justify-between ${
                isWeekend
                  ? 'bg-zinc-200 text-zinc-500 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[#FF4C00] text-white font-black shadow-[4px_4px_0px_#000]'
                  : 'bg-white text-black hover:bg-[#FACC15] font-black shadow-[2px_2px_0px_#000]'
              }`}
            >
              <div>
                <div className="text-xs uppercase font-black font-heading">{day}</div>
                <div className="text-[10px] font-mono-custom font-bold mt-0.5 uppercase">
                  {isWeekend ? 'BLOCKED' : `Wk ${activeWeekPlan.weekNumber}`}
                </div>
              </div>
              <div className="text-[11px] font-bold mt-2 line-clamp-2 leading-tight">
                {dishName}
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Scheduled Meal Overview Card */}
      {currentMeal && (
        <div className="bg-[#F8F8F8] p-6 border-3 border-black shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row gap-6 items-center">
          <img
            src={currentMeal.imageUrl}
            alt={currentMeal.title}
            className="w-28 h-28 object-cover border-3 border-black shadow-[3px_3px_0px_#000] flex-shrink-0"
          />
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-black font-mono-custom bg-[#FACC15] px-2.5 py-0.5 border-2 border-black uppercase shadow-[1px_1px_0px_#000]">
                Week {activeWeekPlan.weekNumber} • {currentMeal.day}
              </span>
              <span className="text-xs font-bold text-zinc-700 uppercase">{currentMeal.category}</span>
            </div>
            <h4 className="text-xl font-black uppercase font-heading text-black">{currentMeal.title}</h4>
            <p className="text-xs font-bold text-zinc-800 uppercase">{currentMeal.description}</p>
            <div className="text-xs text-black font-mono-custom font-bold pt-1 uppercase">
              PROTEIN: <strong className="text-[#FF4C00]">{currentMeal.protein}</strong> • SPICE: <strong className="text-[#22C55E]">{currentMeal.spiceLevel}</strong> • INGREDIENTS: <span className="text-zinc-700">{currentMeal.ingredients.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Meal Detail Editor Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSaveMealEdit} className="bg-white border-4 border-black p-6 sm:p-8 max-w-lg w-full text-black space-y-4 shadow-[12px_12px_0px_#000]">
            <h4 className="text-xl font-black uppercase font-heading text-black">
              EDIT RECIPE: WEEK {activeWeekPlan.weekNumber} {editingMeal.day}
            </h4>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Meal Title</label>
              <input
                type="text"
                required
                value={editingMeal.title}
                onChange={(e) => setEditingMeal({ ...editingMeal, title: e.target.value })}
                className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Description</label>
              <textarea
                required
                value={editingMeal.description}
                onChange={(e) => setEditingMeal({ ...editingMeal, description: e.target.value })}
                rows={2}
                className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Category</label>
                <select
                  value={editingMeal.category}
                  onChange={(e) => setEditingMeal({ ...editingMeal, category: e.target.value as any })}
                  className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-black text-black focus:outline-none uppercase"
                >
                  <option value="Rice & Grains">Rice & Grains</option>
                  <option value="Swallow & Soup">Swallow & Soup</option>
                  <option value="Beans & Delicacies">Beans & Delicacies</option>
                  <option value="Special Feast">Special Feast</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Spice Level</label>
                <select
                  value={editingMeal.spiceLevel}
                  onChange={(e) => setEditingMeal({ ...editingMeal, spiceLevel: e.target.value as any })}
                  className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-black text-black focus:outline-none uppercase"
                >
                  <option value="Mild">Mild</option>
                  <option value="Medium">Medium</option>
                  <option value="Hot">Hot</option>
                  <option value="Pepper Dem">Pepper Dem</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                className="px-4 py-2 border-2 border-black font-black text-xs uppercase hover:bg-zinc-200"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#22C55E] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#1ea750]"
              >
                SAVE DISH
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
