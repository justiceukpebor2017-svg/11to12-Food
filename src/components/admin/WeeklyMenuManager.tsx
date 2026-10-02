import React, { useState } from 'react';
import {
  UtensilsCrossed,
  CheckCircle2,
  Calendar,
  Lock,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  TWENTY_SIX_WEEK_MENU,
  BASE_DATE,
  getStructuredMealForDate,
  updateCustomMealForDate,
} from '../../data/menuRotation';
import { StructuredMeal, calculateMealPrice, PER_DAY_FEE } from '../../types';

export const WeeklyMenuManager: React.FC = () => {
  // Current simulated calendar date (Sept 21, 2026)
  const today = new Date(2026, 8, 21); // Month is 0-indexed (8 = Sept)
  const todayStr = '2026-09-21';

  // Admin can navigate across all 26 weeks
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [editingDateStr, setEditingDateStr] = useState<string | null>(null);
  
  // Edit form state
  const [editMealName, setEditMealName] = useState<string>('');
  const [editMealPrice, setEditMealPrice] = useState<number>(2900);
  const [editIngredients, setEditIngredients] = useState<string[]>([]);
  const [newIngredientInput, setNewIngredientInput] = useState<string>('');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Calculate dates for Monday-Friday of the selected week (Week 1 starts Oct 5, 2026)
  const weekDays = [
    { key: 'Mon', name: 'Monday', offset: 0 },
    { key: 'Tue', name: 'Tuesday', offset: 1 },
    { key: 'Wed', name: 'Wednesday', offset: 2 },
    { key: 'Thu', name: 'Thursday', offset: 3 },
    { key: 'Fri', name: 'Friday', offset: 4 },
  ];

  const weekStartDate = new Date(BASE_DATE);
  weekStartDate.setDate(BASE_DATE.getDate() + (selectedWeek - 1) * 7);

  const daysData = weekDays.map((d) => {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + d.offset);
    const yyyy = dayDate.getFullYear();
    const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dayDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isPast = dateStr < todayStr;
    const meal = getStructuredMealForDate(dayDate);

    return {
      dayName: d.name,
      dayShort: d.key,
      date: dayDate,
      dateStr,
      isPast,
      meal,
    };
  });

  const handleStartEdit = (meal: StructuredMeal | null, dateStr: string) => {
    if (!meal) return;
    setEditingDateStr(dateStr);
    setEditMealName(meal.mealName);
    setEditMealPrice(calculateMealPrice(meal));
    setEditIngredients(meal.ingredients ? [...meal.ingredients] : [meal.baseIngredient || '', meal.protein || ''].filter(Boolean));
    setNewIngredientInput('');
  };

  const handleAddIngredient = () => {
    if (!newIngredientInput.trim()) return;
    setEditIngredients((prev) => [...prev, newIngredientInput.trim()]);
    setNewIngredientInput('');
  };

  const handleRemoveIngredient = (index: number) => {
    setEditIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllIngredients = () => {
    setEditIngredients([]);
  };

  const handleSaveMeal = (originalMeal: StructuredMeal, dateStr: string) => {
    const parsedPrice = Number(editMealPrice) > 0 ? Number(editMealPrice) : calculateMealPrice(originalMeal);
    const updatedMeal: StructuredMeal = {
      ...originalMeal,
      mealName: editMealName.trim() || originalMeal.mealName,
      // If admin modified ingredients (even if cleared to []), use editIngredients directly so empty is respected
      ingredients: editIngredients,
      price: parsedPrice,
    };

    updateCustomMealForDate(dateStr, updatedMeal);
    setEditingDateStr(null);
    setRefreshKey((k) => k + 1); // trigger re-render
    setSyncNotice(`Updated ${originalMeal.day} meal (₦${parsedPrice.toLocaleString()} + ₦${PER_DAY_FEE} add-on)! Live calculator and menu synced.`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            6-Month Menu Engine
          </span>
          <h2 className="text-2xl font-black text-black mt-0.5">
            Weekly Menu & Future Date Recipe Editor
          </h2>
          <p className="text-xs text-zinc-500">
            Edit meals and ingredients for any upcoming workday across the 26-week rotation. Past days remain locked.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            ✓ Live Homepage Sync Active
          </span>
        </div>
      </div>

      {syncNotice && (
        <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-2 border border-emerald-200 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Week Selector Bar (26 Weeks across 6 Months) */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#FF4C00]" />
            <span className="text-xs font-bold uppercase tracking-wider text-black">
              Select Rotation Week
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
              disabled={selectedWeek === 1}
              className="p-1.5 rounded-full border border-zinc-200 bg-white text-zinc-600 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-black px-2">
              Week {selectedWeek} of 26
            </span>
            <button
              onClick={() => setSelectedWeek((w) => Math.min(26, w + 1))}
              disabled={selectedWeek === 26}
              className="p-1.5 rounded-full border border-zinc-200 bg-white text-zinc-600 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable quick-jump pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {Array.from({ length: 26 }, (_, i) => i + 1).map((weekNum) => {
            const monthNumber = Math.ceil(weekNum / 4.33);
            const isSelected = selectedWeek === weekNum;
            return (
              <button
                key={weekNum}
                onClick={() => setSelectedWeek(weekNum)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white'
                    : 'bg-[#FAF7F2] text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
                }`}
              >
                Wk {weekNum} (M{monthNumber})
              </button>
            );
          })}
        </div>
      </div>

      {/* Week Days Cards — Matches Homepage "What is the kitchen cooking this week?" Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysData.map((dayItem) => {
          const meal = dayItem.meal;
          if (!meal) return null;

          const isEditing = editingDateStr === dayItem.dateStr;

          return (
            <div
              key={dayItem.dateStr}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all ${
                dayItem.isPast
                  ? 'bg-zinc-100/70 border-zinc-200 opacity-60'
                  : 'bg-white border-zinc-200 shadow-xs hover:border-[#FF4C00]/40'
              }`}
            >
              {/* Card Top: Day & Date */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#FF4C00] uppercase tracking-wider">
                    {dayItem.dayName}
                  </span>
                  <span className="text-zinc-500 font-medium">
                    {dayItem.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {isEditing ? (
                  /* EDITING MODE */
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                        Meal Title
                      </label>
                      <input
                        type="text"
                        value={editMealName}
                        onChange={(e) => setEditMealName(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-zinc-300 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase text-zinc-600 block mb-1">
                        Meal Price Amount (₦)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        value={editMealPrice}
                        onChange={(e) => setEditMealPrice(Number(e.target.value))}
                        className="w-full bg-[#FAF7F2] border border-zinc-300 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-[#FF4C00]"
                      />
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        Calculator draws: ₦{editMealPrice.toLocaleString()} + ₦{PER_DAY_FEE} auto add-on = <strong>₦{(editMealPrice + PER_DAY_FEE).toLocaleString()}</strong>
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold uppercase text-zinc-600 block">
                          What's In It (Ingredients List)
                        </label>
                        {editIngredients.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllIngredients}
                            className="text-[10px] text-rose-600 font-semibold hover:underline cursor-pointer"
                          >
                            Remove All / None
                          </button>
                        )}
                      </div>
                      
                      {editIngredients.length > 0 ? (
                        <div className="space-y-1.5 mb-2">
                          {editIngredients.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-zinc-200 text-xs"
                            >
                              <span className="font-medium text-zinc-800">{item}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(idx)}
                                className="text-zinc-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-400 italic mb-2">
                          No ingredients added. Only food title will display on menu & dashboard.
                        </p>
                      )}

                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          placeholder="Add ingredient..."
                          value={newIngredientInput}
                          onChange={(e) => setNewIngredientInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddIngredient();
                            }
                          }}
                          className="flex-1 bg-[#FAF7F2] border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-black focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddIngredient}
                          className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveMeal(meal, dayItem.dateStr)}
                        className="flex-1 py-2 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save & Sync</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDateStr(null)}
                        className="px-3 py-2 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEWING MODE — Clean Homepage Style */
                  <div>
                    {/* Meal Name */}
                    <h3 className="text-lg font-black text-black leading-snug mt-1">
                      {meal.mealName}
                    </h3>

                    {/* Price and Add-on breakdown */}
                    <div className="mt-2 flex items-center space-x-2 text-xs">
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        ₦{calculateMealPrice(meal).toLocaleString()} + ₦{PER_DAY_FEE} add-on
                      </span>
                    </div>

                    {/* Friday Swallow Tag if applicable */}
                    {meal.swallowOptions && (
                      <div className="mt-2 text-xs">
                        <span className="font-semibold text-zinc-600">Swallow Options: </span>
                        <span className="text-[#FF4C00] font-bold">Semo / Eba / Fufu</span>
                      </div>
                    )}

                    {/* What's In It (Shown ONLY if ingredients exist) */}
                    {meal.ingredients && meal.ingredients.length > 0 ? (
                      <div className="mt-4 pt-3 border-t border-zinc-100">
                        <div className="text-[11px] font-bold text-black uppercase tracking-wide mb-2">
                          What's In It
                        </div>
                        <ul className="text-xs text-zinc-700 space-y-1.5">
                          {meal.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4C00] shrink-0" />
                              <span className="font-medium">{ing}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Card Footer: Past Date Locked or Edit Button */}
              {!isEditing && (
                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  {dayItem.isPast ? (
                    <div className="flex items-center space-x-1.5 text-zinc-400 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Past Date — Locked</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(meal, dayItem.dateStr)}
                      className="w-full py-2.5 rounded-xl border border-zinc-300 hover:border-[#FF4C00] hover:bg-[#FAF7F2] text-zinc-800 hover:text-[#FF4C00] font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Meal & Ingredients</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
