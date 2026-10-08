import React, { useState } from 'react';
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

  // Address edit state inside quick address modal
  const [editPrimaryAddress, setEditPrimaryAddress] = useState(userProfile.address || '');
  const [editSecondAddress, setEditSecondAddress] = useState(userProfile.secondAddress || '');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Skip Lunch Flow:
  // 1. Adds date to skippedDates
  // 2. Increments creditsBalance by 1
  // 3. Updates userProfile which propagates to customer record and syncs with Admin
  const handleSkipLunch = (dateStr: string) => {
    const existingSkips = userProfile.skippedDates || [];
    if (existingSkips.includes(dateStr)) {
      showToast('This lunch is already marked as skipped.');
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
    showToast(`✓ Lunch for ${dateStr} skipped. 1 credit added to your Lunch Wallet.`);
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

          {/* Right Top Header Actions */}
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
              onClick={onNavigateToLanding}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
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

        {/* Tab 2: My Lunches */}
        {activeTab === 'my-lunches' && (
          <CustomerMyLunchesTab
            userProfile={userProfile}
            onSkipLunch={handleSkipLunch}
            onOpenAddDaysModal={() => setIsAddDaysModalOpen(true)}
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
            onAddCreditRedemption={onAddCreditRedemption}
            onUpdateProfile={onUpdateProfile}
          />
        )}

        {/* Tab 5: Account */}
        {activeTab === 'account' && (
          <CustomerAccountTab
            userProfile={userProfile}
            onUpdateProfile={onUpdateProfile}
            onChangePassword={onChangePassword}
            onLogout={onNavigateToLanding || (() => {})}
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
          }}
        />
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
