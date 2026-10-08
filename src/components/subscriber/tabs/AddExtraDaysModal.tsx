import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  UserProfile,
  SelectedLunchDay,
  OrderSubmission,
  StructuredMeal,
  SwallowType,
  calculateMealPrice,
  PER_DAY_FEE,
  OFFICIAL_BANK_DETAILS,
} from '../../../types';
import { getStructuredMealForDate } from '../../../data/menuRotation';
import { LAUNCH_CONFIG, isDateBeforeLaunch } from '../../../config/launchConfig';
import { downloadInvoiceDocument } from '../../../utils/invoiceDownload';
import { CONTACT_CONFIG } from '../../../config/contactConfig';
import {
  X,
  Plus,
  Check,
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Utensils,
  CreditCard,
  MessageCircle,
  Mail,
  Clock,
  Download,
} from 'lucide-react';

interface AddExtraDaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  pendingConfirmationOrders?: OrderSubmission[];
  onSubmitTopUpOrder: (order: OrderSubmission) => void;
}

export const AddExtraDaysModal: React.FC<AddExtraDaysModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  pendingConfirmationOrders = [],
  onSubmitTopUpOrder,
}) => {
  // Calendar month/year navigation state - start from launch month or current month
  const [currentYear, setCurrentYear] = useState<number>(() => {
    return LAUNCH_CONFIG.isEnabled ? LAUNCH_CONFIG.year : new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    return LAUNCH_CONFIG.isEnabled ? LAUNCH_CONFIG.monthIndex : new Date().getMonth();
  });

  // Selected extra days map: key = dateStr
  const [selectedExtraDays, setSelectedExtraDays] = useState<Record<string, SelectedLunchDay>>({});
  
  // Two-step flow state:
  // Step 1: selecting dates (fee hidden)
  // Step 2: calculated order animated, price visible, invoice download, payment accounts
  // Step 3: payment marked, waiting for admin confirmation
  const [isCalculated, setIsCalculated] = useState(false);
  const [isCalculatingAnimation, setIsCalculatingAnimation] = useState(false);
  const [animatedDisplayPrice, setAnimatedDisplayPrice] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderSubmission | null>(null);
  const [copiedBank, setCopiedBank] = useState<'wema' | 'flw' | null>(null);

  // Swallow selection modal (for Friday or Swallow dishes)
  const [swallowModalItem, setSwallowModalItem] = useState<{ dateStr: string; meal: StructuredMeal } | null>(null);
  const [selectedSwallow, setSelectedSwallow] = useState<SwallowType>('Semo');

  // Animation frame ref
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // 1. Set of dates the user already has confirmed on their plan
  const confirmedDateSet = useMemo(() => {
    return new Set((userProfile.selectedDays || []).map((d) => d.dateStr));
  }, [userProfile.selectedDays]);

  // 2. Set of dates currently in pending top-up orders awaiting admin confirmation
  const underConfirmationDateSet = useMemo(() => {
    const dates = new Set<string>();
    const userEmail = (userProfile.email || '').trim().toLowerCase();
    const userId = userProfile.id;

    pendingConfirmationOrders
      .filter((o) => {
        const orderEmail = (o.email || '').trim().toLowerCase();
        const matchesUser = (userEmail && orderEmail === userEmail) || o.id.includes(userId);
        return matchesUser && (o.paymentStatus === 'Pending Verification' || !o.paymentStatus);
      })
      .forEach((o) => {
        (o.selectedDays || []).forEach((d) => dates.add(d.dateStr));
      });

    return dates;
  }, [pendingConfirmationOrders, userProfile.email, userProfile.id]);

  // Month navigation helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar grid calculation (Monday to Sunday)
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = useMemo(() => {
    const cells: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      date: Date;
      dateStr: string;
      isWeekend: boolean;
      isBeforeLaunch: boolean;
      isConfirmed: boolean;
      isUnderConfirmation: boolean;
      meal: StructuredMeal | null;
    }> = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const date = new Date(currentYear, currentMonth - 1, d);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${mm}-${dd}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      cells.push({
        dayNumber: d,
        isCurrentMonth: false,
        date,
        dateStr,
        isWeekend,
        isBeforeLaunch: isDateBeforeLaunch(date),
        isConfirmed: confirmedDateSet.has(dateStr),
        isUnderConfirmation: underConfirmationDateSet.has(dateStr),
        meal: isWeekend ? null : getStructuredMealForDate(date),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${mm}-${dd}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      cells.push({
        dayNumber: d,
        isCurrentMonth: true,
        date,
        dateStr,
        isWeekend,
        isBeforeLaunch: isDateBeforeLaunch(date),
        isConfirmed: confirmedDateSet.has(dateStr),
        isUnderConfirmation: underConfirmationDateSet.has(dateStr),
        meal: isWeekend ? null : getStructuredMealForDate(date),
      });
    }

    // Next month padding
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(currentYear, currentMonth + 1, d);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${mm}-${dd}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      cells.push({
        dayNumber: d,
        isCurrentMonth: false,
        date,
        dateStr,
        isWeekend,
        isBeforeLaunch: isDateBeforeLaunch(date),
        isConfirmed: confirmedDateSet.has(dateStr),
        isUnderConfirmation: underConfirmationDateSet.has(dateStr),
        meal: isWeekend ? null : getStructuredMealForDate(date),
      });
    }

    return cells;
  }, [currentYear, currentMonth, firstDayIndex, prevMonthDays, totalDaysInMonth, confirmedDateSet, underConfirmationDateSet]);

  const chosenList: SelectedLunchDay[] = Object.values(selectedExtraDays);
  const chosenCount = chosenList.length;

  // Real financial calculation
  const foodTotal = chosenList.reduce((acc, item) => acc + calculateMealPrice(item.meal), 0);
  const perDayAddition = chosenCount * PER_DAY_FEE;
  const subtotal = foodTotal + perDayAddition;
  const totalSubscribedWithAdditions = (userProfile.selectedDays?.length || 0) + chosenCount;
  const discount = totalSubscribedWithAdditions >= 20 ? 2900 : 0;
  const realFinalTotal = Math.max(0, subtotal - discount);

  if (!isOpen) return null;

  // Toggle date selection
  const handleToggleCell = (cell: (typeof calendarDays)[0]) => {
    // Cannot pick weekends
    if (cell.isWeekend) return;
    // Cannot pick dates before launch (e.g. Dec 7)
    if (cell.isBeforeLaunch) return;
    // Cannot pick dates already on their active schedule
    if (cell.isConfirmed) return;
    // Cannot pick dates currently awaiting admin confirmation
    if (cell.isUnderConfirmation) return;
    // Must have meal
    if (!cell.meal || cell.meal.isNoDelivery) return;

    const dateStr = cell.dateStr;

    if (selectedExtraDays[dateStr]) {
      const copy = { ...selectedExtraDays };
      delete copy[dateStr];
      setSelectedExtraDays(copy);
      setIsCalculated(false);
    } else {
      // If Swallow meal, open quick swallow choice
      if (cell.meal.mealCategory === 'Swallow' || (cell.meal.swallowOptions && cell.meal.swallowOptions.length > 0)) {
        setSwallowModalItem({ dateStr, meal: cell.meal });
        setSelectedSwallow('Semo');
      } else {
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][cell.date.getDay()];
        setSelectedExtraDays({
          ...selectedExtraDays,
          [dateStr]: {
            dateStr,
            day: dayName as any,
            meal: cell.meal,
          },
        });
        setIsCalculated(false);
      }
    }
  };

  const handleConfirmSwallow = () => {
    if (!swallowModalItem) return;
    const { dateStr, meal } = swallowModalItem;
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];

    setSelectedExtraDays({
      ...selectedExtraDays,
      [dateStr]: {
        dateStr,
        day: dayName as any,
        meal,
        selectedSwallow,
      },
    });
    setSwallowModalItem(null);
    setIsCalculated(false);
  };

  // Trigger Calculate Order with animation (just like homepage!)
  const handleCalculateOrder = () => {
    if (chosenCount === 0) return;
    setIsCalculatingAnimation(true);

    const startPrice = Math.round(realFinalTotal * 1.35 + 2500);
    const duration = 1200;
    const startTime = performance.now();

    const animateDown = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startPrice - (startPrice - realFinalTotal) * easeOut);

      if (progress < 1) {
        setAnimatedDisplayPrice(current);
        animFrameRef.current = requestAnimationFrame(animateDown);
      } else {
        setAnimatedDisplayPrice(realFinalTotal);
        setIsCalculatingAnimation(false);
        setIsCalculated(true);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateDown);
  };

  const handleCopyAccount = (acct: string, bank: 'wema' | 'flw') => {
    navigator.clipboard.writeText(acct);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  // Submit top-up order
  const handleExecutePaymentDone = () => {
    if (chosenCount === 0) return;

    const orderId = `TOPUP-${Date.now().toString().slice(-6)}`;
    const newOrder: OrderSubmission = {
      id: orderId,
      fullName: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      company: userProfile.company || 'Corporate Client',
      officeAddress: userProfile.address || 'Office Desk',
      secondAddress: userProfile.secondAddress,
      selectedDays: chosenList,
      totalDays: chosenCount,
      planName: `Top-Up (+${chosenCount} Workdays)`,
      subtotalNGN: subtotal,
      discountNGN: discount,
      finalTotalNGN: realFinalTotal,
      submittedAt: new Date().toISOString(),
      paymentStatus: 'Pending Verification',
      isTopUp: true,
    };

    onSubmitTopUpOrder(newOrder);
    setSubmittedOrder(newOrder);
    setIsSubmitted(true);
  };

  const handleDownloadInvoice = () => {
    const orderToDownload: OrderSubmission = submittedOrder || {
      id: `TOPUP-${Date.now().toString().slice(-6)}`,
      fullName: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      company: userProfile.company || 'Corporate Client',
      officeAddress: userProfile.address || 'Office Desk',
      secondAddress: userProfile.secondAddress,
      selectedDays: chosenList,
      totalDays: chosenCount,
      subtotalNGN: subtotal,
      discountNGN: discount,
      finalTotalNGN: realFinalTotal,
      submittedAt: new Date().toISOString(),
      paymentStatus: 'Pending Verification',
      isTopUp: true,
    };
    downloadInvoiceDocument(orderToDownload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm font-['Poppins'] overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-zinc-200 space-y-5 my-auto max-h-[94vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <div className="flex items-center space-x-2 text-[#FF4C00]">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Extend Your Lunch Schedule
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 mt-0.5 tracking-tight">
              Add More Days to Your Calendar
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSubmitted ? (
          <div className="space-y-5 text-xs">
            
            {/* Explanatory text */}
            <p className="text-zinc-500 leading-relaxed">
              Browse any upcoming delivery month below. Workdays on your current plan are marked as <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Scheduled</span>, and days currently awaiting admin payment confirmation are marked as <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">Under Confirmation</span> and cannot be reselected.
            </p>

            {/* Calendar Controls & Month Header */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FF4C00]/10 flex items-center justify-center text-[#FF4C00]">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">
                      {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      Official deliveries active from {LAUNCH_CONFIG.displayShort}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1.5 rounded-xl border border-zinc-200 hover:bg-white text-zinc-700 transition cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1.5 rounded-xl border border-zinc-200 hover:bg-white text-zinc-700 transition cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day of Week Header: Mon to Sun */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((cell, idx) => {
                  const isSelected = Boolean(selectedExtraDays[cell.dateStr]);
                  const isLocked = cell.isWeekend || cell.isBeforeLaunch || cell.isConfirmed || cell.isUnderConfirmation || !cell.meal || cell.meal.isNoDelivery;

                  let badgeLabel: string | null = null;
                  if (cell.isConfirmed) badgeLabel = 'On Plan';
                  else if (cell.isUnderConfirmation) badgeLabel = 'Pending';
                  else if (cell.isBeforeLaunch) badgeLabel = 'Pre-Launch';
                  else if (cell.isWeekend) badgeLabel = null;

                  return (
                    <div
                      key={`${cell.dateStr}-${idx}`}
                      onClick={() => !isLocked && handleToggleCell(cell)}
                      className={`min-h-[64px] sm:min-h-[72px] p-1.5 rounded-xl border transition flex flex-col justify-between text-left select-none ${
                        isSelected
                          ? 'bg-[#FF4C00] text-white border-[#FF4C00] shadow-sm font-bold cursor-pointer'
                          : cell.isConfirmed
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 opacity-90 cursor-not-allowed'
                          : cell.isUnderConfirmation
                          ? 'bg-amber-50 border-amber-300 text-amber-950 opacity-95 cursor-not-allowed'
                          : cell.isBeforeLaunch
                          ? 'bg-zinc-100/60 border-zinc-200/50 text-zinc-300 cursor-not-allowed'
                          : cell.isWeekend
                          ? 'bg-zinc-100/40 border-transparent text-zinc-300 cursor-not-allowed'
                          : cell.isCurrentMonth
                          ? 'bg-white border-zinc-200 text-zinc-800 hover:border-[#FF4C00] hover:shadow-xs cursor-pointer'
                          : 'bg-zinc-50 border-zinc-100 text-zinc-400 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : ''}`}>
                          {cell.dayNumber}
                        </span>

                        {isSelected && (
                          <span className="w-3.5 h-3.5 rounded-full bg-white text-[#FF4C00] flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}

                        {cell.isConfirmed && (
                          <span className="w-3 h-3 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black shrink-0">
                            ✓
                          </span>
                        )}

                        {cell.isUnderConfirmation && (
                          <span className="w-3 h-3 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black shrink-0">
                            ⏳
                          </span>
                        )}
                      </div>

                      <div className="mt-1">
                        {badgeLabel ? (
                          <span
                            className={`text-[8px] sm:text-[9px] font-black uppercase px-1 py-0.5 rounded leading-none block text-center truncate ${
                              cell.isConfirmed
                                ? 'bg-emerald-200 text-emerald-900'
                                : cell.isUnderConfirmation
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-zinc-200 text-zinc-500'
                            }`}
                          >
                            {badgeLabel}
                          </span>
                        ) : cell.meal ? (
                          <span
                            className={`text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 ${
                              isSelected ? 'text-white' : 'text-zinc-600'
                            }`}
                          >
                            {cell.meal.mealName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Workdays Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">
                  Newly Selected Workdays ({chosenCount})
                </span>
                {chosenCount > 0 && !isCalculated && (
                  <button
                    type="button"
                    onClick={() => setSelectedExtraDays({})}
                    className="text-[11px] text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {chosenCount === 0 ? (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-dashed border-zinc-300 text-center text-zinc-400 text-xs">
                  Click any available workday on the calendar above to add meals to your schedule.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {chosenList.map((item) => (
                    <span
                      key={item.dateStr}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-zinc-900 text-[11px] font-semibold"
                    >
                      <span className="text-[#FF4C00] font-bold">{item.dateStr}</span>
                      <span className="text-zinc-500 truncate max-w-[130px]">{item.meal.mealName}</span>
                      {item.selectedSwallow && (
                        <span className="text-[10px] text-zinc-400">({item.selectedSwallow})</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const copy = { ...selectedExtraDays };
                          delete copy[item.dateStr];
                          setSelectedExtraDays(copy);
                          setIsCalculated(false);
                        }}
                        className="text-zinc-400 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* STEP 1: CALCULATE ORDER BUTTON (Fee remains hidden until clicked, just like homepage!) */}
            {!isCalculated && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">
                  {chosenCount > 0
                    ? `${chosenCount} workdays chosen. Click Calculate Order to view pricing & payment details.`
                    : 'Select workdays above to continue.'}
                </span>

                <button
                  type="button"
                  disabled={chosenCount === 0 || isCalculatingAnimation}
                  onClick={handleCalculateOrder}
                  className="px-6 py-2.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-40 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isCalculatingAnimation ? 'Calculating...' : 'Calculate Order →'}</span>
                </button>
              </div>
            )}

            {/* STEP 2: ANIMATED PRICE REVEAL & INVOICE / PAYMENT ACCOUNTS */}
            {isCalculated && (
              <div className="space-y-4 pt-2 border-t border-zinc-200 animate-in fade-in slide-in-from-bottom-2">
                
                {/* Financial Summary Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#FF4C00]/30 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                      Top-Up Order Summary (+{chosenCount} Days)
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadInvoice}
                      className="text-xs font-bold text-[#FF4C00] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Invoice Slip</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span>Fresh Food Total ({chosenCount} workdays):</span>
                    <span className="font-semibold text-zinc-900">₦{foodTotal.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span>Workstation Delivery Addition:</span>
                    <span className="font-semibold text-zinc-900">₦{perDayAddition.toLocaleString()}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                      <span>20th Day Free Perk:</span>
                      <span>-₦{discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-900 block">Total Due:</span>
                      <span className="text-[10px] text-zinc-400">Locked rate for selected dates</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#FF4C00] tracking-tight">
                        ₦{(animatedDisplayPrice || realFinalTotal).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Official Remittance Bank Accounts (Wema Bank & Flutterwave MFB) */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block">
                    Make Transfer to Either Account Below:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Wema Bank */}
                    <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[#FF4C00]">
                          Primary • Wema Bank
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAccount('7353969118', 'wema')}
                          className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedBank === 'wema' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div>
                        <span className="text-xl font-black tracking-wider text-white block select-all">
                          7353969118
                        </span>
                        <span className="text-[10px] text-zinc-400">11 TO 12 FOODS LTD</span>
                      </div>
                    </div>

                    {/* Flutterwave MFB */}
                    <div className="p-4 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-emerald-400">
                          Flutterwave MFB
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAccount('9596073284', 'flw')}
                          className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedBank === 'flw' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div>
                        <span className="text-xl font-black tracking-wider text-white block select-all">
                          9596073284
                        </span>
                        <span className="text-[10px] text-zinc-400">11 TO 12 FOODS LTD</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Speed Up Confirmation Notice (WhatsApp & Email) */}
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start space-x-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      To speed up confirmation, send your transfer receipt and invoice slip to our WhatsApp Concierge or email.
                    </p>
                    <div className="flex flex-wrap gap-3 text-[11px] pt-1">
                      <a
                        href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
                          `Hello 11 to 12! I just paid ₦${realFinalTotal.toLocaleString()} for my top-up add-on of +${chosenCount} days. Please confirm my added lunch dates.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-bold hover:underline flex items-center space-x-1"
                      >
                        <span>WhatsApp: {CONTACT_CONFIG.whatsappDisplay}</span>
                      </a>
                      <span className="text-zinc-300">•</span>
                      <a
                        href="mailto:confirm@11to12.food"
                        className="text-blue-700 font-bold hover:underline"
                      >
                        confirm@11to12.food
                      </a>
                    </div>
                  </div>
                </div>

                {/* Final Confirmation Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCalculated(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                  >
                    ← Edit Selected Days
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecutePaymentDone}
                      className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wide cursor-pointer shadow-md flex items-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>I Have Made Payment</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        ) : (
          /* STEP 3: SUBMITTED - WAITING FOR ADMIN TO CONFIRM ADDON */
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-900">Payment Submitted! Awaiting Admin Confirmation</h3>
              <p className="text-xs text-zinc-600 max-w-md mx-auto">
                Your top-up invoice <strong>{submittedOrder?.id}</strong> for <strong>+{chosenCount} workdays</strong> has been dispatched to 11 to 12 admin.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 text-xs text-left max-w-md mx-auto space-y-2.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Invoice Ref:</span>
                <span className="font-mono font-bold text-zinc-900">{submittedOrder?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount Paid:</span>
                <span className="font-black text-zinc-900">₦{(submittedOrder?.finalTotalNGN || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Status:</span>
                <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full text-[10px] flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Pending Admin Confirmation</span>
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 text-[11px] text-zinc-500">
                These dates are now tagged as <strong>Under Confirmation</strong>. Once confirmed by admin, they will immediately reflect as active days on your calendar and remove from pending.
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FF4C00]" />
                <span>Download Invoice</span>
              </button>

              <a
                href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
                  `Hello 11 to 12! Here is my payment receipt for Top-Up Invoice ${submittedOrder?.id} (₦${(submittedOrder?.finalTotalNGN || 0).toLocaleString()} for ${chosenCount} days). Kindly confirm.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Swallow Choice Mini Modal */}
      {swallowModalItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-zinc-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#FF4C00]">Swallow Choice</span>
              <h4 className="text-sm font-bold text-zinc-900 mt-0.5">{swallowModalItem.meal.mealName}</h4>
              <p className="text-[11px] text-zinc-500 mt-1">Please select your preferred swallow for this lunch:</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['Eba', 'Semo', 'Fufu'] as SwallowType[]).map((sw) => (
                <button
                  key={sw}
                  type="button"
                  onClick={() => setSelectedSwallow(sw)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center cursor-pointer transition ${
                    selectedSwallow === sw
                      ? 'bg-[#FF4C00] text-white border-[#FF4C00]'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {sw}
                </button>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSwallowModalItem(null)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwallow}
                className="px-4 py-1.5 rounded-xl bg-black text-white text-xs font-bold"
              >
                Confirm Meal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
