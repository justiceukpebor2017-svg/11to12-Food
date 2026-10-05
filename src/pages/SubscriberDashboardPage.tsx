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
  Play,
  Pause,
  Video,
  X,
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
  onChangePassword,
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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [activeVideoChapter, setActiveVideoChapter] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isTrialUser = Boolean(
    userProfile.isTrial ||
    userProfile.planName?.toLowerCase().includes('trial') ||
    userProfile.totalSubscribedDays === 5
  );

  const isPaymentPending = !isAdminAsUser && (userProfile.paymentStatus === 'Pending Verification' || userProfile.subscriptionStatus === 'Pending Activation' || userProfile.paymentStatus !== 'Paid');
  const [showPasswordChangeBox, setShowPasswordChangeBox] = useState(false);
  const [tempPass, setTempPass] = useState('');
  const [tempPassConfirm, setTempPassConfirm] = useState('');

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
      title: 'Tomorrow’s Lunch Special',
      message: 'The 11 to 12 Culinary Team is cooking Honey Beans + Fried Plantain + Fish tomorrow. Remember to set any dietary notes.',
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

      {/* PENDING PAYMENT CONFIRMATION SCREEN */}
      {isPaymentPending ? (
        <div className="min-h-screen bg-[#FAF7F2] font-['Poppins'] flex flex-col justify-between">
          {/* Minimal Header */}
          <header className="bg-white border-b border-zinc-200 px-4 sm:px-8 py-4 shadow-2xs">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                  alt="11 to 12"
                  className="h-9 w-auto object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://i.ibb.co/mV0z77Mb/11to12logg.png';
                  }}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  Verification Pending
                </span>
              </div>

              {/* The Only Action Button: Log Out */}
              <button
                type="button"
                onClick={onNavigateToLanding}
                className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-xs active:scale-95"
              >
                <span>Log Out</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Centered Notification Card */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-xl p-6 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-[#FF4C00] shadow-xs">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-black uppercase tracking-wider border border-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4C00]" />
                  <span>Account Reserved</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                  Wait, Admin is Confirming Payment
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-md mx-auto">
                  Your lunch plan reservation has been received. The 11 to 12 admin team is currently verifying your payment receipt in the kitchen system.
                </p>
              </div>

              {/* Summary Details Box */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">Subscriber Name:</span>
                  <span className="font-bold text-zinc-900">{userProfile.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">Workplace / Desk:</span>
                  <span className="font-bold text-zinc-900 truncate max-w-[200px]">
                    {userProfile.address || userProfile.company || 'Corporate Office'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">Lunch Plan:</span>
                  <span className="font-bold text-[#FF4C00]">{userProfile.planName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Payment Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                    ● Awaiting Admin Confirmation
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 text-xs text-left leading-relaxed">
                <span className="font-bold">Next Steps:</span> Once admin confirms your payment and adds you to the customer section, you can refresh this page or log back in with your credentials to access your dashboard and active meals.
              </div>

              {/* Optional Change Password toggle for convenience */}
              <div className="pt-1 text-left">
                {!showPasswordChangeBox ? (
                  <button
                    type="button"
                    onClick={() => setShowPasswordChangeBox(true)}
                    className="text-xs font-bold text-[#FF4C00] hover:underline cursor-pointer"
                  >
                    Want to set or update your password now? →
                  </button>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (tempPass.length < 6) {
                        showToast('Password must be at least 6 characters.');
                        return;
                      }
                      if (tempPass !== tempPassConfirm) {
                        showToast('Passwords do not match.');
                        return;
                      }
                      if (onChangePassword) {
                        onChangePassword(tempPass);
                        showToast('✓ Permanent password updated successfully!');
                        setShowPasswordChangeBox(false);
                      }
                    }}
                    className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3"
                  >
                    <div className="font-bold text-xs text-zinc-800">Set Permanent Dashboard Password</div>
                    <div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="New password (6+ chars)"
                        value={tempPass}
                        onChange={(e) => setTempPass(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Confirm new password"
                        value={tempPassConfirm}
                        onChange={(e) => setTempPassConfirm(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Save Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordChangeBox(false)}
                        className="px-3 py-1.5 bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Action Buttons: Log Out & Refresh */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={onNavigateToLanding}
                  className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md active:scale-98"
                >
                  Log Out
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full py-3.5 px-6 rounded-2xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-2xs active:scale-98"
                >
                  Refresh Payment Status
                </button>
              </div>

            </div>
          </div>

          <footer className="text-center py-4 text-xs text-zinc-400">
            11 to 12 Corporate Office Meals • Victoria Island & Ikoyi Lagos
          </footer>
        </div>
      ) : (
        <>
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

              {/* Desk Drop Live Badge & Video Guide Quick Link */}
              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsVideoModalOpen(true);
                    setIsPlayingVideo(true);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-[#FF4C00] text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                  title="Watch 60-second video on how to use your lunch dashboard"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>How to Use Dashboard (Video)</span>
                </button>
                <div className="flex items-center space-x-2 bg-white border border-zinc-200 px-3.5 py-2 rounded-2xl shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-black">Desk Drop Active: {defaultLocation.building}</span>
                </div>
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
                    {isTrialUser ? '5-Day Trial Plan' : `Desk Drop (${totalSubscribed} Lunches)`}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isTrialUser ? '5 Office Trial Days' : 'Oct 5 – Mar 30'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-150 flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>● {isTrialUser ? 'Active Trial Mode' : 'Active Desk Subscription'}</span>
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

            {/* TRIAL PLAN NOTIFICATION BANNER (Skipping & Unskipping Trial Meals) */}
            {isTrialUser && (
              <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-amber-100 text-[#FF4C00] rounded-2xl shrink-0 mt-0.5 border border-amber-200">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                        5-Day Trial Plan • Skipping & Unskipping Enabled
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        Preserve 100% Credits
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      You have full flexibility during your trial! If you have offsite meetings or work from home, skip any trial day to preserve your credits for later, or unskip anytime before the daily 12:00 PM cutoff.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('lunches')}
                    className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-[#FF4C00] text-white font-bold text-xs cursor-pointer transition shadow-xs flex items-center space-x-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#FF4C00]" />
                    <span>Manage Trial Days</span>
                  </button>
                </div>
              </div>
            )}

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

                {/* 4. "HOW TO USE THE DASHBOARD" VIDEO PLACEHOLDER CARD */}
                <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-xs text-left space-y-3 overflow-hidden relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] bg-[#FF4C00]/10 border border-[#FF4C00]/20 px-2.5 py-0.5 rounded-full">
                      Video Walkthrough
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>1:15 min</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-black leading-snug">
                      How to Use Your Lunch Dashboard
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                      Watch this 60-second video anytime to master picking meals, skipping/unskipping trial or monthly days, and live desk delivery.
                    </p>
                  </div>

                  {/* Video Thumbnail with Interactive Play Button */}
                  <div
                    onClick={() => {
                      setIsVideoModalOpen(true);
                      setIsPlayingVideo(true);
                    }}
                    className="relative w-full h-36 rounded-2xl overflow-hidden cursor-pointer group border border-zinc-200 shadow-inner bg-zinc-900"
                  >
                    <img
                      src="https://i.ibb.co/rG6JFnyY/0904-ezgif-com-resize.gif"
                      alt="How to use dashboard video tutorial"
                      className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
                    
                    {/* Pulsing Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-12 h-12 rounded-full bg-[#FF4C00]/40 animate-ping" />
                        <div className="w-12 h-12 rounded-full bg-[#FF4C00] group-hover:bg-[#E04300] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-5 h-5 ml-0.5 fill-white" />
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[10px] font-bold">
                      <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">▶ Watch Anytime</span>
                      <span className="bg-[#FF4C00] px-2 py-0.5 rounded-md">Full Guide</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsVideoModalOpen(true);
                      setIsPlayingVideo(true);
                    }}
                    className="w-full py-2.5 rounded-2xl bg-zinc-900 hover:bg-[#FF4C00] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs active:scale-98"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Watch Dashboard Video Walkthrough</span>
                  </button>
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
        onChangePassword={(newPass) => {
          if (onChangePassword) {
            onChangePassword(newPass);
          }
          showToast('Password updated successfully. Synced across all devices.');
        }}
      />

      {/* HOW TO USE THE DASHBOARD - INTERACTIVE VIDEO MODAL */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto font-['Poppins']">
          <div className="relative w-full max-w-2xl bg-zinc-900 text-white rounded-3xl border border-zinc-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 my-6">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#FF4C00]/20 rounded-xl border border-[#FF4C00]/30 text-[#FF4C00]">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">How to Use Your 11 to 12 Lunch Dashboard</h3>
                  <p className="text-xs text-zinc-400">Official subscriber walkthrough & desk drop guide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVideoModalOpen(false);
                  setIsPlayingVideo(false);
                }}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Display */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
              <img
                src="https://i.ibb.co/rG6JFnyY/0904-ezgif-com-resize.gif"
                alt="11 to 12 dashboard tutorial video"
                className={`w-full h-full object-cover transition-opacity ${isPlayingVideo ? 'opacity-95' : 'opacity-65'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Center Play Overlay if paused */}
              {!isPlayingVideo && (
                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(true)}
                  className="absolute p-4 rounded-full bg-[#FF4C00] text-white shadow-2xl hover:scale-110 transition cursor-pointer z-10"
                >
                  <Play className="w-8 h-8 ml-1 fill-white" />
                </button>
              )}

              {/* Bottom Video Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent space-y-2">
                {/* Progress bar */}
                <div
                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                  className="w-full bg-zinc-700/80 h-1.5 rounded-full overflow-hidden cursor-pointer"
                >
                  <div
                    className="bg-[#FF4C00] h-full transition-all duration-300"
                    style={{ width: isPlayingVideo ? '70%' : '25%' }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                      className="p-1 hover:text-[#FF4C00] transition cursor-pointer"
                    >
                      {isPlayingVideo ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <span className="font-mono text-zinc-300 text-[11px]">
                      {isPlayingVideo ? '0:52 / 1:15' : '0:18 / 1:15'}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800">
                    Chapter {activeVideoChapter + 1} of 4
                  </span>
                </div>
              </div>
            </div>

            {/* Video Chapters & Interactive Navigation */}
            <div className="p-4 sm:p-5 bg-zinc-950 space-y-3.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                Video Chapters (Click to Jump)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { time: '0:00', title: 'Welcome & Desk Drop Window (11:00–12:00)' },
                  { time: '0:25', title: 'Selecting Lunches & Choosing Swallow' },
                  { time: '0:45', title: 'Skipping a Meal (+1 Credit Preserved 100%)' },
                  { time: '1:05', title: 'Unskipping Meals & Trial Plan Rules' },
                ].map((chap, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveVideoChapter(idx);
                      setIsPlayingVideo(true);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center space-x-2.5 ${
                      activeVideoChapter === idx
                        ? 'border-[#FF4C00] bg-[#FF4C00]/15 text-white'
                        : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <span className="font-mono font-bold text-[#FF4C00] text-[11px] shrink-0">{chap.time}</span>
                    <span className="truncate">{chap.title}</span>
                  </button>
                ))}
              </div>

              {/* Key Takeaways */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 space-y-1.5">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4C00]" />
                  <span>Key Rules for All Subscribers & Trials:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                  <li><strong>Meal Skipping:</strong> Skip any lunch anytime before 12:00 PM cutoff to save your credit.</li>
                  <li><strong>Unskipping:</strong> If your schedule opens up, unskip the lunch to restore kitchen preparation.</li>
                  <li><strong>Trial Subscriptions:</strong> Trial accounts have full skip and unskip privileges across their trial days.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
};
