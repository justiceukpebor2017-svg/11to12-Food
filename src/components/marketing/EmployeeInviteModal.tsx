import React, { useState, useMemo, useEffect } from 'react';
import {
  CorporateAccount,
  CorporateEmployeeRecord,
  SelectedLunchDay,
  StructuredMeal,
  SwallowType,
  MealOption,
  CustomerRecord,
} from '../../types';
import {
  CANONICAL_8_WEEKS_MENU,
  CANONICAL_DATES_MAP,
  customMealOverrides,
  CanonicalDayMenu,
  CanonicalWeekMenu,
  parseStructuredMeal,
  isMealTitleSwallow,
  subscribeMenuChanges,
} from '../../data/menuRotation';
import {
  claimCorporateEmployeeSlotAndSave,
  subscribeToCorporateAccount,
  subscribeToCorporateEmployees,
  isEmailAlreadyRegisteredInFirestore,
} from '../../services/firebase';
import { DEFAULT_SUBSCRIBER_PASSWORD } from '../../utils/credentialUtils';
import {
  X,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Users,
  Clock,
} from 'lucide-react';

interface EmployeeInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  corporateAccount: CorporateAccount | null;
  existingCustomers?: CustomerRecord[];
  onEmployeeSubmitted?: (employee: CorporateEmployeeRecord, customer: CustomerRecord) => void;
}

export const EmployeeInviteModal: React.FC<EmployeeInviteModalProps> = ({
  isOpen,
  onClose,
  corporateAccount,
  existingCustomers = [],
  onEmployeeSubmitted,
}) => {
  const [step, setStep] = useState<'meals' | 'details' | 'confirmed'>('meals');
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [, setMenuVersion] = useState(0);

  // Real-time live account & live registered employees for accurate slot tracking
  const [liveAccount, setLiveAccount] = useState<CorporateAccount | null>(corporateAccount);
  const [liveEmployees, setLiveEmployees] = useState<CorporateEmployeeRecord[]>([]);
  const [slotsFullState, setSlotsFullState] = useState(false);

  // Step 1: Meal Selections Map (dateStr -> SelectedLunchDay)
  const [selectedDaysMap, setSelectedDaysMap] = useState<Record<string, SelectedLunchDay>>({});

  // Step 2: Employee Details & 2 Delivery Address Options
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [deskLocation, setDeskLocation] = useState('');
  const [secondAddress, setSecondAddress] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<CorporateEmployeeRecord | null>(null);

  useEffect(() => {
    const unsub = subscribeMenuChanges(() => setMenuVersion((v) => v + 1));
    return () => unsub();
  }, []);

  useEffect(() => {
    setLiveAccount(corporateAccount);
    setSlotsFullState(false);
    setStep('meals');
    setCreatedEmployee(null);
    setSelectedDaysMap({});
    setFormError(null);
    if (corporateAccount) {
      setDeskLocation(corporateAccount.officeAddress || '');
      setSecondAddress(corporateAccount.secondAddress || '');
    }
  }, [corporateAccount?.id, isOpen]);

  // Live Firestore subscriptions for slot detection
  useEffect(() => {
    if (!isOpen || !corporateAccount?.id) return;
    const unsubAcct = subscribeToCorporateAccount(corporateAccount.id, (updated) => {
      if (updated) setLiveAccount(updated);
    });
    const unsubEmps = subscribeToCorporateEmployees(corporateAccount.id, (list) => {
      setLiveEmployees(list);
    });
    return () => {
      unsubAcct();
      unsubEmps();
    };
  }, [isOpen, corporateAccount?.id]);

  const activeAccount = liveAccount || corporateAccount;
  const mealDaysTarget = activeAccount?.mealDaysPerEmployee || 5;
  const totalSlots = activeAccount?.totalEmployees || 1;
  const usedSlots = Math.max(activeAccount?.usedSlots || 0, liveEmployees.length);
  const remainingSlots = Math.max(0, totalSlots - usedSlots);
  const isSlotsExhausted = slotsFullState || (activeAccount ? usedSlots >= totalSlots && step !== 'confirmed' : false);
  const isPendingConfirmation = activeAccount ? activeAccount.paymentStatus !== 'Confirmed' : false;

  const activeWeek: CanonicalWeekMenu = CANONICAL_8_WEEKS_MENU[currentWeekIndex] || CANONICAL_8_WEEKS_MENU[0];

  const selectedDaysList = useMemo(() => {
    return (Object.values(selectedDaysMap) as SelectedLunchDay[])
      .filter((d) => !d.meal.isHoliday && !d.meal.isNoDelivery)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [selectedDaysMap]);

  const selectedCount = selectedDaysList.length;

  if (!isOpen || !activeAccount) return null;

  const handleToggleDayOption = (dayMenu: CanonicalDayMenu, optionId: 'opt-1' | 'opt-2') => {
    if (dayMenu.isHoliday) return;
    setFormError(null);

    const currentlySelected = selectedDaysMap[dayMenu.dateStr];
    if (currentlySelected && currentlySelected.selectedMealOption?.id === optionId) {
      setSelectedDaysMap((prev) => {
        const copy = { ...prev };
        delete copy[dayMenu.dateStr];
        return copy;
      });
      return;
    }

    if (!currentlySelected && selectedCount >= mealDaysTarget) {
      setFormError(
        `${activeAccount.companyName} covered ${mealDaysTarget} meal days per staff. Deselect a day first to swap.`
      );
      return;
    }

    const targetOptionName = optionId === 'opt-1' ? dayMenu.option1 : dayMenu.option2;
    const targetParsed = parseStructuredMeal(targetOptionName, dayMenu.dayFull, dayMenu.dateStr);
    const isSwallowMeal =
      optionId === 'opt-1'
        ? dayMenu.option1IsSwallow !== undefined
          ? Boolean(dayMenu.option1IsSwallow)
          : targetParsed.mealCategory === 'Swallow' || isMealTitleSwallow(targetOptionName)
        : dayMenu.option2IsSwallow !== undefined
          ? Boolean(dayMenu.option2IsSwallow)
          : targetParsed.mealCategory === 'Swallow' || isMealTitleSwallow(targetOptionName);

    const mealObj: StructuredMeal = {
      ...targetParsed,
      mealName: targetOptionName,
      hasDualOptions: true,
      mealOptions: [
        {
          id: 'opt-1',
          name: dayMenu.option1,
          category: parseStructuredMeal(dayMenu.option1, dayMenu.dayFull, dayMenu.dateStr).mealCategory,
          description: 'Option 1',
        },
        {
          id: 'opt-2',
          name: dayMenu.option2,
          category: parseStructuredMeal(dayMenu.option2, dayMenu.dayFull, dayMenu.dateStr).mealCategory,
          description: 'Option 2',
        },
      ],
      selectedOptionId: optionId,
    };

    const chosenOpt: MealOption = {
      id: optionId,
      name: targetOptionName,
      category: targetParsed.mealCategory,
      description: optionId === 'opt-1' ? 'Option 1' : 'Option 2',
    };

    const defaultSwallow: SwallowType = currentlySelected?.selectedSwallow || 'Semo';

    setSelectedDaysMap((prev) => ({
      ...prev,
      [dayMenu.dateStr]: {
        dateStr: dayMenu.dateStr,
        meal: mealObj,
        selectedMealOption: chosenOpt,
        selectedSwallow: isSwallowMeal ? defaultSwallow : undefined,
      },
    }));
  };

  const handleSelectSwallow = (dateStr: string, swallow: SwallowType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDaysMap((prev) => {
      if (!prev[dateStr]) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...prev[dateStr],
          selectedSwallow: swallow,
        },
      };
    });
  };

  const handleAutoFillRemaining = () => {
    setFormError(null);
    setSelectedDaysMap((prev) => {
      const copy = { ...prev };
      let currentTotal = Object.keys(copy).length;

      for (const week of CANONICAL_8_WEEKS_MENU) {
        for (const rawDay of week.days) {
          if (currentTotal >= mealDaysTarget) break;
          const canonical = CANONICAL_DATES_MAP[rawDay.dateStr];
          const override = customMealOverrides[rawDay.dateStr];
          const isHoliday =
            override?.isHoliday !== undefined
              ? Boolean(override.isHoliday || override.isNoDelivery)
              : Boolean(canonical?.isHoliday ?? rawDay.isHoliday);
          if (isHoliday || copy[rawDay.dateStr]) continue;

          const opt1Name =
            override?.mealOptions?.[0]?.name || (override as any)?.option1 || canonical?.option1 || rawDay.option1;
          const opt2Name =
            override?.mealOptions?.[1]?.name || (override as any)?.option2 || canonical?.option2 || rawDay.option2;
          const parsed = parseStructuredMeal(opt1Name, rawDay.dayFull, rawDay.dateStr);
          const isSwallow =
            override?.option1IsSwallow !== undefined
              ? Boolean(override.option1IsSwallow)
              : canonical?.option1IsSwallow !== undefined
                ? Boolean(canonical.option1IsSwallow)
                : isMealTitleSwallow(opt1Name);

          copy[rawDay.dateStr] = {
            dateStr: rawDay.dateStr,
            meal: {
              ...parsed,
              mealName: opt1Name,
              hasDualOptions: true,
              mealOptions: [
                { id: 'opt-1', name: opt1Name, category: parsed.mealCategory, description: 'Option 1' },
                {
                  id: 'opt-2',
                  name: opt2Name,
                  category: parseStructuredMeal(opt2Name, rawDay.dayFull, rawDay.dateStr).mealCategory,
                  description: 'Option 2',
                },
              ],
              selectedOptionId: 'opt-1',
            },
            selectedMealOption: {
              id: 'opt-1',
              name: opt1Name,
              category: parsed.mealCategory,
              description: 'Option 1',
            },
            selectedSwallow: isSwallow ? 'Semo' : undefined,
          };
          currentTotal += 1;
        }
        if (currentTotal >= mealDaysTarget) break;
      }
      return copy;
    });
  };

  const handleProceedToDetails = () => {
    setFormError(null);
    if (selectedCount === 0) {
      setFormError(`Please select your meal dates (up to ${mealDaysTarget} meals) to continue.`);
      return;
    }
    setStep('details');
  };

  const handleFinishClaimSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!fullName.trim() || !phone.trim() || !cleanEmail || !deskLocation.trim()) {
      setFormError('Please enter your Full Name, Phone Number, Email, and Delivery Option 1.');
      return;
    }

    // Strict email uniqueness validation: never allow already-used email addresses
    const alreadyInCompany = liveEmployees.some(
      (emp) => (emp.email || '').trim().toLowerCase() === cleanEmail
    );
    const alreadyInCustomers = existingCustomers.some(
      (c) => (c.email || '').trim().toLowerCase() === cleanEmail
    );
    if (alreadyInCompany || alreadyInCustomers) {
      setFormError(
        `This email address (${cleanEmail}) has already been used to register on 11:12 Food. Please use a different unique email address.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const firestoreDuplicate = await isEmailAlreadyRegisteredInFirestore(cleanEmail, {
        includeOrders: true,
      });
      if (firestoreDuplicate.exists) {
        setFormError(
          firestoreDuplicate.reason ||
            `This email address (${cleanEmail}) is already registered. Please use a unique email address.`
        );
        setIsSubmitting(false);
        return;
      }

      const nowIso = new Date().toISOString();
      const employeeId = `emp-${activeAccount.id}-${Date.now()}`;
      const customerId = `corp-cust-${Date.now()}`;

      const employeeRecord: CorporateEmployeeRecord = {
        id: employeeId,
        corporateId: activeAccount.id,
        inviteCode: activeAccount.inviteCode,
        companyName: activeAccount.companyName,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        department: department.trim() || 'Staff Member',
        deskLocation: deskLocation.trim(),
        secondAddress: secondAddress.trim() || undefined,
        selectedDays: selectedDaysList,
        mealDaysAllocated: mealDaysTarget,
        hasSelectedMeals: true,
        registeredAt: nowIso,
        updatedAt: nowIso,
      };

      const customerRecord: CustomerRecord = {
        id: customerId,
        corporateId: activeAccount.id,
        fullName: employeeRecord.fullName,
        email: employeeRecord.email,
        phone: employeeRecord.phone,
        company: activeAccount.companyName,
        officeAddress: employeeRecord.deskLocation,
        secondAddress: employeeRecord.secondAddress,
        floorSuite: employeeRecord.deskLocation,
        deliveryArea: activeAccount.deliveryArea || 'Lagos Island',
        notes: `Corporate Employee (${activeAccount.companyName} · ${activeAccount.inviteCode})`,
        status: 'Active',
        paymentStatus: 'Paid',
        planName: `Corporate: ${activeAccount.companyName} (${mealDaysTarget} Days)`,
        totalDays: selectedCount,
        remainingMeals: selectedCount,
        creditsBalance: 0,
        selectedDays: selectedDaysList,
        subtotalNGN: 0,
        discountNGN: 0,
        finalTotalNGN: 0,
        memberCode: activeAccount.inviteCode,
        createdAt: nowIso,
        confirmedAt: nowIso,
        isPasswordSet: true,
        defaultPassword: DEFAULT_SUBSCRIBER_PASSWORD,
        password: DEFAULT_SUBSCRIBER_PASSWORD,
        isDefaultPassword: true,
        mustChangePassword: true,
      };

      const result = await claimCorporateEmployeeSlotAndSave(
        activeAccount,
        employeeRecord,
        customerRecord
      );
      setLiveAccount(result.updatedAccount);

      if (onEmployeeSubmitted) {
        onEmployeeSubmitted(employeeRecord, customerRecord);
      }

      setCreatedEmployee(employeeRecord);
      setStep('confirmed');
    } catch (err: any) {
      if (err?.message === 'CORP_SLOTS_FULL') {
        setSlotsFullState(true);
      } else if (err?.message === 'CORP_PENDING_CONFIRMATION') {
        setFormError('This corporate link is awaiting Admin payment confirmation before slots can be claimed.');
      } else {
        setFormError(err?.message || 'Unable to claim your meal slot. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-6 bg-zinc-900/50 backdrop-blur-xs font-['Poppins'] overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Branded Company Landing Banner — Orange Gradient (Zero Black Cards) */}
        <div className="p-5 sm:p-7 bg-gradient-to-r from-[#FF4C00] via-[#FF5E14] to-[#FF8533] text-white flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-orange-100 font-bold">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>{activeAccount.companyName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{activeAccount.inviteCode}</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
              Welcome, {activeAccount.companyName}!
            </h3>
            <p className="text-xs sm:text-sm text-orange-50 font-medium">
              Select your <strong>{mealDaysTarget} meals</strong> — already paid for by your company (₦0 due)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer shrink-0"
            aria-label="Close invitation page"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-zinc-50">
          {/* GATE A: COMPANY LINK NOT YET CONFIRMED BY ADMIN */}
          {isPendingConfirmation ? (
            <div className="bg-zinc-100 border border-zinc-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-black">
                Company Link Pending Activation
              </h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                <strong>{activeAccount.companyName}</strong>&apos;s meal package is currently awaiting payment verification by 11:12 Food Admin. Please check back once your HR shares confirmation.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : isSlotsExhausted ? (
            /* GATE B: ALL EMPLOYEE SLOTS USED UP */
            <div className="bg-zinc-100 border border-zinc-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFF4ED] to-[#FFE4D1] border border-orange-200 text-[#FF4C00] flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div className="inline-block px-3.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold tabular-nums">
                {usedSlots} / {totalSlots} Slots Used Up
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-black">
                All Meal Slots on This Company Link Are Filled
              </h4>
              <p className="text-sm text-zinc-700 leading-relaxed">
                All <strong>{totalSlots} employee slots</strong> paid for by{' '}
                <strong>{activeAccount.companyName}</strong> have already been claimed. Please contact your Company / HR or the person who sent you this link for assistance.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Return Home
              </button>
            </div>
          ) : (
            <>
              {/* Step & Slot Status Bar (Gray Card) */}
              {step !== 'confirmed' && (
                <div className="bg-zinc-200/80 border border-zinc-300 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${
                        step === 'meals'
                          ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white'
                          : 'bg-white text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      01. Select Your {mealDaysTarget} Meals
                    </span>
                    <span className="text-zinc-400">/</span>
                    <span
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${
                        step === 'details'
                          ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white'
                          : 'bg-white text-zinc-600'
                      }`}
                    >
                      02. Your Details &amp; Delivery
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
                    <span className="px-3 py-1 rounded-full bg-white text-zinc-800 border border-zinc-300">
                      {remainingSlots} of {totalSlots} company slots left
                    </span>
                    <span className="text-[#FF4C00] font-black">
                      {selectedCount} / {mealDaysTarget} Meals
                    </span>
                  </div>
                </div>
              )}

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* STEP 1: MEAL PICKER FIRST */}
              {step === 'meals' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-[#FFF4ED] to-[#FFE7D6] p-4 rounded-2xl border border-orange-200">
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-black">{activeWeek.dateRange}</h4>
                      <p className="text-xs text-zinc-700">
                        Select your preferred meal for up to <strong>{mealDaysTarget} workdays</strong> ({selectedCount}/{mealDaysTarget} chosen)
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoFillRemaining}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white text-xs font-bold cursor-pointer transition whitespace-nowrap shadow-xs"
                      >
                        Auto-Fill {mealDaysTarget} Meals
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDaysMap({})}
                        className="px-3 py-2 rounded-xl bg-white border border-orange-200 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Clear All
                      </button>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentWeekIndex((p) => (p > 0 ? p - 1 : CANONICAL_8_WEEKS_MENU.length - 1))
                          }
                          className="p-2 rounded-xl border border-orange-200 bg-white hover:bg-zinc-100 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentWeekIndex((p) => (p < CANONICAL_8_WEEKS_MENU.length - 1 ? p + 1 : 0))
                          }
                          className="p-2 rounded-xl border border-orange-200 bg-white hover:bg-zinc-100 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Period Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {CANONICAL_8_WEEKS_MENU.map((wk, idx) => (
                      <button
                        key={wk.weekNumber}
                        type="button"
                        onClick={() => setCurrentWeekIndex(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border ${
                          idx === currentWeekIndex
                            ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white border-[#FF4C00]'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {wk.dateRange}
                      </button>
                    ))}
                  </div>

                  {/* Day Cards */}
                  <div className="space-y-3">
                    {activeWeek.days.map((rawDay) => {
                      const canonical = CANONICAL_DATES_MAP[rawDay.dateStr];
                      const override = customMealOverrides[rawDay.dateStr];
                      const opt1 =
                        override?.mealOptions?.[0]?.name ||
                        (override as any)?.option1 ||
                        canonical?.option1 ||
                        rawDay.option1;
                      const opt2 =
                        override?.mealOptions?.[1]?.name ||
                        (override as any)?.option2 ||
                        canonical?.option2 ||
                        rawDay.option2;
                      const isHoliday =
                        override?.isHoliday !== undefined
                          ? Boolean(override.isHoliday || override.isNoDelivery)
                          : Boolean(canonical?.isHoliday ?? rawDay.isHoliday);
                      const holidayName = override?.holidayName || canonical?.holidayName || rawDay.holidayName;

                      const opt1IsSwallow =
                        override?.option1IsSwallow !== undefined
                          ? Boolean(override.option1IsSwallow)
                          : canonical?.option1IsSwallow !== undefined
                            ? Boolean(canonical.option1IsSwallow)
                            : isMealTitleSwallow(opt1);
                      const opt2IsSwallow =
                        override?.option2IsSwallow !== undefined
                          ? Boolean(override.option2IsSwallow)
                          : canonical?.option2IsSwallow !== undefined
                            ? Boolean(canonical.option2IsSwallow)
                            : isMealTitleSwallow(opt2);

                      const dayMenu: CanonicalDayMenu = {
                        ...rawDay,
                        option1: opt1,
                        option2: opt2,
                        option1IsSwallow: opt1IsSwallow,
                        option2IsSwallow: opt2IsSwallow,
                        isHoliday,
                        holidayName,
                      };

                      const selectedItem = selectedDaysMap[dayMenu.dateStr];
                      const selectedOptId = selectedItem?.selectedMealOption?.id;
                      const selectedSwallow = selectedItem?.selectedSwallow || 'Semo';

                      return (
                        <div
                          key={dayMenu.dateStr}
                          className={`p-4 rounded-2xl border transition ${
                            selectedItem
                              ? 'border-[#FF4C00]/60 bg-gradient-to-br from-[#FFF4ED] to-white'
                              : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-1 rounded-lg bg-zinc-200 text-zinc-900 text-xs font-bold">
                                {dayMenu.dayShort}
                              </span>
                              <span className="text-sm font-bold text-black">
                                {dayMenu.dayFull}, {dayMenu.dateFormatted.split(', ')[1]}
                              </span>
                            </div>
                            {isHoliday ? (
                              <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" /> Holiday
                              </span>
                            ) : selectedItem ? (
                              <span className="text-xs font-bold text-emerald-700">
                                Selected ({selectedOptId === 'opt-2' ? 'Option 2' : 'Option 1'})
                              </span>
                            ) : null}
                          </div>

                          {isHoliday ? (
                            <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                              {holidayName || 'Public Holiday (No kitchen delivery)'}
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div
                                onClick={() => handleToggleDayOption(dayMenu, 'opt-1')}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                                  selectedOptId === 'opt-1'
                                    ? 'border-[#FF4C00] bg-white shadow-sm'
                                    : 'border-zinc-200 hover:border-orange-300 bg-zinc-100/70'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                  <span className={selectedOptId === 'opt-1' ? 'text-[#FF4C00]' : 'text-zinc-500'}>
                                    Option 1
                                  </span>
                                  {opt1IsSwallow && <span className="text-amber-700">Swallow</span>}
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-black">{dayMenu.option1}</p>

                                {selectedOptId === 'opt-1' && opt1IsSwallow && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-2 pt-2 border-t border-dashed border-zinc-200 flex items-center gap-1.5 flex-wrap"
                                  >
                                    {(['Eba', 'Semo', 'Fufu'] as SwallowType[]).map((sw) => (
                                      <button
                                        key={sw}
                                        type="button"
                                        onClick={(e) => handleSelectSwallow(dayMenu.dateStr, sw, e)}
                                        className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                                          selectedSwallow === sw
                                            ? 'bg-[#FF4C00] text-white'
                                            : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                                        }`}
                                      >
                                        {sw}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div
                                onClick={() => handleToggleDayOption(dayMenu, 'opt-2')}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                                  selectedOptId === 'opt-2'
                                    ? 'border-[#FF4C00] bg-white shadow-sm'
                                    : 'border-zinc-200 hover:border-orange-300 bg-zinc-100/70'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                  <span className={selectedOptId === 'opt-2' ? 'text-[#FF4C00]' : 'text-zinc-500'}>
                                    Option 2
                                  </span>
                                  {opt2IsSwallow && <span className="text-amber-700">Swallow</span>}
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-black">{dayMenu.option2}</p>

                                {selectedOptId === 'opt-2' && opt2IsSwallow && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-2 pt-2 border-t border-dashed border-zinc-200 flex items-center gap-1.5 flex-wrap"
                                  >
                                    {(['Eba', 'Semo', 'Fufu'] as SwallowType[]).map((sw) => (
                                      <button
                                        key={sw}
                                        type="button"
                                        onClick={(e) => handleSelectSwallow(dayMenu.dateStr, sw, e)}
                                        className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                                          selectedSwallow === sw
                                            ? 'bg-[#FF4C00] text-white'
                                            : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                                        }`}
                                      >
                                        {sw}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Step 1 Footer */}
                  <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-zinc-600 tabular-nums">
                      Selected: <strong className="text-black">{selectedCount}</strong> of {mealDaysTarget} meals
                    </span>
                    <button
                      type="button"
                      onClick={handleProceedToDetails}
                      disabled={selectedCount === 0}
                      className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] disabled:bg-zinc-300 text-white text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <span>Next: Your Details &amp; Delivery</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: EMPLOYEE DETAILS + 2 DELIVERY OPTIONS + FINISH BUTTON */}
              {step === 'details' && (
                <form onSubmit={handleFinishClaimSlot} className="space-y-5 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-8 shadow-xs">
                  <div className="bg-gradient-to-br from-[#FFF4ED] to-[#FFE7D6] border border-orange-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
                        Final Step · Covered by {activeAccount.companyName}
                      </p>
                      <p className="text-sm font-black text-black mt-0.5">
                        {selectedCount} Meal Days Selected · ₦0 Payment Required
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('meals')}
                      className="px-3.5 py-2 rounded-xl bg-white border border-orange-200 text-xs font-bold text-zinc-800 hover:bg-zinc-100 cursor-pointer inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Edit Meals</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Chinedu Okafor"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0803 000 0000"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Work Email *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Department / Role (Optional)</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Operations, Engineering"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* 2 Delivery Options */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Delivery Address Option 1 (Primary Office / Desk Drop) *
                      </label>
                      <input
                        type="text"
                        required
                        value={deskLocation}
                        onChange={(e) => setDeskLocation(e.target.value)}
                        placeholder="Street, Building, Floor & Desk Number"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Delivery Address Option 2 (Alternate Drop Point / Secondary Office)
                      </label>
                      <input
                        type="text"
                        value={secondAddress}
                        onChange={(e) => setSecondAddress(e.target.value)}
                        placeholder="Optional backup office or alternate desk wing"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('meals')}
                      className="w-full sm:w-auto px-5 py-3 rounded-full bg-zinc-200 hover:bg-zinc-300 text-xs font-bold text-zinc-800 cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Meals</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] disabled:bg-zinc-300 text-white text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Claiming Slot &amp; Saving Schedule...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Finish (No Payment Needed)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: CONFIRMED */}
              {step === 'confirmed' && createdEmployee && (
                <div className="bg-zinc-100 border border-zinc-200 rounded-3xl p-6 sm:p-10 text-center space-y-5 max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-black">
                      Slot Claimed &amp; Meals Saved, {createdEmployee.fullName}!
                    </h3>
                    <p className="text-sm text-zinc-600 mt-1">
                      Your {createdEmployee.selectedDays.length} meals under{' '}
                      <strong>{activeAccount.companyName}</strong> are confirmed with zero charge to you.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-zinc-200 text-left text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Company Plan:</span>
                      <span className="font-bold text-black">{activeAccount.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Primary Address:</span>
                      <span className="font-bold text-black">{createdEmployee.deskLocation}</span>
                    </div>
                    {createdEmployee.secondAddress && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Second Address:</span>
                        <span className="font-bold text-zinc-700">{createdEmployee.secondAddress}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Meals Locked In:</span>
                      <span className="font-bold text-emerald-700 tabular-nums">
                        {createdEmployee.selectedDays.length} Deliveries · Paid by Employer
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF4ED] to-[#FFE7D6] border border-orange-200 text-left text-xs space-y-1.5">
                    <div className="font-black text-[#FF4C00] uppercase tracking-wider text-[10px]">
                      Your Dashboard Login Credentials
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Login Email:</span>
                      <span className="font-bold text-black">{createdEmployee.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Default Password:</span>
                      <span className="font-mono font-black text-[#FF4C00]">
                        {DEFAULT_SUBSCRIBER_PASSWORD}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-700 pt-1">
                      Sign in anytime via Log In using this email and default password{' '}
                      <strong>{DEFAULT_SUBSCRIBER_PASSWORD}</strong> to set your own personal password.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                  >
                    Done
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
