import React, { useState } from 'react';
import {
  TimeWindow,
  MenuItem,
  UserProfile,
  AdminAnnouncement,
  MealRating,
  SwallowType,
  SelectedLunchDay,
  OrderSummary,
  OrderSubmission,
  calculateOrderSummary,
} from '../types';
import { CheckoutModal } from '../components/marketing/CheckoutModal';
import { InvoiceSlipModal } from '../components/marketing/InvoiceSlipModal';
import { UserDashboardHeader } from '../components/subscriber/UserDashboardHeader';
import { TodayLunchHeroCard, TodayLunchDeliveryState } from '../components/subscriber/TodayLunchHeroCard';
import { PlanProgressBar } from '../components/subscriber/PlanProgressBar';
import { MyLunchesSection, CalendarDayPlan } from '../components/subscriber/MyLunchesSection';
import { MenuExplorerSection } from '../components/subscriber/MenuExplorerSection';
import { PlanAndBillingSection } from '../components/subscriber/PlanAndBillingSection';
import { DeliveryDetailsModal, DeliveryLocation } from '../components/subscriber/DeliveryDetailsModal';
import { UserProfileModal } from '../components/subscriber/UserProfileModal';
import { NotificationsDrawer, NotificationItem } from '../components/subscriber/NotificationsDrawer';
import { HelpSection } from '../components/subscriber/HelpSection';
import { getStructuredMealForDate } from '../data/menuRotation';
import { CONTACT_CONFIG } from '../config/contactConfig';
import {
  CreditRedemptionDayItem,
  CreditRedemptionOrder,
} from '../types';
import {
  MapPin,
  Calendar,
  CreditCard,
  MessageCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Plus,
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
}

export const SubscriberDashboardPage: React.FC<SubscriberDashboardPageProps> = ({
  timeWindow,
  todayMeal,
  tomorrowMeal,
  userProfile,
  announcements,
  ratingsHistory,
  onUpdateProfile,
  onAddRating,
  onNavigateToAdmin,
  onNavigateToLanding,
  isAdminAsUser = false,
  onExitAdminAsUser,
  onAdminAddDays,
  creditRedemptions = [],
  onAddCreditRedemption,
  onMoveCreditDate,
  onTopUpOrderSubmitted,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lunches' | 'menu' | 'billing' | 'help'>('dashboard');

  // Admin as User - days to add control
  const [adminDaysToAdd, setAdminDaysToAdd] = useState<number>(5);

  // Today's Lunch Lifecycle State ('scheduled' | 'on_route' | 'delivered' | 'skipped')
  const [todayDeliveryState, setTodayDeliveryState] = useState<TodayLunchDeliveryState>('scheduled');

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Delivery Locations
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([
    {
      id: 'loc-1',
      name: 'Primary Office Desk',
      building: 'Landmark Towers',
      area: 'Victoria Island',
      floor: 'Floor 4',
      suite: 'Suite 402',
      isDefault: true,
    },
    {
      id: 'loc-2',
      name: 'Ikoyi Co-working Hub',
      building: 'Mulliner Towers',
      area: 'Ikoyi',
      floor: 'Floor 2',
      suite: 'Innovation Lounge',
      isDefault: false,
    },
  ]);

  const defaultLocation = deliveryLocations.find((l) => l.isDefault) || deliveryLocations[0];

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Kitchen Dispatch Notice',
      message: 'Your thermal bowl was sealed at 10:15 AM and dispatched on Victoria Island route.',
      timeAgo: '20 mins ago',
      type: 'delivery',
      isUnread: true,
    },
    {
      id: 'notif-2',
      title: 'Tomorrow’s Chef Special',
      message: 'Chef Justice is cooking Honey Beans + Fried Plantain + Fish tomorrow. Remember to set any dietary notes.',
      timeAgo: 'Yesterday',
      type: 'meal',
      isUnread: true,
    },
    {
      id: 'notif-3',
      title: 'October Menu Released',
      message: '26 new seasonal chef creations are now available to add to your lunch plan.',
      timeAgo: '3 days ago',
      type: 'system',
      isUnread: false,
    },
  ]);

  const unreadNotifCount = notifications.filter((n) => n.isUnread).length;

  // Helper to generate plan map directly from customer's selectedDays
  const generatePlanMapFromProfile = (profile: UserProfile): Record<string, CalendarDayPlan> => {
    const map: Record<string, CalendarDayPlan> = {};
    if (profile.selectedDays && profile.selectedDays.length > 0) {
      profile.selectedDays.forEach((sel) => {
        const parts = sel.dateStr.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);

        let emoji = '🍚';
        if (sel.meal.mealCategory === 'Swallow') emoji = '🍲';
        else if (sel.meal.mealCategory === 'Beans / Moi Moi' || sel.meal.mealCategory === 'Rice & Beans') emoji = '🫘';
        else if (sel.meal.mealCategory === 'Pasta') emoji = '🍝';
        else if (sel.meal.mealCategory === 'Yam' || sel.meal.mealCategory === 'Plantain') emoji = '🍠';

        map[sel.dateStr] = {
          dateStr: sel.dateStr,
          dayNum: d,
          dayName: (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()] || 'Mon') as any,
          fullDateFormatted: dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          dishTitle: sel.meal.mealName,
          emoji,
          ingredients: sel.meal.ingredients || [],
          isSwallow: sel.meal.mealCategory === 'Swallow',
          selectedSwallow: sel.selectedSwallow,
          status: 'selected',
        };
      });
    }
    return map;
  };

  // Calendar Plan Data (Starts dynamically from userProfile.selectedDays, or clean empty)
  const [daysPlanMap, setDaysPlanMap] = useState<Record<string, CalendarDayPlan>>(() =>
    generatePlanMapFromProfile(userProfile)
  );

  // Synchronize when customer profile or selectedDays changes
  React.useEffect(() => {
    if (userProfile.selectedDays && userProfile.selectedDays.length > 0) {
      setDaysPlanMap(generatePlanMapFromProfile(userProfile));
    }
  }, [userProfile.selectedDays]);

  // Calculate selected count
  const selectedDaysList = (Object.values(daysPlanMap) as CalendarDayPlan[]).filter((d) => d.status === 'selected');
  const selectedCount = selectedDaysList.length;
  const totalSubscribed = userProfile.totalSubscribedDays || 20;

  // Admin as User: Add Days to Plan
  const handleExecuteAdminAddDays = () => {
    const daysToAdd = Math.max(1, adminDaysToAdd || 1);
    const newTotal = totalSubscribed + daysToAdd;

    // Find and activate next unselected workdays into the user's plan
    let countToActivate = daysToAdd;
    const newDaysMap = { ...daysPlanMap };
    const baseDate = new Date(2026, 9, 23); // starting from Friday Oct 23 onwards

    for (let i = 0; i < 60 && countToActivate > 0; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dayOfWeek = d.getDay();
      // Monday to Friday
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateStr = d.toISOString().split('T')[0];
        if (!newDaysMap[dateStr] || newDaysMap[dateStr].status !== 'selected') {
          const meal = getStructuredMealForDate(d);
          newDaysMap[dateStr] = {
            dateStr,
            dayNum: d.getDate(),
            dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek] as any,
            fullDateFormatted: d.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            dishTitle: meal.mealName,
            emoji: meal.mealCategory === 'Swallow' ? '🥣' : '🍲',
            ingredients: meal.ingredients || [meal.mealName],
            isSwallow: meal.mealCategory === 'Swallow',
            selectedSwallow: meal.mealCategory === 'Swallow' ? 'Semo' : undefined,
            status: 'selected',
          };
          countToActivate--;
        }
      }
    }

    setDaysPlanMap(newDaysMap);
    onUpdateProfile({
      ...userProfile,
      totalSubscribedDays: newTotal,
    });
    if (onAdminAddDays) {
      onAdminAddDays(daysToAdd);
    }
    showToast(`✓ Updated! Added ${daysToAdd} meal days for ${userProfile.name}. Total: ${newTotal} days.`);
  };

  // Handlers for plan manipulation
  const handleToggleDaySelection = (dateStr: string) => {
    setDaysPlanMap((prev) => {
      const existing = prev[dateStr];
      if (existing && existing.status === 'selected') {
        showToast('Removed lunch from plan.');
        return { ...prev, [dateStr]: { ...existing, status: 'unselected' } };
      } else if (existing) {
        showToast('Added lunch to your plan! ✓');
        return { ...prev, [dateStr]: { ...existing, status: 'selected' } };
      }
      return prev;
    });
  };

  const handleToggleSkipDay = (dateStr: string) => {
    setDaysPlanMap((prev) => {
      const existing = prev[dateStr];
      if (!existing) return prev;
      if (existing.status === 'skipped') {
        onUpdateProfile({
          ...userProfile,
          creditsBalance: Math.max(0, userProfile.creditsBalance - 1),
        });
        showToast('Restored lunch to plan.');
        return { ...prev, [dateStr]: { ...existing, status: 'selected' } };
      } else {
        // Increase credit
        onUpdateProfile({ ...userProfile, creditsBalance: userProfile.creditsBalance + 1 });
        showToast('Lunch skipped! +1 credit preserved in your wallet.');
        return { ...prev, [dateStr]: { ...existing, status: 'skipped' } };
      }
    });
  };

  const handleSelectSwallow = (dateStr: string, swallow: SwallowType) => {
    setDaysPlanMap((prev) => {
      const existing = prev[dateStr];
      if (!existing) return prev;
      showToast(`Swallow updated to ${swallow}`);
      return { ...prev, [dateStr]: { ...existing, selectedSwallow: swallow } };
    });
  };

  // Skip today's lunch action
  const handleSkipToday = () => {
    setTodayDeliveryState('skipped');
    onUpdateProfile({ ...userProfile, creditsBalance: userProfile.creditsBalance + 1 });
    showToast('Today’s lunch skipped. Your lunch credit is preserved 100%.');
  };

  // Undo skip action
  const handleUndoSkip = () => {
    setTodayDeliveryState('scheduled');
    onUpdateProfile({
      ...userProfile,
      creditsBalance: Math.max(0, userProfile.creditsBalance - 1),
    });
    showToast('Lunch restored! The kitchen will prepare and deliver your meal today.');
  };

  // Dynamic count of skipped lunches
  const dynamicSkippedCount =
    (Object.values(daysPlanMap) as CalendarDayPlan[]).filter((d) => d.status === 'skipped').length +
    (todayDeliveryState === 'skipped' ? 1 : 0);

  // Credit usage confirmation handler
  const handleConfirmCreditUsage = (items: CreditRedemptionDayItem[], totalCredits: number) => {
    const newCreditOrder: CreditRedemptionOrder = {
      id: `CRED-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: userProfile.id,
      userName: userProfile.name,
      userPhone: userProfile.phone || CONTACT_CONFIG.whatsappDisplay,
      company: userProfile.company,
      officeAddress: `${defaultLocation.building}, ${defaultLocation.floor}, ${defaultLocation.suite}`,
      totalCreditsUsed: totalCredits,
      items,
      submittedAt: new Date().toISOString(),
      status: 'Pending Verification',
    };

    onUpdateProfile({
      ...userProfile,
      creditsBalance: Math.max(0, userProfile.creditsBalance - totalCredits),
    });

    if (onAddCreditRedemption) {
      onAddCreditRedemption(newCreditOrder);
    }

    showToast(`✓ Extra plate request submitted for ${totalCredits} credit${totalCredits > 1 ? 's' : ''}! Pending kitchen confirmation.`);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins'] pb-28 md:pb-16 antialiased selection:bg-[#FF4C00] selection:text-white">
      
      {/* Sticky Admin as User Control Bar */}
      {isAdminAsUser && (
        <div className="bg-zinc-950 text-white px-4 sm:px-6 py-3 border-b border-zinc-800 sticky top-0 z-50 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-left">
              <span className="px-2.5 py-1 rounded-full bg-[#FF4C00] text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin as User</span>
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-white">{userProfile.name}</span>
                  <span className="text-xs text-zinc-400">({userProfile.company || 'Desk Drop Client'})</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Viewing dashboard exactly as user sees it • Plan: <strong className="text-white">{totalSubscribed} Days</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-700/80 px-3 py-1.5 rounded-2xl">
                <span className="text-xs font-bold text-zinc-300">Add Days:</span>
                <div className="flex items-center space-x-1">
                  {[1, 5, 10, 20].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAdminDaysToAdd(d)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        adminDaysToAdd === d
                          ? 'bg-[#FF4C00] text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      +{d}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={adminDaysToAdd}
                  onChange={(e) => setAdminDaysToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 px-2 py-1 rounded-lg bg-zinc-800 text-white font-bold text-xs text-center border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={handleExecuteAdminAddDays}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition cursor-pointer shadow-xs flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </div>

              {onExitAdminAsUser && (
                <button
                  type="button"
                  onClick={onExitAdminAsUser}
                  className="px-4 py-1.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 border border-zinc-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Customers</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 bg-black text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <UserDashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={userProfile.name || 'Subscriber'}
        unreadCount={unreadNotifCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenDeliveryDetails={() => setIsDeliveryModalOpen(true)}
        onSwitchToAdmin={onNavigateToAdmin || (() => {})}
        onSwitchToLanding={onNavigateToLanding || (() => {})}
        onLogOut={onNavigateToLanding || (() => {})}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ============================================================== */}
        {/* TAB 1: DASHBOARD (HOME LUNCH CONTROL CENTER) */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Greeting & Headline */}
            <div className="text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider block">
                  Lunch Control Center
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight mt-0.5">
                  Good morning, {userProfile.name ? userProfile.name.split(' ')[0] : 'Subscriber'} 👋
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                  Here's your lunch at a glance. Delivered directly to your desk before 12:00 PM.
                </p>
              </div>

              {/* Desk Drop Live Badge */}
              <div className="flex items-center space-x-2 bg-white border border-zinc-200 px-4 py-2 rounded-2xl shadow-xs self-start sm:self-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-black">Desk Drop Active: {defaultLocation.building}</span>
              </div>
            </div>

            {/* The 3 Glance Cards (As specified in prompt) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              
              {/* Card 1: TODAY */}
              <div className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                    Today
                  </span>
                  <p className="text-base font-black text-black leading-snug">
                    {todayMeal.title ? 'Jollof Rice + Grilled Chicken' : 'Party Jollof Rice'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-150 flex items-center space-x-1.5 text-xs font-bold text-[#FF4C00]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {todayDeliveryState === 'skipped'
                      ? 'Skipped Today'
                      : todayDeliveryState === 'delivered'
                      ? '✓ Delivered (11:34 AM)'
                      : todayDeliveryState === 'on_route'
                      ? '🚚 On The Way'
                      : '🚚 Arrives 11–12'}
                  </span>
                </div>
              </div>

              {/* Card 2: YOUR PLAN */}
              <div className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                    Your Plan
                  </span>
                  <p className="text-base font-black text-black leading-snug">
                    Desk Drop (20 Lunches)
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Oct 5 – Mar 30
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-150 flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>● Active Desk Subscription</span>
                </div>
              </div>

              {/* Card 3: LUNCHES LEFT */}
              <div className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                    Lunches Left
                  </span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-black text-black">{selectedCount}</span>
                    <span className="text-xs font-bold text-zinc-500">of {totalSubscribed} selected</span>
                  </div>
                  <p className="text-xs text-[#FF4C00] font-semibold mt-0.5">
                    {Math.max(0, totalSubscribed - selectedCount)} remaining to pick
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-150">
                  <button
                    onClick={() => setActiveTab('lunches')}
                    className="text-xs font-bold text-black hover:text-[#FF4C00] flex items-center space-x-1 cursor-pointer transition"
                  >
                    <span>View plan →</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Layout: Main Hero Column + Side Progress & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left 2 Cols: Today's Lunch Hero */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* 1. TODAY'S LUNCH HERO CARD */}
                <TodayLunchHeroCard
                  dateFormatted="MON, OCT 5"
                  mealTitle="Jollof Rice + Spiced Grilled Chicken"
                  ingredients={[
                    'Smoky firewood long-grain Jollof',
                    'Spiced grilled chicken',
                    'Fried sweet dodo',
                    'Crunchy Lagos coleslaw',
                  ]}
                  deliveryAddress={`${defaultLocation.building}, ${defaultLocation.floor}, ${defaultLocation.suite}`}
                  deliveryWindow="11:00 AM – 12:00 PM"
                  status={todayDeliveryState}
                  onSkipToday={handleSkipToday}
                  onUndoSkip={handleUndoSkip}
                  onStatusChange={setTodayDeliveryState}
                />

              </div>

              {/* Right Col: Plan Progress Bar & Quick Actions */}
              <div className="space-y-6">
                
                {/* 1. PLAN PROGRESS COMPONENT */}
                <PlanProgressBar
                  selectedCount={selectedCount}
                  targetCap={totalSubscribed}
                  onAddMoreLunches={() => setActiveTab('lunches')}
                  onViewPlan={() => setActiveTab('billing')}
                />

                {/* 2. QUICK ACTIONS CARD (As specified in prompt) */}
                <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs font-['Poppins'] text-left space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                    Quick Controls
                  </span>
                  <h3 className="text-base font-black text-black">
                    Desk Drop Actions
                  </h3>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => setIsDeliveryModalOpen(true)}
                      className="w-full p-3 rounded-2xl bg-[#FAF7F2] hover:bg-zinc-100 text-xs font-bold text-zinc-800 flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <MapPin className="w-4 h-4 text-[#FF4C00]" />
                        <span>Change Delivery Address</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('lunches')}
                      className="w-full p-3 rounded-2xl bg-[#FAF7F2] hover:bg-zinc-100 text-xs font-bold text-zinc-800 flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Calendar className="w-4 h-4 text-[#FF4C00]" />
                        <span>Manage Lunch Days</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('billing')}
                      className="w-full p-3 rounded-2xl bg-[#FAF7F2] hover:bg-zinc-100 text-xs font-bold text-zinc-800 flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <CreditCard className="w-4 h-4 text-[#FF4C00]" />
                        <span>Plan & Billing Receipt</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    <a
                      href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
                        'Hello 11to12 Team, I have a question about my desk drop lunch'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-900 flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>WhatsApp Concierge</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                  </div>
                </div>

                {/* 3. CREDITS MINI WALLET */}
                <div className="p-5 rounded-3xl bg-orange-50/50 border border-orange-200/80 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-600">Credits Wallet</span>
                    <Sparkles className="w-4 h-4 text-[#FF4C00]" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-black">
                      {userProfile.creditsBalance} Credits
                    </span>
                    <span className="text-xs font-bold text-[#FF4C00]">
                      (₦{(userProfile.creditsBalance * 4500).toLocaleString()})
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Whenever you skip lunch, your credit is saved here. Use it anytime for an extra plate for colleagues or rollovers.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MY LUNCHES (PLANNER & CALENDAR) */}
        {/* ============================================================== */}
        {activeTab === 'lunches' && (
          <div className="animate-in fade-in duration-200">
            <MyLunchesSection
              daysMap={daysPlanMap}
              onToggleDaySelection={handleToggleDaySelection}
              onToggleSkipDay={handleToggleSkipDay}
              onSelectSwallow={handleSelectSwallow}
              totalSubscribed={totalSubscribed}
              creditsCount={userProfile.creditsBalance}
              isAfter12PM={todayDeliveryState === 'delivered'}
              skipCount={dynamicSkippedCount}
              maxSkips={4}
              todayDateStr="2026-10-05"
              onConfirmCreditUsage={handleConfirmCreditUsage}
              pendingCreditRedemptions={creditRedemptions.filter((r) => r.userId === userProfile.id)}
              onMoveCreditDate={onMoveCreditDate}
              userProfile={userProfile}
              onTopUpOrderSubmitted={onTopUpOrderSubmitted}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: MENU EXPLORER */}
        {/* ============================================================== */}
        {activeTab === 'menu' && (
          <div className="animate-in fade-in duration-200">
            <MenuExplorerSection
              onAddMealToPlan={handleToggleDaySelection}
              selectedDateStrings={selectedDaysList.map((d) => d.dateStr)}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PLAN & BILLING */}
        {/* ============================================================== */}
        {activeTab === 'billing' && (
          <div className="animate-in fade-in duration-200">
            <PlanAndBillingSection
              planName={userProfile.planName || `Desk Drop (${totalSubscribed} Lunches)`}
              status="Active"
              startDate="Oct 5, 2026"
              endDate="Mar 30, 2027"
              totalLunches={totalSubscribed}
              selectedLunches={selectedCount}
              completedLunches={4}
              upcomingLunches={Math.max(0, selectedCount - 4)}
              skippedLunches={dynamicSkippedCount}
              creditsBalance={userProfile.creditsBalance}
              onUseCreditExtraPlate={() => {
                onUpdateProfile({
                  ...userProfile,
                  creditsBalance: Math.max(0, userProfile.creditsBalance - 1),
                });
                showToast('1 credit used! An extra plate will be dropped with tomorrow’s lunch.');
              }}
              onAddMoreLunches={() => setActiveTab('lunches')}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: HELP & SUPPORT */}
        {/* ============================================================== */}
        {activeTab === 'help' && (
          <div className="animate-in fade-in duration-200">
            <HelpSection />
          </div>
        )}

      </main>

      {/* Slide-over Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
          showToast('All notifications marked as read.');
        }}
      />

      {/* Delivery Addresses Modal */}
      <DeliveryDetailsModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        locations={deliveryLocations}
        pendingAddressChange={userProfile.pendingAddressChange}
        onScheduleDefaultLocation={(loc) => {
          const effectiveDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          const formattedEffective = effectiveDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });
          onUpdateProfile({
            ...userProfile,
            pendingAddressChange: {
              newLocation: `${loc.building} (${loc.floor}, ${loc.suite})`,
              effectiveAt: formattedEffective,
              requestedAt: 'Just now',
            },
          });
          showToast(`Address change requested. Takes effect in 24 hours (${formattedEffective}).`);
        }}
        onCancelPendingChange={() => {
          onUpdateProfile({
            ...userProfile,
            pendingAddressChange: undefined,
          });
          showToast('Pending address change cancelled. Deliveries continue at original desk.');
        }}
        onSetDefaultLocation={(id) => {
          setDeliveryLocations((prev) =>
            prev.map((l) => ({ ...l, isDefault: l.id === id }))
          );
          showToast('Default delivery desk updated.');
        }}
        onSaveLocation={(newLoc) => {
          setDeliveryLocations((prev) => [...prev, newLoc]);
          showToast(`Added ${newLoc.building} to delivery addresses.`);
        }}
      />

      {/* User Profile & Preferences Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={(updated) => {
          onUpdateProfile(updated);
          showToast('Profile and preferences updated.');
        }}
      />

    </div>
  );
};
