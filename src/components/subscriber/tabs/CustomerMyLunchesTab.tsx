import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  SelectedLunchDay,
} from '../../../types';
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

interface CustomerMyLunchesTabProps {
  userProfile: UserProfile;
  onSkipLunch: (dateStr: string) => void;
  onOpenAddDaysModal: () => void;
}

export const CustomerMyLunchesTab: React.FC<CustomerMyLunchesTabProps> = ({
  userProfile,
  onSkipLunch,
  onOpenAddDaysModal,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'upcoming' | 'past' | 'skipped'>('all');
  const [selectedMealModal, setSelectedMealModal] = useState<any | null>(null);
  const [dateToSkip, setDateToSkip] = useState<string | null>(null);

  const formatYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = formatYmd(new Date());

  // Map user dates with status
  const lunchesList = useMemo(() => {
    const skippedSet = new Set(userProfile.skippedDates || []);
    return (userProfile.selectedDays || []).map((day) => {
      const isSkipped = skippedSet.has(day.dateStr);
      const isPast = day.dateStr < todayStr;
      const isToday = day.dateStr === todayStr;

      let status: 'Scheduled' | 'Preparing' | 'On the way' | 'Delivered' | 'Skipped' | 'Credit' = 'Scheduled';

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

      return {
        dateStr: day.dateStr,
        day: day.day,
        meal: day.meal,
        selectedSwallow: day.selectedSwallow,
        status,
        isPast,
        isToday,
        isSkipped,
      };
    }).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [userProfile.selectedDays, userProfile.skippedDates, todayStr]);

  // Filtered view
  const filteredLunches = useMemo(() => {
    if (filterMode === 'upcoming') {
      return lunchesList.filter((l) => l.dateStr >= todayStr && !l.isSkipped);
    }
    if (filterMode === 'past') {
      return lunchesList.filter((l) => l.isPast && !l.isSkipped);
    }
    if (filterMode === 'skipped') {
      return lunchesList.filter((l) => l.isSkipped);
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

              return (
                <div
                  key={item.dateStr}
                  className={`bg-white rounded-2xl border p-4.5 transition shadow-2xs flex flex-col justify-between space-y-3 ${
                    item.isToday
                      ? 'border-[#FF4C00] ring-2 ring-[#FF4C00]/10'
                      : item.isSkipped
                      ? 'border-zinc-200 opacity-75'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div>
                    {/* Top Date & Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-zinc-900">
                          {formattedDate}
                        </span>
                        {item.isToday && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-white bg-[#FF4C00] px-1.5 py-0.5 rounded-full">
                            Today
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
                        Category: {item.meal.mealCategory} • {item.meal.ingredients?.join(', ')}
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

                    {!item.isPast && !item.isSkipped && (
                      <button
                        type="button"
                        onClick={() => setDateToSkip(item.dateStr)}
                        className="text-amber-700 hover:text-amber-900 font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Skip Lunch</span>
                      </button>
                    )}

                    {item.isSkipped && (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Credit In Wallet</span>
                      </span>
                    )}
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

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Ingredients:</span>
                <p className="text-zinc-700 font-medium">
                  {selectedMealModal.ingredients?.join(', ') || 'Fresh market ingredients'}
                </p>
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
