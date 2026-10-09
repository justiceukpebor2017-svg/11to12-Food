import React, { useState } from 'react';
import {
  UserProfile,
  MenuItem,
  SelectedLunchDay,
} from '../../../types';
import {
  Utensils,
  Clock,
  MapPin,
  Calendar,
  Wallet,
  ArrowRight,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Truck,
  RotateCcw,
  Eye,
  X,
  Phone,
} from 'lucide-react';
import { CONTACT_CONFIG } from '../../../config/contactConfig';

export type CustomerTabType = 'home' | 'my-lunches' | 'my-plan' | 'lunch-wallet' | 'account';

interface CustomerHomeTabProps {
  userProfile: UserProfile;
  todayMeal: MenuItem;
  tomorrowMeal: MenuItem;
  onNavigateTab: (tab: CustomerTabType) => void;
  onSkipLunch: (dateStr: string) => void;
  onOpenAddressModal: () => void;
}

export const CustomerHomeTab: React.FC<CustomerHomeTabProps> = ({
  userProfile,
  todayMeal,
  tomorrowMeal,
  onNavigateTab,
  onSkipLunch,
  onOpenAddressModal,
}) => {
  const [selectedMealDetails, setSelectedMealDetails] = useState<any | null>(null);
  const [dateToSkip, setDateToSkip] = useState<string | null>(null);

  // Today's YYYY-MM-DD
  const formatYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = formatYmd(new Date());

  // Check if today is selected by the user
  const todaySelection = (userProfile.selectedDays || []).find(
    (d) => d.dateStr === todayStr
  );

  const isTodaySkipped = (userProfile.skippedDates || []).includes(todayStr);

  // Find next upcoming lunch (including today if not skipped, or future)
  const upcomingLunches = (userProfile.selectedDays || [])
    .filter((d) => !(userProfile.skippedDates || []).includes(d.dateStr))
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  const nextUpcoming = upcomingLunches.find((d) => d.dateStr >= todayStr) || upcomingLunches[0];

  // Total scheduled days and remaining days
  const totalSubscribed = userProfile.totalSubscribedDays || userProfile.selectedDays?.length || 0;
  const skippedCount = (userProfile.skippedDates || []).length;
  const remainingLunches = Math.max(0, (userProfile.selectedDays?.length || 0) - skippedCount);

  // 20th Day Reward Progress
  const rewardProgress = Math.min(100, Math.round(((totalSubscribed) / 20) * 100));

  const handleConfirmSkip = () => {
    if (dateToSkip) {
      onSkipLunch(dateToSkip);
      setDateToSkip(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-['Poppins']">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C00]">
            Welcome Back
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight mt-0.5">
            Hello, {userProfile.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Your desk drop lunch plan is <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</strong> • Delivering directly to your workstation.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-[#FAF7F2] p-3 rounded-2xl border border-zinc-200 text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 block font-semibold">Remaining Lunches</span>
            <span className="text-lg font-black text-zinc-900">{remainingLunches} meals</span>
          </div>
          <div className="h-7 w-px bg-zinc-200" />
          <div>
            <span className="text-[10px] text-zinc-400 block font-semibold">Lunch Credits</span>
            <span className="text-lg font-black text-emerald-600">{userProfile.creditsBalance || 0}</span>
          </div>
        </div>
      </div>

      {/* TODAY'S LUNCH HERO CARD */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-base font-bold text-zinc-900">Today's Lunch</h2>
          </div>
          <span className="text-xs font-bold text-[#FF4C00] bg-orange-50 px-2.5 py-1 rounded-full">
            11:00 AM – 12:00 PM Desk Drop
          </span>
        </div>

        {todaySelection && !isTodaySkipped ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Meal Image */}
            <div className="md:col-span-5 relative aspect-video md:aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
              <img
                src={todaySelection.meal.imageUrl || todayMeal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'}
                alt={todaySelection.meal.mealName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {todaySelection.meal.mealCategory}
              </div>
            </div>

            {/* Meal Info & Delivery Tracking */}
            <div className="md:col-span-7 space-y-4 text-xs">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-zinc-900">
                  {todaySelection.meal.mealName}
                </h3>
                {todaySelection.selectedSwallow && (
                  <span className="inline-block mt-1 text-[11px] font-bold text-[#FF4C00] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                    Swallow: {todaySelection.selectedSwallow}
                  </span>
                )}
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  {todaySelection.meal.ingredients?.join(' • ') || 'Prepared hot in the morning with fresh market ingredients.'}
                </p>
              </div>

              {/* Status and Location */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-zinc-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-semibold">Delivery Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px] flex items-center space-x-1">
                    <Truck className="w-3 h-3" />
                    <span>Dispatched on Route</span>
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-zinc-500 font-semibold shrink-0">Workstation:</span>
                  <span className="font-bold text-zinc-900 text-right ml-2 truncate max-w-[220px]" title={userProfile.address}>
                    {userProfile.address || 'Office Desk'}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedMealDetails(todaySelection.meal)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 font-semibold text-zinc-800 transition cursor-pointer flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Meal Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateToSkip(todayStr)}
                  className="px-3.5 py-2 rounded-xl text-amber-700 hover:bg-amber-50 border border-amber-200 font-semibold transition cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Skip Today's Lunch</span>
                </button>
              </div>
            </div>

          </div>
        ) : isTodaySkipped ? (
          <div className="py-8 px-4 text-center bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
            <span className="inline-block p-2 rounded-full bg-amber-100 text-amber-800">
              <RotateCcw className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-bold text-amber-900">Today's Lunch Was Skipped</h3>
            <p className="text-xs text-amber-800 max-w-md mx-auto">
              Your kitchen delivery was paused for today and 1 meal credit has been added to your Lunch Wallet.
            </p>
            <button
              onClick={() => onNavigateTab('lunch-wallet')}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 cursor-pointer"
            >
              View Lunch Wallet
            </button>
          </div>
        ) : (
          <div className="py-8 px-4 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
            <Calendar className="w-6 h-6 text-zinc-400 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-800">No Lunch Delivery Scheduled For Today</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {nextUpcoming ? (
                <>Your next scheduled lunch is <strong>{nextUpcoming.dateStr} ({nextUpcoming.meal.mealName})</strong>.</>
              ) : (
                <>You have no pending lunch dates scheduled.</>
              )}
            </p>
            {nextUpcoming && (
              <button
                onClick={() => onNavigateTab('my-lunches')}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-black text-white font-semibold text-xs hover:bg-zinc-800 cursor-pointer"
              >
                View My Lunches
              </button>
            )}
          </div>
        )}
      </div>

      {/* TOMORROW'S LUNCH PREVIEW & REWARD PROGRESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tomorrow's Lunch Preview */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Coming Up Next
              </span>
              <span className="text-xs font-semibold text-zinc-500">11 AM – 12 PM</span>
            </div>

            <h3 className="text-base font-bold text-zinc-900 mt-2">
              {nextUpcoming ? nextUpcoming.meal.mealName : tomorrowMeal.title}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {nextUpcoming ? `Scheduled for ${nextUpcoming.dateStr}` : 'Fresh chef preparation'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('my-lunches')}
            className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>View Full Lunch Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 20th Day Free Perk / Plan Progress */}
        <div className="bg-zinc-950 text-white rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4C00]">
                Subscriber Milestone
              </span>
              <span className="text-xs font-bold text-zinc-400">
                {totalSubscribed}/20 Lunches
              </span>
            </div>

            <h3 className="text-base font-bold text-white mt-2">
              20th Day Free Lunch Perk
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Subscribers reaching 20 scheduled workdays receive their 20th gourmet lunch food cost free.
            </p>

            {/* Progress bar */}
            <div className="w-full bg-zinc-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-[#FF4C00] h-2 rounded-full transition-all duration-500"
                style={{ width: `${rewardProgress}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('my-plan')}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>Manage My Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* HOME QUICK ACTIONS */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900">Home Quick Actions</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          {/* Action 1: Skip Today's Lunch */}
          <button
            type="button"
            onClick={() => {
              if (todaySelection && !isTodaySkipped) {
                setDateToSkip(todayStr);
              } else {
                onNavigateTab('my-lunches');
              }
            }}
            className="bg-white border border-zinc-200 rounded-2xl p-4 text-left hover:border-zinc-400 transition cursor-pointer shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-zinc-900 block">Skip Today's Lunch</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">Convert into wallet credit</span>
          </button>

          {/* Action 2: View My Lunches */}
          <button
            type="button"
            onClick={() => onNavigateTab('my-lunches')}
            className="bg-white border border-zinc-200 rounded-2xl p-4 text-left hover:border-zinc-400 transition cursor-pointer shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-zinc-900 block">View My Lunches</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">See upcoming calendar schedule</span>
          </button>

          {/* Action 3: Change Delivery Address */}
          <button
            type="button"
            onClick={onOpenAddressModal}
            className="bg-white border border-zinc-200 rounded-2xl p-4 text-left hover:border-zinc-400 transition cursor-pointer shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-zinc-900 block">Change Address</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">Update office desk or floor</span>
          </button>

          {/* Action 4: View My Plan */}
          <button
            type="button"
            onClick={() => onNavigateTab('my-plan')}
            className="bg-white border border-zinc-200 rounded-2xl p-4 text-left hover:border-zinc-400 transition cursor-pointer shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Utensils className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-zinc-900 block">View My Plan</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">Receipt & booked dates</span>
          </button>

          {/* Action 5: Lunch Wallet */}
          <button
            type="button"
            onClick={() => onNavigateTab('lunch-wallet')}
            className="bg-white border border-zinc-200 rounded-2xl p-4 text-left hover:border-zinc-400 transition cursor-pointer shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF4C00] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-zinc-900 block">Lunch Wallet</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">
              {userProfile.creditsBalance || 0} credits available
            </span>
          </button>

          {/* Action 6: WhatsApp Concierge */}
          <a
            href="https://wa.me/2348026180680"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-zinc-200 rounded-2xl p-4 text-left hover:border-zinc-400 transition cursor-pointer shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-zinc-900 block">WhatsApp Concierge</span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">Direct support (08026180680)</span>
          </a>

        </div>
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
                This lunch will be removed from today's delivery schedule. <strong>1 lunch credit</strong> will be instantly credited to your Lunch Wallet.
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
      {selectedMealDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Meal Overview</h3>
              <button
                onClick={() => setSelectedMealDetails(null)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="aspect-video rounded-xl overflow-hidden bg-zinc-100">
                <img
                  src={selectedMealDetails.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'}
                  alt={selectedMealDetails.mealName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#FF4C00]">Category</span>
                <h4 className="text-base font-bold text-zinc-900">{selectedMealDetails.mealName}</h4>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMealDetails(null)}
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
