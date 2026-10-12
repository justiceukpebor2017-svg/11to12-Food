import React, { useState, useRef, useEffect } from 'react';
import {
  TimeWindow,
  MenuItem,
  UserProfile,
  AdminAnnouncement,
  MealRating,
  SwallowType,
  OrderSubmission,
  CreditRedemptionOrder,
} from '../types';
import { CustomerHomeTab, CustomerTabType } from '../components/subscriber/tabs/CustomerHomeTab';
import { CustomerMyLunchesTab } from '../components/subscriber/tabs/CustomerMyLunchesTab';
import { CustomerMyPlanTab } from '../components/subscriber/tabs/CustomerMyPlanTab';
import { CustomerWalletTab } from '../components/subscriber/tabs/CustomerWalletTab';
import { CustomerAccountTab } from '../components/subscriber/tabs/CustomerAccountTab';
import { AddExtraDaysModal } from '../components/subscriber/tabs/AddExtraDaysModal';
import { checkWatCutoffStatus } from '../utils/timeCutoff';
import {
  Home,
  CalendarDays,
  Utensils,
  Wallet,
  User,
  LogOut,
  MapPin,
  CheckCircle2,
  Bell,
  MessageCircle,
  X,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface SubscriberDashboardPageProps {
  timeWindow: TimeWindow;
  todayMeal: MenuItem;
  tomorrowMeal: MenuItem;
  userProfile: UserProfile;
  announcements: AdminAnnouncement[];
  ratingsHistory: MealRating[];
  onUpdateProfile: (updated: UserProfile) => void;
  onAddRating: (rating: MealRating) => void;
  onNavigateToAdmin?: () => void;
  onNavigateToLanding?: () => void;
  isAdminAsUser?: boolean;
  onExitAdminAsUser?: () => void;
  onAdminAddDays?: (daysToAdd: number) => void;
  creditRedemptions?: CreditRedemptionOrder[];
  onAddCreditRedemption?: (order: CreditRedemptionOrder) => void;
  onMoveCreditDate?: (redemptionId: string, oldDateStr: string, newDateStr: string, newSwallow?: SwallowType) => void;
  onTopUpOrderSubmitted?: (order: OrderSubmission) => void;
  onChangePassword?: (newPassword: string) => void;
  submittedOrders?: OrderSubmission[];
}

export const SubscriberDashboardPage: React.FC<SubscriberDashboardPageProps> = ({
  todayMeal,
  tomorrowMeal,
  userProfile,
  onUpdateProfile,
  onNavigateToLanding,
  isAdminAsUser = false,
  onExitAdminAsUser,
  creditRedemptions = [],
  onAddCreditRedemption,
  onTopUpOrderSubmitted,
  onChangePassword,
  submittedOrders = [],
}) => {
  const [activeTab, setActiveTab] = useState<CustomerTabType>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddDaysModalOpen, setIsAddDaysModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editPrimaryAddress, setEditPrimaryAddress] = useState(userProfile.address || '');
  const [editSecondAddress, setEditSecondAddress] = useState(userProfile.secondAddress || '');

  useEffect(() => {
    setEditPrimaryAddress(userProfile.address || '');
    setEditSecondAddress(userProfile.secondAddress || '');
  }, [userProfile.address, userProfile.secondAddress]);

  // Live Notification state
  const [liveNotification, setLiveNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'skip' | 'topup' | 'credit' | 'info';
  } | null>(null);
  const notifTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, []);

  const showLiveNotification = (title: string, message: string, type: 'skip' | 'topup' | 'credit' | 'info' = 'info') => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setLiveNotification({
      id: String(Date.now()),
      title,
      message,
      type,
    });
    notifTimerRef.current = window.setTimeout(() => {
      setLiveNotification(null);
    }, 6000);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Safe manual logout with auto-save
  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    // Explicit manual save pulse
    onUpdateProfile(userProfile);
    setTimeout(() => {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      if (onNavigateToLanding) {
        onNavigateToLanding();
      }
    }, 450);
  };

  // Skip Lunch Flow:
  // 1. Checks 12:00 PM - 5:00 PM WAT daily cutoff rule
  // 2. Disallows skipping on any date that has already been skipped or already used credit on
  // 3. Adds date to skippedDates and increments creditsBalance
  // 4. Updates userProfile which propagates to customer record and syncs with Admin every 5 seconds
  // 5. Triggers live notification letting user know what they did and that dashboard has updated!
  const handleSkipLunch = (dateStr: string) => {
    // Cutoff check: 12:00 PM to 5:00 PM WAT
    const cutoffStatus = checkWatCutoffStatus();
    if (!cutoffStatus.isActionAllowed) {
      showToast(cutoffStatus.reason);
      return;
    }

    const existingSkips = userProfile.skippedDates || [];
    if (existingSkips.includes(dateStr)) {
      showToast('This lunch is already marked as skipped. Skipping cannot be repeated on the same date.');
      return;
    }

    const creditedDates = new Set<string>([
      ...(userProfile.creditUsedDates || []),
      ...(userProfile.creditRedemptions || []).flatMap((r) => (r.items || []).map((it) => it.dateStr)),
    ]);

    if (creditedDates.has(dateStr)) {
      showToast(`Cannot skip ${dateStr}. A credit plate has already been scheduled for this date.`);
      return;
    }

    const updatedSkips = [...existingSkips, dateStr];
    const newCredits = (userProfile.creditsBalance || 0) + 1;

    const updatedProfile: UserProfile = {
      ...userProfile,
      skippedDates: updatedSkips,
      creditsBalance: newCredits,
    };

    onUpdateProfile(updatedProfile);
    showLiveNotification(
      '⚡ Lunch Skipped & Credit Preserved',
      `Meal for ${dateStr} has been cancelled from kitchen cooking. 1 credit has been added to your Lunch Wallet, and your upcoming lunch dashboard has been updated.`,
      'skip'
    );
  };

  // Save quick address update
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      address: editPrimaryAddress.trim(),
      secondAddress: editSecondAddress.trim() || undefined,
    });
    setIsAddressModalOpen(false);
    showToast('✓ Delivery addresses updated.');
  };

  const navItems = [
    { id: 'home' as CustomerTabType, label: 'Home', icon: Home },
    { id: 'my-lunches' as CustomerTabType, label: 'My Lunches', icon: CalendarDays },
    { id: 'my-plan' as CustomerTabType, label: 'My Plan', icon: Utensils },
    { id: 'lunch-wallet' as CustomerTabType, label: 'Lunch Wallet', icon: Wallet },
    { id: 'account' as CustomerTabType, label: 'Account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins'] flex flex-col antialiased selection:bg-[#FF4C00] selection:text-white pb-20 md:pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-black text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin as User Banner (if applicable) */}
      {isAdminAsUser && (
        <div className="bg-zinc-950 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full bg-[#FF4C00] text-white font-bold text-[10px] uppercase">
              Admin Preview
            </span>
            <span>Viewing as {userProfile.name}</span>
          </div>
          {onExitAdminAsUser && (
            <button
              onClick={onExitAdminAsUser}
              className="text-xs font-bold text-[#FF4C00] hover:underline cursor-pointer"
            >
              Exit Preview
            </button>
          )}
        </div>
      )}

      {/* Real-time Live Action Notification Banner */}
      {liveNotification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-xl rounded-2xl sm:rounded-3xl bg-zinc-950/95 text-white border border-[#FF4C00]/40 shadow-2xl p-4 sm:p-5 backdrop-blur-md animate-in fade-in slide-in-from-top-3 flex items-start gap-3.5 font-['Poppins']"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#FF4C00] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FF4C00]/25">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center space-x-1.5 flex-wrap">
                <span>{liveNotification.title}</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Dashboard Live
                </span>
              </h4>

              <button
                type="button"
                onClick={() => setLiveNotification(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              {liveNotification.message}
            </p>
          </div>
        </aside>
      )}

      {/* Main Top Header */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <img
              src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
              alt="11 to 12"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-zinc-900 block leading-tight">11 to 12 Desk Drop</span>
              <span className="text-[10px] font-semibold text-[#FF4C00] uppercase tracking-wider">
                Lunch Control Center
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-zinc-100/80 p-1 rounded-2xl border border-zinc-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-xs font-bold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Top Header Actions - Exactly 1 Single Logout Button */}
          <div className="flex items-center space-x-2">
            <a
              href="https://wa.me/2348026180680"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition"
              title="WhatsApp Concierge"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Concierge</span>
            </a>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-red-200 bg-zinc-50 hover:bg-red-50 text-zinc-700 hover:text-red-600 text-xs font-bold transition cursor-pointer shadow-2xs group"
              title="Log Out of Dashboard"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-600 transition-colors" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
        
        {/* Tab 1: Home */}
        {activeTab === 'home' && (
          <CustomerHomeTab
            userProfile={userProfile}
            todayMeal={todayMeal}
            tomorrowMeal={tomorrowMeal}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSkipLunch={handleSkipLunch}
            onOpenAddressModal={() => setIsAddressModalOpen(true)}
          />
        )}

        {/* Tab 2: My Lunches (with interleaved credit meals) */}
        {activeTab === 'my-lunches' && (
          <CustomerMyLunchesTab
            userProfile={userProfile}
            onSkipLunch={handleSkipLunch}
            onOpenAddDaysModal={() => setIsAddDaysModalOpen(true)}
            creditRedemptions={creditRedemptions}
          />
        )}

        {/* Tab 3: My Plan */}
        {activeTab === 'my-plan' && (
          <CustomerMyPlanTab
            userProfile={userProfile}
            onOpenAddDaysModal={() => setIsAddDaysModalOpen(true)}
            onOpenAddressModal={() => setIsAddressModalOpen(true)}
          />
        )}

        {/* Tab 4: Lunch Wallet */}
        {activeTab === 'lunch-wallet' && (
          <CustomerWalletTab
            userProfile={userProfile}
            onAddCreditRedemption={(order) => {
              if (onAddCreditRedemption) onAddCreditRedemption(order);
              const targetDate = order.items?.[0]?.dateStr || 'selected date';
              showLiveNotification(
                '⚡ 1 Credit Redeemed',
                `Extra meal on ${targetDate} scheduled! It now appears on your schedule under ${targetDate} in My Lunches.`,
                'credit'
              );
            }}
            onUpdateProfile={onUpdateProfile}
          />
        )}

        {/* Tab 5: Account */}
        {activeTab === 'account' && (
          <CustomerAccountTab
            userProfile={userProfile}
            onUpdateProfile={onUpdateProfile}
            onChangePassword={onChangePassword}
            onLogout={() => setIsLogoutModalOpen(true)}
          />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200/90 py-2 px-3 z-40 shadow-lg flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 transition cursor-pointer ${
                isActive ? 'text-[#FF4C00] font-bold' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Add Extra Days Modal */}
      {isAddDaysModalOpen && (
        <AddExtraDaysModal
          isOpen={isAddDaysModalOpen}
          onClose={() => setIsAddDaysModalOpen(false)}
          userProfile={userProfile}
          pendingConfirmationOrders={submittedOrders}
          onSubmitTopUpOrder={(order) => {
            if (onTopUpOrderSubmitted) {
              onTopUpOrderSubmitted(order);
            }
            showLiveNotification(
              '⚡ Top-Up Order Submitted',
              `Top-Up order for +${order.totalDays} workdays submitted! Once verified by kitchen operations, your dates will be locked on your active schedule.`,
              'topup'
            );
          }}
        />
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins'] animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900">
                Log Out of Your Dashboard?
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                All your preferences, skipped meals, wallet credits, and calendar selections are automatically and safely saved.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center space-x-2.5">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Save & Log Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#FF4C00]" />
                <h3 className="text-base font-bold text-zinc-900">Update Delivery Address</h3>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Primary Delivery Address & Floor:
                </label>
                <input
                  type="text"
                  required
                  value={editPrimaryAddress}
                  onChange={(e) => setEditPrimaryAddress(e.target.value)}
                  placeholder="e.g. Landmark Towers, Floor 4, Suite 402"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Second Delivery Address <span className="text-zinc-400 font-normal">(Optional backup desk):</span>
                </label>
                <input
                  type="text"
                  value={editSecondAddress}
                  onChange={(e) => setEditSecondAddress(e.target.value)}
                  placeholder="e.g. Alternate floor or reception"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer shadow-xs"
                >
                  Save Addresses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
