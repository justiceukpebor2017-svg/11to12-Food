import React, { useState, useEffect } from 'react';
import { OrderSubmission, CreditRedemptionOrder, CustomerRecord } from '../../types';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Building,
  Phone,
  Calendar,
  Utensils,
  PlusCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
  Ticket,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { InvoiceSlipModal } from '../marketing/InvoiceSlipModal';
import { getStructuredMealForDate } from '../../data/menuRotation';
import { subscribeToOrders, deleteOrderFromFirestore } from '../../services/firebase';
import { liveSync } from '../../services/liveSyncService';
import { LAUNCH_CONFIG, subscribeLaunchConfig } from '../../config/launchConfig';

interface OrdersManagerProps {
  orders: OrderSubmission[];
  onConfirmPayment: (orderId: string) => void;
  onConfirmTopUpOrder?: (orderId: string) => void;
  onOnboardOrder?: (order: OrderSubmission) => void;
  creditRedemptions?: CreditRedemptionOrder[];
  onConfirmCreditRedemption?: (redemptionId: string) => void;
  customers?: CustomerRecord[];
  onUpdateCustomer?: (customer: CustomerRecord) => void;
  onDeleteOrder?: (orderId: string) => void;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  onConfirmPayment,
  onConfirmTopUpOrder,
  onOnboardOrder,
  creditRedemptions = [],
  onConfirmCreditRedemption,
  customers = [],
  onUpdateCustomer,
  onDeleteOrder,
  selectedDate: propSelectedDate,
  onSelectDate,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'submissions'>('submissions');
  const [internalDate, setInternalDate] = useState<Date>(
    () => new Date(LAUNCH_CONFIG.year, LAUNCH_CONFIG.monthIndex, LAUNCH_CONFIG.day)
  );
  const selectedDate = propSelectedDate || internalDate;
  const setSelectedDate = onSelectDate || setInternalDate;

  useEffect(() => {
    const unsub = subscribeLaunchConfig((cfg) => {
      setInternalDate(new Date(cfg.year, cfg.monthIndex, cfg.day));
    });
    return () => unsub();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Verification' | 'Confirmed'>('All');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderSubmission | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OrderSubmission | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time onSnapshot camera stream for Orders
  const [liveOrders, setLiveOrders] = useState<OrderSubmission[]>([]);

  useEffect(() => {
    const unsub = subscribeToOrders((live) => {
      if (live && Array.isArray(live)) {
        setLiveOrders(live as OrderSubmission[]);
      }
    });
    return () => unsub();
  }, []);

  const ordersList = React.useMemo(() => {
    const map = new Map<string, OrderSubmission>();
    (orders || []).forEach((o) => {
      if (o && o.id) map.set(o.id, o);
    });
    (liveOrders || []).forEach((o) => {
      if (o && o.id) map.set(o.id, o);
    });
    return Array.from(map.values()).sort((a, b) => {
      return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
    });
  }, [orders, liveOrders]);

  const currentMeal = getStructuredMealForDate(selectedDate);

  // Date formatted to YYYY-MM-DD
  const yyyy = selectedDate.getFullYear();
  const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const dd = String(selectedDate.getDate()).padStart(2, '0');
  const selectedDateStr = `${yyyy}-${mm}-${dd}`;

  // Credit redemptions for selected date
  const redemptionsOnDay = (creditRedemptions || []).filter((r) =>
    r.items?.some((it) => it.dateStr === selectedDateStr)
  );
  const pendingRedemptionsOnDay = redemptionsOnDay.filter((r) => r.status === 'Pending Verification');
  const confirmedRedemptionsOnDay = redemptionsOnDay.filter((r) => r.status === 'Confirmed');

  const creditExtraPortionsConfirmed = confirmedRedemptionsOnDay.reduce((acc, r) => {
    const item = r.items.find((it) => it.dateStr === selectedDateStr);
    return acc + (item?.portions || 0);
  }, 0);

  // Derive active daily subscriber roster from customers prop for the active date
  const subscribersOnDate = customers.filter((cust) =>
    cust.selectedDays?.some((d) => d.dateStr === selectedDateStr)
  );

  const dailyOrders = subscribersOnDate.map((cust) => {
    const dayItem = cust.selectedDays.find((d) => d.dateStr === selectedDateStr)!;
    const isSkipped = cust.skippedDates?.includes(selectedDateStr) || cust.dayStatuses?.[selectedDateStr] === 'Skipped';
    const isExtraPlate = cust.extraPlateDates?.includes(selectedDateStr) || cust.dayStatuses?.[selectedDateStr] === 'Extra Plate';

    const status: 'Accepted' | 'Skipped' | 'Extra Plate' = isSkipped
      ? 'Skipped'
      : isExtraPlate
      ? 'Extra Plate'
      : 'Accepted';

    return {
      id: cust.id,
      customerRecord: cust,
      customerName: cust.fullName,
      company: cust.company,
      location: cust.deliveryArea || 'Victoria Island',
      address: cust.officeAddress + (cust.floorSuite ? ` (${cust.floorSuite})` : ''),
      phone: cust.phone,
      creditsBalance: cust.creditsBalance ?? 0,
      status,
      scheduledMeal: dayItem.meal?.mealName || currentMeal?.mealName || 'Scheduled Lunch',
      swallowChoice: dayItem.selectedSwallow,
      notes: cust.notes,
    };
  });

  // Compute daily order & meal metrics
  const acceptedCount = dailyOrders.filter((o) => o.status === 'Accepted').length;
  const extraPlateSubscriberCount = dailyOrders.filter((o) => o.status === 'Extra Plate').length;
  const skippedCount = dailyOrders.filter((o) => o.status === 'Skipped').length;
  
  // Total actual meals to produce & dispatch: Standard accepted = 1 plate, Extra Plate = 2 plates, Confirmed redemptions = portions
  const totalProductionPacks = acceptedCount + (extraPlateSubscriberCount * 2) + creditExtraPortionsConfirmed;

  // Real-time credits used: 1 per extra plate + confirmed credit redemptions
  const creditsUsedRealTime = extraPlateSubscriberCount + creditExtraPortionsConfirmed;

  // Real-time Handlers for Credits and Extra Plates
  const handleUseCreditForExtraPlate = (orderId: string, custName: string) => {
    const cust = customers.find((c) => c.id === orderId);
    if (!cust) return;
    if ((cust.creditsBalance || 0) <= 0) {
      setToastMessage(`⚠️ ${custName} has 0 credits available.`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const updatedExtraPlates = [...(cust.extraPlateDates || []).filter((d) => d !== selectedDateStr), selectedDateStr];
    const updatedSkipped = (cust.skippedDates || []).filter((d) => d !== selectedDateStr);
    const updatedDayStatuses = { ...(cust.dayStatuses || {}), [selectedDateStr]: 'Extra Plate' as const };

    const updatedCust: CustomerRecord = {
      ...cust,
      creditsBalance: Math.max(0, (cust.creditsBalance || 0) - 1),
      extraPlateDates: updatedExtraPlates,
      skippedDates: updatedSkipped,
      dayStatuses: updatedDayStatuses,
    };

    if (onUpdateCustomer) onUpdateCustomer(updatedCust);
    setToastMessage(`✓ ${custName} used 1 Credit for Extra Plate (+1 Meal synced to Production in real time).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSkipMeal = (orderId: string, custName: string) => {
    const cust = customers.find((c) => c.id === orderId);
    if (!cust) return;

    const updatedSkipped = [...(cust.skippedDates || []).filter((d) => d !== selectedDateStr), selectedDateStr];
    const updatedExtraPlates = (cust.extraPlateDates || []).filter((d) => d !== selectedDateStr);
    const updatedDayStatuses = { ...(cust.dayStatuses || {}), [selectedDateStr]: 'Skipped' as const };

    const updatedCust: CustomerRecord = {
      ...cust,
      creditsBalance: (cust.creditsBalance || 0) + 1,
      skippedDates: updatedSkipped,
      extraPlateDates: updatedExtraPlates,
      dayStatuses: updatedDayStatuses,
    };

    if (onUpdateCustomer) onUpdateCustomer(updatedCust);
    setToastMessage(`✓ ${custName} skipped lunch today. +1 Credit refunded to balance (-1 Meal from Production in real time).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRevertToAccepted = (orderId: string) => {
    const cust = customers.find((c) => c.id === orderId);
    if (!cust) return;

    const wasExtraPlate = cust.extraPlateDates?.includes(selectedDateStr) || cust.dayStatuses?.[selectedDateStr] === 'Extra Plate';
    const wasSkipped = cust.skippedDates?.includes(selectedDateStr) || cust.dayStatuses?.[selectedDateStr] === 'Skipped';

    let newBalance = cust.creditsBalance || 0;
    if (wasExtraPlate) newBalance += 1; // refund the credit
    if (wasSkipped) newBalance = Math.max(0, newBalance - 1); // deduct the refunded credit

    const updatedCust: CustomerRecord = {
      ...cust,
      creditsBalance: newBalance,
      skippedDates: (cust.skippedDates || []).filter((d) => d !== selectedDateStr),
      extraPlateDates: (cust.extraPlateDates || []).filter((d) => d !== selectedDateStr),
      dayStatuses: { ...(cust.dayStatuses || {}), [selectedDateStr]: 'Accepted' as const },
    };

    if (onUpdateCustomer) onUpdateCustomer(updatedCust);
    setToastMessage(`✓ Reverted ${cust.fullName} to standard 1 meal pack.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const navigateDay = (step: number) => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + step);
    if (next.getDay() === 6) next.setDate(next.getDate() + (step > 0 ? 2 : -1));
    if (next.getDay() === 0) next.setDate(next.getDate() + (step > 0 ? 1 : -2));
    setSelectedDate(next);
  };

  const isOrderCustomerLinked = (sub: OrderSubmission) => {
    if (!sub) return false;
    const subEmail = (sub.email || '').trim().toLowerCase();
    return Boolean(
      (subEmail && customers.some((c) => (c.email || '').trim().toLowerCase() === subEmail)) ||
      (sub.id && customers.some((c) => c.orderRef === sub.id))
    );
  };

  // Filtered order submissions for Tab 2
  const filteredSubmissions = (ordersList || []).filter((o) => {
    if (!o) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const fullName = (o.fullName || '').toLowerCase();
    const email = (o.email || '').toLowerCase();
    const company = (o.company || '').toLowerCase();
    const id = (o.id || '').toLowerCase();

    const matchesSearch =
      !term ||
      fullName.includes(term) ||
      email.includes(term) ||
      company.includes(term) ||
      id.includes(term);
    const matchesStatus = statusFilter === 'All' || o.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Daily Operations & Submissions
          </span>
          <h2 className="text-2xl font-black text-black mt-0.5">
            Orders & Daily Roster
          </h2>
          <p className="text-xs text-zinc-500">
            Real-time subscriber roster synced with kitchen production. Shows actual meals and credits used in real time.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex p-1 bg-zinc-200 rounded-full text-xs font-bold">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              Daily Roster ({dailyOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer flex items-center space-x-1 ${
                activeTab === 'submissions'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <span>Submissions & Invoices</span>
              {ordersList.filter((o) => o.paymentStatus === 'Pending Verification').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#FF4C00]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 animate-in fade-in flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TAB 1: DAILY SUBSCRIBER ROSTER (Synchronized with Production Tab) */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          
          {/* Workday Switcher Bar */}
          <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigateDay(-1)}
                  className="p-2 rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  title="Previous Workday"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateDay(1)}
                  className="p-2 rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  title="Next Workday"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#FF4C00] uppercase tracking-wider block">
                  Selected Workday
                </span>
                <span className="text-base font-black text-black">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Quick Date Switcher */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
              {[
                { label: 'Mon Dec 7', date: new Date(2026, 11, 7) },
                { label: 'Tue Dec 8', date: new Date(2026, 11, 8) },
                { label: 'Wed Dec 9', date: new Date(2026, 11, 9) },
                { label: 'Thu Dec 10', date: new Date(2026, 11, 10) },
                { label: 'Fri Dec 11 (Swallow)', date: new Date(2026, 11, 11) },
                { label: 'Mon Dec 14', date: new Date(2026, 11, 14) },
              ].map((item, idx) => {
                const isSelected =
                  selectedDate.getFullYear() === item.date.getFullYear() &&
                  selectedDate.getMonth() === item.date.getMonth() &&
                  selectedDate.getDate() === item.date.getDate();

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(item.date)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white'
                        : 'bg-[#FAF7F2] text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Real-Time Metrics Row (Tells actual meals for the day and credits used in real time) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            {/* 1. Total Orders */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Total Subscribed Orders
              </span>
              <span className="text-2xl font-black text-zinc-900 block mt-1">
                {dailyOrders.length}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                Individual desks on route
              </span>
            </div>

            {/* 2. Actual Meals for the Day */}
            <div className="p-4 rounded-2xl bg-black text-white shadow-xs">
              <span className="text-[10px] font-bold text-[#FF4C00] uppercase tracking-wider block">
                Actual Meals for Day
              </span>
              <span className="text-2xl font-black text-white block mt-1">
                {totalProductionPacks} <span className="text-xs font-normal text-zinc-400">Packs</span>
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {acceptedCount} standard + {extraPlateSubscriberCount * 2 + creditExtraPortionsConfirmed} extra
              </span>
            </div>

            {/* 3. Credits Used in Real Time */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                  Credits Used (Real Time)
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <span className="text-2xl font-black text-amber-900 block mt-1">
                {creditsUsedRealTime} <span className="text-xs font-semibold text-amber-700">Credits</span>
              </span>
              <span className="text-[10px] text-amber-700 block mt-0.5 font-medium">
                {creditsUsedRealTime > 0 ? `+${creditsUsedRealTime} extra packs synced` : '0 credits redeemed'}
              </span>
            </div>

            {/* 4. Skipped Lunches */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Skipped Lunches
              </span>
              <span className="text-2xl font-black text-zinc-700 block mt-1">
                {skippedCount}
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
                +{skippedCount} credit refunded
              </span>
            </div>

          </div>

          {/* Pending Credit Redemptions Banner */}
          {pendingRedemptionsOnDay.length > 0 && (
            <div className="space-y-3">
              {pendingRedemptionsOnDay.map((red) => {
                const dayItem = red.items.find((it) => it.dateStr === selectedDateStr);
                const portions = dayItem?.portions || 1;
                const dishName = dayItem?.dishName || currentMeal?.mealName || 'Lunch Dish';
                const swallow = dayItem?.swallowChoice;

                return (
                  <div
                    key={red.id}
                    className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
                        <Sparkles className="w-5 h-5 text-[#FF4C00]" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] bg-orange-100 px-2 py-0.5 rounded-full font-bold">
                            Credit Extra Plate Request
                          </span>
                          <span className="text-[11px] text-zinc-500 font-semibold">
                            Pending Verification
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-zinc-900 mt-0.5">
                          {red.userName} ({red.company}) ordered +{portions} Extra Plate{portions > 1 ? 's' : ''}
                        </h4>
                        <p className="text-xs text-zinc-600 font-medium">
                          Dish: <strong className="text-black">{dishName}</strong>
                          {swallow && <span> • Swallow Choice: <strong className="text-[#FF4C00]">{swallow}</strong></span>}
                          {' • '}Desk Drop: {red.officeAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (onConfirmCreditRedemption) {
                            onConfirmCreditRedemption(red.id);
                            setToastMessage(`✓ Confirmed +${portions} Extra Plate(s) for ${red.userName}! Production updated.`);
                            setTimeout(() => setToastMessage(null), 4000);
                          }
                        }}
                        className="px-4 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#FF4C00]" />
                        <span>Confirm (+{portions} Packs)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Daily Subscriber Orders Table */}
          <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-zinc-900">
                  Subscriber Deliveries for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </h3>
                <p className="text-xs text-zinc-500">
                  {dailyOrders.length} subscriber orders scheduled • Synced in real time with kitchen production
                </p>
              </div>

              <div className="text-xs font-semibold text-zinc-500">
                Dish: <strong className="text-zinc-900">{currentMeal?.mealName || 'Standard Lunch'}</strong>
              </div>
            </div>

            {dailyOrders.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-xs">
                No subscriber meals scheduled for this workday. Navigate across workdays above or assign meals in Customers tab.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-[#FAF7F2] text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Subscriber</th>
                      <th className="py-3 px-4">Company & Desk Drop</th>
                      <th className="py-3 px-4">Scheduled Meal / Food</th>
                      <th className="py-3 px-4">Credits Balance</th>
                      <th className="py-3 px-4">Actual Meals</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Real-Time Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {dailyOrders.map((ord) => {
                      const hasCredit = ord.creditsBalance > 0;
                      return (
                        <tr key={ord.id} className="hover:bg-zinc-50/70 transition">
                          
                          {/* Subscriber */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-black block">{ord.customerName}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{ord.phone}</span>
                          </td>

                          {/* Company & Address */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-zinc-900 block">{ord.company}</span>
                            <span className="text-[11px] text-zinc-500 line-clamp-1">{ord.address}</span>
                          </td>

                          {/* Scheduled Meal / Food */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-zinc-900 block">{ord.scheduledMeal}</span>
                            {ord.swallowChoice && (
                              <span className="text-[10px] font-bold text-[#FF4C00] block">
                                Swallow: {ord.swallowChoice}
                              </span>
                            )}
                          </td>

                          {/* Credit Balance */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                hasCredit
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-zinc-100 text-zinc-500'
                              }`}
                            >
                              {ord.creditsBalance} {ord.creditsBalance === 1 ? 'Credit' : 'Credits'}
                            </span>
                          </td>

                          {/* Actual Meals */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-black text-black text-xs">
                              {ord.status === 'Extra Plate' ? '2 Meal Packs' : ord.status === 'Accepted' ? '1 Meal Pack' : '0 Packs (Skipped)'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {ord.status === 'Extra Plate' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#FF4C00] text-white">
                                ★ Extra Plate (1 Credit Used)
                              </span>
                            ) : ord.status === 'Accepted' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                ✓ Accepted
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-zinc-200 text-zinc-700">
                                ✕ Skipped (+1 Credit)
                              </span>
                            )}
                          </td>

                          {/* Real-time Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-2">
                              
                              {/* Use Credit for Extra Plate */}
                              {ord.status !== 'Extra Plate' && hasCredit && (
                                <button
                                  type="button"
                                  onClick={() => handleUseCreditForExtraPlate(ord.id, ord.customerName)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition cursor-pointer"
                                  title="Use 1 credit for an extra plate (+1 meal to production)"
                                >
                                  + Extra Plate (1 Credit)
                                </button>
                              )}

                              {/* Skip Meal */}
                              {ord.status === 'Accepted' && (
                                <button
                                  type="button"
                                  onClick={() => handleSkipMeal(ord.id, ord.customerName)}
                                  className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 text-[11px] font-semibold cursor-pointer"
                                  title="Skip lunch today and refund 1 credit"
                                >
                                  Skip Lunch
                                </button>
                              )}

                              {/* Revert to Standard Accepted */}
                              {ord.status !== 'Accepted' && (
                                <button
                                  type="button"
                                  onClick={() => handleRevertToAccepted(ord.id)}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white text-[11px] font-semibold cursor-pointer"
                                  title="Reset to standard 1 plate"
                                >
                                  Revert to Standard
                                </button>
                              )}

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: INVOICES & FORM SUBMISSIONS FROM HOMEPAGE */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by customer, company, order ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-zinc-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-black focus:outline-none focus:border-[#FF4C00]"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {(['All', 'Pending Verification', 'Confirmed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-black text-white'
                      : 'bg-[#FAF7F2] text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions Table */}
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center text-zinc-400 text-xs">
              No plan submissions found matching your filters.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-[#FAF7F2] text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Order Ref</th>
                      <th className="py-3.5 px-4">Customer Details</th>
                      <th className="py-3.5 px-4">Company & Delivery Desk</th>
                      <th className="py-3.5 px-4">Plan & Meals</th>
                      <th className="py-3.5 px-4">Amount Paid</th>
                      <th className="py-3.5 px-4">Payment Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-4 px-4 font-mono font-bold text-black text-xs">
                          {sub.id}
                          {sub.memberCode && (
                            <span className="block text-[10px] font-mono text-[#FF4C00]">
                              Member: {sub.memberCode}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold text-black block">{sub.fullName}</span>
                          <span className="text-[11px] text-zinc-500">{sub.email}</span>
                          <span className="text-[10px] text-zinc-400 font-mono block">{sub.phone}</span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-semibold text-zinc-900 block">{sub.company}</span>
                          <span className="text-[11px] text-zinc-500">{sub.officeAddress}</span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold text-black">{sub.totalDays} Workdays</span>
                          <span className="text-[11px] text-zinc-500 block">
                            {sub.selectedDays?.length || 0} dates picked
                          </span>
                          {(sub.isTopUp || isOrderCustomerLinked(sub)) && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                              ⚡ Top-Up Plan (+{sub.totalDays} Days)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 font-black text-black">
                          ₦{(sub.finalTotalNGN || 0).toLocaleString()}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {sub.paymentStatus === 'Confirmed' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                              ⏳ Pending Flutterwave Check
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceOrder(sub)}
                              className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-xs transition cursor-pointer flex items-center space-x-1"
                              title="View Invoice Slip"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#FF4C00]" />
                              <span>Invoice</span>
                            </button>

                            {/* Onboard directly to Customers */}
                            {onOnboardOrder && !isOrderCustomerLinked(sub) && (
                              <button
                                type="button"
                                onClick={() => onOnboardOrder(sub)}
                                className="px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center space-x-1"
                                title="Onboard this customer into the subscriber database"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#FF4C00]" />
                                <span>Onboard</span>
                              </button>
                            )}

                            {sub.paymentStatus !== 'Confirmed' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (sub.isTopUp || isOrderCustomerLinked(sub)) {
                                    if (onConfirmTopUpOrder) {
                                      onConfirmTopUpOrder(sub.id);
                                    } else {
                                      onConfirmPayment(sub.id);
                                    }
                                    setToastMessage(`✓ Confirmed payment and added ${sub.totalDays} meal days to ${sub.fullName}'s calendar!`);
                                  } else {
                                    onConfirmPayment(sub.id);
                                    setToastMessage(`✓ Confirmed payment for ${sub.fullName} (${sub.id})!`);
                                  }
                                  setLiveOrders((prev) =>
                                    prev.map((o) => (o.id === sub.id ? { ...o, paymentStatus: 'Confirmed' } : o))
                                  );
                                  setTimeout(() => setToastMessage(null), 3500);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center space-x-1"
                              >
                                <span>{(sub.isTopUp || isOrderCustomerLinked(sub)) ? `Confirm & Add ${sub.totalDays} Days` : 'Confirm Payment'}</span>
                              </button>
                            )}

                            {/* Delete / Discard Unconfirmed or Unpaid Invoice */}
                            <button
                              type="button"
                              onClick={() => setOrderToDelete(sub)}
                              className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 transition cursor-pointer flex items-center space-x-1 font-bold text-xs shadow-2xs"
                              title="Delete this order / pending invoice so unpaid requests do not pile up"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Delete Order / Invoice Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-2xl">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-black">Delete Pending Invoice?</h3>
                <span className="text-xs font-bold text-red-600">Ref: {orderToDelete.id}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Are you sure you want to permanently delete the invoice for <strong>{orderToDelete.fullName}</strong> ({orderToDelete.company}) of <strong>₦{(orderToDelete.finalTotalNGN || 0).toLocaleString()}</strong>?
            </p>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-[11px] text-zinc-500 space-y-1">
              <div><strong>Status:</strong> {orderToDelete.paymentStatus}</div>
              <div><strong>Selected Meals:</strong> {orderToDelete.totalDays || 0} workdays</div>
              <p className="text-amber-800 font-medium pt-1">
                This removes this unconfirmed invoice so that pending invoices do not pile up on your dashboard.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2.5 rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-bold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = orderToDelete.id;
                  if (onDeleteOrder) {
                    onDeleteOrder(targetId);
                  }
                  deleteOrderFromFirestore(targetId).catch(() => {});
                  liveSync.deleteOrder(targetId).catch(() => {});
                  setLiveOrders((prev) => prev.filter((o) => o.id !== targetId));
                  setToastMessage(`✓ Deleted pending invoice ${targetId} for ${orderToDelete.fullName}`);
                  setOrderToDelete(null);
                  setTimeout(() => setToastMessage(null), 3500);
                }}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition flex items-center space-x-1.5 shadow-md active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Pending Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Slip Preview Modal */}
      {selectedInvoiceOrder && (
        <InvoiceSlipModal
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          order={selectedInvoiceOrder}
        />
      )}

    </div>
  );
};
