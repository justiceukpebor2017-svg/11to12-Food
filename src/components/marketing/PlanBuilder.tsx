import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StructuredMeal,
  SelectedLunchDay,
  SwallowType,
  calculateOrderSummary,
  calculateMealPrice,
  OrderSummary,
  PER_DAY_FEE,
  CorporateAccount,
  OrderSubmission,
} from '../../types';
import { CorporateSubscriptionFlow } from './CorporateSubscriptionFlow';
import {
  getPricingSettings,
  subscribePricingSettings,
  calculateTieredOrderTotal,
  PricingSettings,
} from '../../config/pricingConfig';
import {
  getStructuredMealForDate,
  subscribeMenuChanges,
  CANONICAL_8_WEEKS_MENU,
  CANONICAL_DATES_MAP,
  customMealOverrides,
  CanonicalWeekMenu,
  CanonicalDayMenu,
  parseStructuredMeal,
  isMealTitleSwallow,
} from '../../data/menuRotation';
import { MealOption } from '../../types';
import { LAUNCH_CONFIG, isDateBeforeLaunch } from '../../config/launchConfig';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Utensils,
  Soup,
  Lock,
  Building2,
  CalendarDays,
} from 'lucide-react';

interface MealPopupState {
  meal: StructuredMeal;
  action: 'added' | 'removed';
  formattedDate: string;
}

interface PlanBuilderProps {
  onProceedToCheckout: (selectedDays: SelectedLunchDay[], summary: OrderSummary) => void;
  onOpenEmployeeInvite?: (account: CorporateAccount) => void;
  onCorporateOrderSubmitted?: (order: OrderSubmission) => void;
}

export const PlanBuilder: React.FC<PlanBuilderProps> = ({
  onProceedToCheckout,
  onOpenEmployeeInvite,
  onCorporateOrderSubmitted,
}) => {
  // Package selection gateway: null shows 3 cards; '5-days' | '23-days' opens calendar; 'corporate' opens Your Boss Will Pay
  const [selectedPackage, setSelectedPackage] = useState<'5-days' | '23-days' | 'corporate' | null>(null);
  const targetPackageDays = selectedPackage === '5-days' ? 5 : selectedPackage === '23-days' ? 23 : 0;
  const targetPackagePrice = selectedPackage === '5-days' ? 20000 : selectedPackage === '23-days' ? 70000 : 0;
  // Mobile device viewport detection for mobile-specific Friday swallow popup
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Anchored to official Launch Date (December 2026 by default)
  const [currentYear, setCurrentYear] = useState(LAUNCH_CONFIG.year);
  const [currentMonth, setCurrentMonth] = useState(LAUNCH_CONFIG.monthIndex);
  const [, setMenuUpdateVersion] = useState(0);

  useEffect(() => {
    // Only listen to menu updates; do NOT reset the user's active browsing month
    const unsubMenu = subscribeMenuChanges(() => {
      setMenuUpdateVersion((v) => v + 1);
    });
    return () => {
      unsubMenu();
    };
  }, []);

  // Active Week Index (Week 1 through Week 8: Dec 7, 2026 – Jan 29, 2027)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const activeWeek = CANONICAL_8_WEEKS_MENU[currentWeekIndex] || CANONICAL_8_WEEKS_MENU[0];

  // Map of dateStr -> SelectedLunchDay
  const [selectedDaysMap, setSelectedDaysMap] = useState<Record<string, SelectedLunchDay>>({});
  // Ordered stack of selected dates so most recent selected date is previewed above Live Price Meter
  const [selectionHistory, setSelectionHistory] = useState<string[]>([]);
  // Menu version to trigger immediate re-renders when admin edits food name or image
  const [menuVersion, setMenuVersion] = useState(0);

  useEffect(() => {
    return subscribeMenuChanges(() => {
      setMenuVersion((v) => v + 1);
    });
  }, []);

  // Sync selectedDaysMap whenever custom meal overrides are updated
  useEffect(() => {
    setSelectedDaysMap((prev) => {
      let changed = false;
      const nextMap = { ...prev };
      Object.keys(nextMap).forEach((dStr) => {
        const [y, m, d] = dStr.split('-').map(Number);
        const freshMeal = getStructuredMealForDate(new Date(y, m - 1, d));
        if (freshMeal && nextMap[dStr].meal !== freshMeal) {
          nextMap[dStr] = {
            ...nextMap[dStr],
            meal: freshMeal,
          };
          changed = true;
        }
      });
      return changed ? nextMap : prev;
    });
  }, [menuVersion]);

  // Universal Friday Swallow Popup modal state (Works on both Desktop & Mobile)
  const [swallowModal, setSwallowModal] = useState<{
    meal: StructuredMeal;
    dateFormatted: string;
    isAlreadySelected: boolean;
  } | null>(null);
  const [chosenSwallow, setChosenSwallow] = useState<SwallowType>('Eba');

  // 2-Second Top Floating Meal Preview Popup state
  const [activeMealPopup, setActiveMealPopup] = useState<MealPopupState | null>(null);
  const popupTimeoutRef = useRef<number | null>(null);

  // Calculation Modal & Animation State
  const [showOrderBill, setShowOrderBill] = useState(false);
  const [calculatedSummary, setCalculatedSummary] = useState<OrderSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Price-reveal animation states (Rule 6, 7, 8, 9)
  const [displayedPrice, setDisplayedPrice] = useState<number>(0);
  const [isAnimationRunning, setIsAnimationRunning] = useState(false);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const billSectionRef = useRef<HTMLDivElement | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Specific rule: Currently, only December 2026 (month 11) and January 2027 (month 0) have menus
  const hasMenu = (currentYear === 2026 && currentMonth === 11) || (currentYear === 2027 && currentMonth === 0);

  // Quick navigation tabs for seamless month jumping
  const navigationMonths = useMemo(() => {
    return [
      { year: 2026, month: 10, label: 'Nov 2026' },
      { year: 2026, month: 11, label: 'Dec 2026 (Menu Set)' },
      { year: 2027, month: 0, label: 'Jan 2027 (Menu Set)' },
      { year: 2027, month: 1, label: 'Feb 2027' },
      { year: 2027, month: 2, label: 'Mar 2027' },
      { year: 2027, month: 3, label: 'Apr 2027' },
    ];
  }, []);

  // Free month navigation - allows user to go to any month forward or backward
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

  // Generate calendar days for current month grid (Monday to Sunday - Worldwide standard)
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = useMemo(() => {
    const cells: {
      dayNumber: number;
      isCurrentMonth: boolean;
      date: Date;
      dateStr: string;
      isWeekend: boolean;
      isBeforeLaunch: boolean;
      meal: StructuredMeal | null;
    }[] = [];

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
      const cellHasMenu =
        (date.getFullYear() === 2026 && date.getMonth() === 11) ||
        (date.getFullYear() === 2027 && date.getMonth() === 0);
      cells.push({
        dayNumber: d,
        isCurrentMonth: true,
        date,
        dateStr,
        isWeekend,
        isBeforeLaunch: isDateBeforeLaunch(date),
        meal: isWeekend || !cellHasMenu ? null : getStructuredMealForDate(date),
      });
    }

    // Next month padding to fill grid
    const remainingCells = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let d = 1; d <= remainingCells; d++) {
      const date = new Date(currentYear, currentMonth + 1, d);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${mm}-${dd}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const cellHasMenu =
        (date.getFullYear() === 2026 && date.getMonth() === 11) ||
        (date.getFullYear() === 2027 && date.getMonth() === 0);
      cells.push({
        dayNumber: d,
        isCurrentMonth: false,
        date,
        dateStr,
        isWeekend,
        isBeforeLaunch: isDateBeforeLaunch(date),
        meal: isWeekend || !cellHasMenu ? null : getStructuredMealForDate(date),
      });
    }

    return cells;
  }, [currentYear, currentMonth, firstDayIndex, prevMonthDays, totalDaysInMonth, menuVersion]);

  // Clean animation frame & popup timer on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  // Helper to determine if meal is Friday or Swallow meal
  const isFridayOrSwallowMeal = (meal: StructuredMeal) => {
    return (
      meal.day === 'Friday' ||
      meal.mealCategory === 'Swallow' ||
      Boolean(meal.swallowOptions && meal.swallowOptions.length > 0) ||
      (meal.mealName || '').toLowerCase().includes('swallow') ||
      (meal.mealName || '').toLowerCase().includes('egusi')
    );
  };

  const handleOpenSwallowModal = (meal: StructuredMeal, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dateObj = new Date(meal.dateStr + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    const currentSelected = selectedDaysMap[meal.dateStr];
    setChosenSwallow(currentSelected?.selectedSwallow || 'Semo');
    setSwallowModal({
      meal,
      dateFormatted: formattedDate,
      isAlreadySelected: Boolean(currentSelected),
    });
  };

  const handleConfirmSwallow = () => {
    if (!swallowModal) return;
    const { meal, dateFormatted } = swallowModal;

    setSelectedDaysMap((prev) => ({
      ...prev,
      [meal.dateStr]: {
        dateStr: meal.dateStr,
        meal,
        selectedSwallow: chosenSwallow,
      },
    }));

    // Add to selection history as most recent selected date
    setSelectionHistory((prev) => [...prev.filter((d) => d !== meal.dateStr), meal.dateStr]);

    setValidationError(null);

    // Show floating top popup displaying confirmed swallow
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    setActiveMealPopup({
      meal: {
        ...meal,
        mealName: `${meal.mealName.split('(')[0].trim()} (${chosenSwallow})`,
      },
      action: 'added',
      formattedDate: dateFormatted,
    });
    popupTimeoutRef.current = window.setTimeout(() => {
      setActiveMealPopup(null);
    }, 2500);

    // Reset calculation if active
    if (showOrderBill || calculatedSummary) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setShowOrderBill(false);
      setCalculatedSummary(null);
      setIsAnimationRunning(false);
      setIsRevealComplete(false);
      setIsCalculating(false);
    }

    setSwallowModal(null);
  };

  const handleRemoveSwallowDay = () => {
    if (!swallowModal) return;
    const { meal } = swallowModal;
    setSelectedDaysMap((prev) => {
      const copy = { ...prev };
      delete copy[meal.dateStr];
      return copy;
    });
    setSelectionHistory((prev) => prev.filter((d) => d !== meal.dateStr));
    setSwallowModal(null);
  };

  // Toggle selection for a workday meal
  const toggleSelectMeal = (meal: StructuredMeal) => {
    if (meal.isHoliday || meal.isNoDelivery) return;

    // Friday / swallow popup requirement: On BOTH desktop and mobile, show popup to choose swallow
    const isSwallowOrFriday = isFridayOrSwallowMeal(meal);

    if (isSwallowOrFriday) {
      const isCurrentlySelected = Boolean(selectedDaysMap[meal.dateStr]);
      if (!isCurrentlySelected) {
        // Trigger popup to allow user pick a swallow then confirm
        handleOpenSwallowModal(meal);
        return;
      }
    }

    const isCurrentlySelected = Boolean(selectedDaysMap[meal.dateStr]);
    const action: 'added' | 'removed' = isCurrentlySelected ? 'removed' : 'added';

    // Maintain ordered stack of selected dates for live preview above price meter
    if (isCurrentlySelected) {
      setSelectionHistory((prev) => prev.filter((d) => d !== meal.dateStr));
    } else {
      setSelectionHistory((prev) => [...prev.filter((d) => d !== meal.dateStr), meal.dateStr]);
    }

    setSelectedDaysMap((prev) => {
      const copy = { ...prev };
      if (copy[meal.dateStr]) {
        delete copy[meal.dateStr];
      } else {
        copy[meal.dateStr] = {
          dateStr: meal.dateStr,
          meal,
          selectedSwallow: isSwallowOrFriday ? 'Semo' : undefined,
        };
      }
      return copy;
    });

    setValidationError(null);

    // Show floating top popup displaying the meal for this day, fading out in 2 seconds
    const dateObj = new Date(meal.dateStr + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }

    setActiveMealPopup({
      meal,
      action,
      formattedDate,
    });

    popupTimeoutRef.current = window.setTimeout(() => {
      setActiveMealPopup(null);
    }, 2000);

    // Rule 14: If customer changes their selected dates:
    // Clear previous calculated result and reset animation state
    if (showOrderBill || calculatedSummary) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setShowOrderBill(false);
      setCalculatedSummary(null);
      setIsAnimationRunning(false);
      setIsRevealComplete(false);
      setIsCalculating(false);
    }
  };

  // Change swallow choice for a swallow meal
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

    // Also display the meal with updated swallow choice in the top popup for 2 seconds
    const dateObj = new Date(dateStr + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    const currentMeal = selectedDaysMap[dateStr]?.meal || getStructuredMealForDate(dateObj);
    if (currentMeal) {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      setActiveMealPopup({
        meal: {
          ...currentMeal,
          mealName: `${currentMeal.mealName.split('(')[0].trim()} (Swallow: ${swallow})`,
        },
        action: 'added',
        formattedDate,
      });
      popupTimeoutRef.current = window.setTimeout(() => {
        setActiveMealPopup(null);
      }, 2000);
    }
  };

  // Select all deliverable workdays in current month
  const selectAllWorkdaysThisMonth = () => {
    if (!hasMenu) return;
    const deliverableWorkdays = calendarDays
      .filter((cell) => cell.isCurrentMonth && !cell.isWeekend && cell.meal && !cell.meal.isHoliday && !cell.meal.isNoDelivery)
      .map((cell) => cell.dateStr);

    setSelectedDaysMap((prev) => {
      const copy = { ...prev };
      calendarDays.forEach((cell) => {
        if (cell.isCurrentMonth && !cell.isWeekend && cell.meal && !cell.meal.isHoliday && !cell.meal.isNoDelivery) {
          copy[cell.dateStr] = {
            dateStr: cell.dateStr,
            meal: cell.meal,
            selectedSwallow: cell.meal.mealCategory === 'Swallow' ? 'Semo' : undefined,
          };
        }
      });
      return copy;
    });

    setSelectionHistory((prev) => [...prev.filter((d) => !deliverableWorkdays.includes(d)), ...deliverableWorkdays]);
    setValidationError(null);
    setShowOrderBill(false);
    setCalculatedSummary(null);
    setIsRevealComplete(false);
  };

  const clearAllSelected = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setSelectedDaysMap({});
    setSelectionHistory([]);
    setShowOrderBill(false);
    setCalculatedSummary(null);
    setIsRevealComplete(false);
    setIsAnimationRunning(false);
    setIsCalculating(false);
    setValidationError(null);
  };

  const prevWeek = () => {
    setCurrentWeekIndex((prev) => (prev > 0 ? prev - 1 : CANONICAL_8_WEEKS_MENU.length - 1));
  };

  const nextWeek = () => {
    setCurrentWeekIndex((prev) => (prev < CANONICAL_8_WEEKS_MENU.length - 1 ? prev + 1 : 0));
  };

  // Handle package selection from the 3-card overview
  const handleChoosePackage = (pkg: '5-days' | '23-days' | 'corporate') => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setValidationError(null);
    setShowOrderBill(false);
    setCalculatedSummary(null);
    setIsRevealComplete(false);
    setIsAnimationRunning(false);
    setIsCalculating(false);

    if (pkg === '5-days' || pkg === '23-days') {
      const limit = pkg === '5-days' ? 5 : 23;
      setSelectedDaysMap((prev) => {
        const keys = Object.keys(prev).sort();
        if (keys.length <= limit) return prev;
        const trimmed: Record<string, SelectedLunchDay> = {};
        keys.slice(0, limit).forEach((k) => {
          trimmed[k] = prev[k];
        });
        return trimmed;
      });
      setSelectionHistory((prev) => prev.slice(-limit));
    }

    setSelectedPackage(pkg);
  };

  const handleGoBackToPlans = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setShowOrderBill(false);
    setCalculatedSummary(null);
    setIsRevealComplete(false);
    setIsAnimationRunning(false);
    setIsCalculating(false);
    setValidationError(null);
    setSelectedPackage(null);
    if (typeof window !== 'undefined') {
      const el = document.getElementById('plan-builder') || document.getElementById('pricing');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toggle or pick Option 1 / Option 2 for a canonical workday
  const handleSelectDayOption = (dayMenu: CanonicalDayMenu, optionId: 'opt-1' | 'opt-2') => {
    if (dayMenu.isHoliday) return;
    const targetOptionName = optionId === 'opt-1' ? dayMenu.option1 : dayMenu.option2;
    const targetParsed = parseStructuredMeal(targetOptionName, dayMenu.dayFull, dayMenu.dateStr);
    const isSwallowMeal = optionId === 'opt-1'
      ? (dayMenu.option1IsSwallow !== undefined ? Boolean(dayMenu.option1IsSwallow) : (targetParsed.mealCategory === 'Swallow' || isMealTitleSwallow(targetOptionName)))
      : (dayMenu.option2IsSwallow !== undefined ? Boolean(dayMenu.option2IsSwallow) : (targetParsed.mealCategory === 'Swallow' || isMealTitleSwallow(targetOptionName)));

    const currentlySelected = selectedDaysMap[dayMenu.dateStr];

    // If already selected with this EXACT option, deselect this day
    if (currentlySelected && currentlySelected.selectedMealOption?.id === optionId) {
      setSelectedDaysMap((prev) => {
        const copy = { ...prev };
        delete copy[dayMenu.dateStr];
        return copy;
      });
      setSelectionHistory((prev) => prev.filter((d) => d !== dayMenu.dateStr));
      setValidationError(null);
      setActiveMealPopup({
        meal: currentlySelected.meal,
        action: 'removed',
        formattedDate: dayMenu.dateFormatted,
      });
      return;
    }

    // Enforce selected package day limit when adding a new date
    const activeCount = Object.keys(selectedDaysMap).length;
    if (!currentlySelected && targetPackageDays > 0 && activeCount >= targetPackageDays) {
      setValidationError(
        `Your ${targetPackageDays}-day meal package is full (${targetPackageDays}/${targetPackageDays} days chosen). Deselect a day first to swap, or click Calculate Order.`
      );
      return;
    }

    // Otherwise, select or switch to this option
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

    const chosenMealOpt: MealOption = {
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
        selectedMealOption: chosenMealOpt,
        selectedSwallow: isSwallowMeal ? defaultSwallow : undefined,
      },
    }));

    setSelectionHistory((prev) => [...prev.filter((d) => d !== dayMenu.dateStr), dayMenu.dateStr]);
    setValidationError(null);

    setActiveMealPopup({
      meal: mealObj,
      action: 'added',
      formattedDate: dayMenu.dateFormatted,
    });

    if (showOrderBill || calculatedSummary) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setShowOrderBill(false);
      setCalculatedSummary(null);
      setIsAnimationRunning(false);
      setIsRevealComplete(false);
      setIsCalculating(false);
    }
  };

  const handleSelectDaySwallow = (dateStr: string, swallow: SwallowType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const selectAllThisWeek = () => {
    const currentWeek = CANONICAL_8_WEEKS_MENU[currentWeekIndex];
    if (!currentWeek) return;
    const limit = targetPackageDays || 40;
    const addedDates: string[] = [];

    setSelectedDaysMap((prev) => {
      const copy = { ...prev };
      let currentTotal = Object.keys(copy).length;

      for (const dayMenu of currentWeek.days) {
        if (currentTotal >= limit) break;
        if (dayMenu.isHoliday || copy[dayMenu.dateStr]) continue;

        const canonical = CANONICAL_DATES_MAP[dayMenu.dateStr];
        const override = customMealOverrides[dayMenu.dateStr];
        const opt1 = override?.mealOptions?.[0]?.name || (override as any)?.option1 || canonical?.option1 || dayMenu.option1;
        const opt2 = override?.mealOptions?.[1]?.name || (override as any)?.option2 || canonical?.option2 || dayMenu.option2;

        const parsed = parseStructuredMeal(opt1, dayMenu.dayFull, dayMenu.dateStr);
        const isSwallow = isFridayOrSwallowMeal(parsed);
        copy[dayMenu.dateStr] = {
          dateStr: dayMenu.dateStr,
          meal: {
            ...parsed,
            mealName: opt1,
            hasDualOptions: true,
            mealOptions: [
              { id: 'opt-1', name: opt1, category: parsed.mealCategory, description: 'Option 1' },
              {
                id: 'opt-2',
                name: opt2,
                category: parseStructuredMeal(opt2, dayMenu.dayFull, dayMenu.dateStr).mealCategory,
                description: 'Option 2',
              },
            ],
            selectedOptionId: 'opt-1',
          },
          selectedMealOption: {
            id: 'opt-1',
            name: opt1,
            category: parsed.mealCategory,
            description: 'Option 1',
          },
          selectedSwallow: isSwallow ? 'Semo' : undefined,
        };
        addedDates.push(dayMenu.dateStr);
        currentTotal += 1;
      }
      return copy;
    });

    if (addedDates.length > 0) {
      setSelectionHistory((prev) => [...prev.filter((d) => !addedDates.includes(d)), ...addedDates].slice(-limit));
    }
    setValidationError(null);
    setShowOrderBill(false);
    setCalculatedSummary(null);
    setIsRevealComplete(false);
  };

  const autoFillPackageDays = () => {
    const limit = targetPackageDays || 23;
    const filledDates: string[] = [];

    setSelectedDaysMap((prev) => {
      const copy = { ...prev };
      let currentTotal = Object.keys(copy).length;

      for (const week of CANONICAL_8_WEEKS_MENU) {
        for (const dayMenu of week.days) {
          if (currentTotal >= limit) break;
          const canonical = CANONICAL_DATES_MAP[dayMenu.dateStr];
          const override = customMealOverrides[dayMenu.dateStr];
          const isHoliday =
            override?.isHoliday !== undefined
              ? Boolean(override.isHoliday || override.isNoDelivery)
              : Boolean(canonical?.isHoliday ?? dayMenu.isHoliday);
          if (isHoliday || copy[dayMenu.dateStr]) continue;

          const opt1 = override?.mealOptions?.[0]?.name || (override as any)?.option1 || canonical?.option1 || dayMenu.option1;
          const opt2 = override?.mealOptions?.[1]?.name || (override as any)?.option2 || canonical?.option2 || dayMenu.option2;

          const parsed = parseStructuredMeal(opt1, dayMenu.dayFull, dayMenu.dateStr);
          const isSwallow = isFridayOrSwallowMeal(parsed);
          copy[dayMenu.dateStr] = {
            dateStr: dayMenu.dateStr,
            meal: {
              ...parsed,
              mealName: opt1,
              hasDualOptions: true,
              mealOptions: [
                { id: 'opt-1', name: opt1, category: parsed.mealCategory, description: 'Option 1' },
                {
                  id: 'opt-2',
                  name: opt2,
                  category: parseStructuredMeal(opt2, dayMenu.dayFull, dayMenu.dateStr).mealCategory,
                  description: 'Option 2',
                },
              ],
              selectedOptionId: 'opt-1',
            },
            selectedMealOption: {
              id: 'opt-1',
              name: opt1,
              category: parsed.mealCategory,
              description: 'Option 1',
            },
            selectedSwallow: isSwallow ? 'Semo' : undefined,
          };
          filledDates.push(dayMenu.dateStr);
          currentTotal += 1;
        }
        if (currentTotal >= limit) break;
      }
      return copy;
    });

    if (filledDates.length > 0) {
      setSelectionHistory((prev) => [...prev.filter((d) => !filledDates.includes(d)), ...filledDates].slice(-limit));
    }
    setValidationError(null);
    setShowOrderBill(false);
    setCalculatedSummary(null);
    setIsRevealComplete(false);
  };

  const getSelectedCountForWeek = (week: CanonicalWeekMenu) => {
    return week.days.filter((d) => !d.isHoliday && Boolean(selectedDaysMap[d.dateStr])).length;
  };

  const isCurrentMonthPreLaunch =
    currentYear < LAUNCH_CONFIG.year ||
    (currentYear === LAUNCH_CONFIG.year && currentMonth < LAUNCH_CONFIG.monthIndex);

  // Sorted list of selected days (only deliverable days without holidays)
  const selectedDaysList = useMemo(() => {
    return (Object.values(selectedDaysMap) as SelectedLunchDay[])
      .filter((d) => !d.meal.isHoliday && !d.meal.isNoDelivery)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [selectedDaysMap]);

  const selectedCount = selectedDaysList.length;

  // Active Preview Day: The most recent selected date in selectionHistory that is still selected
  const activePreviewDateStr = useMemo(() => {
    for (let i = selectionHistory.length - 1; i >= 0; i--) {
      const d = selectionHistory[i];
      if (selectedDaysMap[d]) {
        return d;
      }
    }
    const remaining = Object.keys(selectedDaysMap);
    return remaining.length > 0 ? remaining[remaining.length - 1] : null;
  }, [selectionHistory, selectedDaysMap]);

  const activePreviewDayItem = activePreviewDateStr ? selectedDaysMap[activePreviewDateStr] : null;

  const activePreviewMeal = useMemo(() => {
    if (!activePreviewDateStr) return null;
    const dayItem = selectedDaysMap[activePreviewDateStr];
    if (dayItem?.meal) return dayItem.meal;
    const [y, m, d] = activePreviewDateStr.split('-').map(Number);
    return getStructuredMealForDate(new Date(y, m - 1, d));
  }, [activePreviewDateStr, selectedDaysMap, menuVersion]);

  const activePreviewSwallow = activePreviewDateStr ? selectedDaysMap[activePreviewDateStr]?.selectedSwallow : undefined;

  const activePreviewFormattedDate = useMemo(() => {
    if (!activePreviewDateStr) return '';
    const [y, m, d] = activePreviewDateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [activePreviewDateStr]);

  const [pricingSettings, setPricingSettings] = useState<PricingSettings>(() => getPricingSettings());

  useEffect(() => {
    return subscribePricingSettings((cfg) => {
      setPricingSettings(cfg);
    });
  }, []);

  const tieredPricing = useMemo(() => {
    return calculateTieredOrderTotal(selectedCount, pricingSettings);
  }, [selectedCount, pricingSettings]);

  const verticalProgressPercent = useMemo(() => {
    const goal = targetPackageDays || 23;
    if (selectedCount <= 0) return 0;
    return Math.min(100, Math.round((selectedCount / goal) * 100));
  }, [selectedCount, targetPackageDays]);

  const handleQuickPayNow = () => {
    const minReq = targetPackageDays || 5;
    if (selectedCount < minReq) return;
    const summary = calculateOrderSummary(selectedDaysList);
    onProceedToCheckout(selectedDaysList, summary);
  };

  // Rule 5, 6, 7, 8, 9, 10, 11:
  // Calculate Order Button with dynamic downward animation from ~1.35x to actual Final Total
  const handleCalculateOrder = () => {
    const reqDays = targetPackageDays || 5;
    if (selectedCount < reqDays) {
      setValidationError(
        `Please select ${reqDays - selectedCount} more ${reqDays - selectedCount === 1 ? 'day' : 'days'} to complete your ${reqDays}-day package (₦${(targetPackagePrice || 20000).toLocaleString()}).`
      );
      setShowOrderBill(false);
      return;
    }

    setValidationError(null);
    setIsCalculating(true);
    setIsRevealComplete(false);

    // Step 1 - 8: Calculate real final total as single source of truth
    const summary = calculateOrderSummary(selectedDaysList);
    setCalculatedSummary(summary);

    // Rule 7: Dynamic start: round(Final Total * 1.35) to clean 100s
    const realFinalTotal = summary.finalTotalNGN;
    const rawStart = Math.round(realFinalTotal * 1.35);
    const animationStart = Math.ceil(rawStart / 100) * 100;

    setDisplayedPrice(animationStart);
    setShowOrderBill(true);

    // Smooth scroll to bill section
    setTimeout(() => {
      if (billSectionRef.current) {
        billSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Stage 1 -> Stage 2 -> Stage 3 sequence:
    // Brief button loading state (350ms), then launch smooth 1.4s downward price reduction
    setTimeout(() => {
      setIsCalculating(false);
      setIsAnimationRunning(true);

      const animationDuration = 1400; // 1.4 seconds (within 1.2-1.8s recommendation)
      const startTime = performance.now();

      const animateDown = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / animationDuration);

        // Cubic ease-out curve for natural deceleration as it nears the real price
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentPrice = Math.round(animationStart - (animationStart - realFinalTotal) * easeOut);

        // Round to nearest 100 during intermediate steps for clean appearance
        if (progress < 1) {
          const roundedIntermediate = Math.round(currentPrice / 100) * 100;
          setDisplayedPrice(Math.max(realFinalTotal, roundedIntermediate));
          animationFrameRef.current = requestAnimationFrame(animateDown);
        } else {
          // Exact final total reached
          setDisplayedPrice(realFinalTotal);
          setIsAnimationRunning(false);
          setIsRevealComplete(true);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateDown);
    }, 400);
  };

  const handleProceedToPayout = () => {
    if (!calculatedSummary) return;
    onProceedToCheckout(selectedDaysList, calculatedSummary);
  };

  return (
    <section id="pricing" className="py-20 bg-zinc-100 border-t border-zinc-200 relative">
      <div id="menu" className="scroll-mt-24" />
      <div id="plan-builder" className="scroll-mt-24" />
      
      {/* 2-Second Floating Top Meal Preview Popup with Smooth Fade Out */}
      {activeMealPopup && (
        <div
          key={`${activeMealPopup.meal.dateStr}-${activeMealPopup.action}-${activeMealPopup.meal.mealName}`}
          className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-md sm:max-w-xl rounded-2xl sm:rounded-3xl border shadow-2xl p-4 sm:p-5 backdrop-blur-md font-['Poppins'] animate-in fade-in slide-in-from-top-4 duration-300 ${
            activeMealPopup.action === 'added'
              ? 'bg-zinc-950/95 text-white border-[#FF4C00]/40 shadow-orange-500/10'
              : 'bg-zinc-900/95 text-zinc-200 border-zinc-700/80 shadow-black/40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                activeMealPopup.action === 'added'
                  ? 'bg-[#FF4C00] text-white border-[#FF4C00]/50 shadow-md shadow-[#FF4C00]/25'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {activeMealPopup.action === 'added' ? (
                <Utensils className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400">
                    {activeMealPopup.formattedDate}
                  </span>
                  <span
                    className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      activeMealPopup.action === 'added'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {activeMealPopup.action === 'added' ? '✓ Added to Plan' : 'Removed from Plan'}
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={() => setActiveMealPopup(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer shrink-0"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug break-words">
                {activeMealPopup.meal.mealName}
              </h4>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-300">
                {activeMealPopup.meal.mealCategory && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/90">
                    {activeMealPopup.meal.mealCategory}
                  </span>
                )}
                {activeMealPopup.meal.protein && (
                  <span className="truncate">Protein: <strong className="text-white">{activeMealPopup.meal.protein}</strong></span>
                )}
                {activeMealPopup.meal.soup && (
                  <span className="truncate">• Soup: <strong className="text-white">{activeMealPopup.meal.soup}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 w-full bg-white/10 h-0.5 rounded-full overflow-hidden">
            <div
              className={`h-full animate-shrink-width ${
                activeMealPopup.action === 'added' ? 'bg-[#FF4C00]' : 'bg-zinc-500'
              }`}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black mt-1">
            Build Your Lunch Plan
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 font-medium mt-2">
            {selectedPackage === null
              ? 'Choose a meal package below to select your delivery days and daily meals.'
              : selectedPackage === 'corporate'
              ? 'Company meal subscriptions for teams of 2 to 500+ office employees.'
              : `Select your ${targetPackageDays} delivery days and preferred daily meal options.`}
          </p>
        </div>

        {/* STAGE 1: 3-CARD PACKAGE SELECTOR (Calendar hidden until a package is clicked) */}
        {selectedPackage === null && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: 5 Days Meal Package (White + Light Orange surface) */}
            <div
              onClick={() => handleChoosePackage('5-days')}
              className="group bg-gradient-to-br from-white via-[#FFF9F4] to-[#FFE7D6] border border-orange-200 hover:border-[#FF4C00] rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all cursor-pointer shadow-sm hover:shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#FF4C00]/15 text-[#FF4C00] flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-600 tabular-nums">5 Workdays</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-black leading-tight">
                    5 Days Meal Package
                  </h3>
                  <div className="text-3xl sm:text-4xl font-black text-[#FF4C00] mt-2 tabular-nums">
                    ₦20,000
                  </div>
                </div>

                <p className="text-sm text-zinc-700 leading-relaxed">
                  Select any five available days on the calendar and choose one meal for each date.
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-orange-200/70">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoosePackage('5-days');
                  }}
                  className="w-full py-3.5 px-5 rounded-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap shadow-sm"
                >
                  <span>Select 5 Days Package</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Card 2: 23 Days Meal Package (Orange Gradient Hero Card) */}
            <div
              onClick={() => handleChoosePackage('23-days')}
              className="group bg-gradient-to-br from-[#FF4C00] via-[#FF5E14] to-[#FF8533] text-white border-2 border-[#FF4C00] hover:border-orange-300 rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all cursor-pointer shadow-lg hover:shadow-2xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-orange-100 tabular-nums">23 Workdays · Best Value</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    23 Days Meal Package
                  </h3>
                  <div className="text-3xl sm:text-4xl font-black text-white mt-2 tabular-nums">
                    ₦70,000
                  </div>
                </div>

                <p className="text-sm text-orange-50 leading-relaxed">
                  Select any 23 available delivery days and choose your preferred meal for each date.
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-white/25">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoosePackage('23-days');
                  }}
                  className="w-full py-3.5 px-5 rounded-full bg-white hover:bg-orange-50 text-[#FF4C00] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap shadow-md"
                >
                  <span>Select 23 Days Package</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Card 3: Your Boss Will Pay (Gray Card — Zero Black) */}
            <div
              onClick={() => handleChoosePackage('corporate')}
              className="group bg-zinc-200 text-[#1A1A1A] border border-zinc-300 hover:border-[#FF4C00] rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all cursor-pointer shadow-lg hover:shadow-2xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-white text-[#FF4C00] flex items-center justify-center shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#FF4C00]">For Teams</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-black leading-tight">
                    Your Boss Will Pay
                  </h3>
                  <div className="text-lg sm:text-xl font-bold text-zinc-700 mt-2">
                    Corporate Meal Subscription
                  </div>
                </div>

                <p className="text-sm text-zinc-600 leading-relaxed">
                  Companies purchase meal subscriptions for employees, generate a unique invite link, and track team meal picks effortlessly.
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-zinc-300">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoosePackage('corporate');
                  }}
                  className="w-full py-3.5 px-5 rounded-full bg-white hover:bg-gradient-to-r hover:from-[#FF4C00] hover:to-[#FF6E24] text-[#1A1A1A] hover:text-white border border-zinc-300 hover:border-[#FF4C00] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <span>Explore Corporate Plan</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2A: CORPORATE SUBSCRIPTION FLOW (YOUR BOSS WILL PAY) */}
        {selectedPackage === 'corporate' && (
          <CorporateSubscriptionFlow
            onBackToPackages={handleGoBackToPlans}
            onOpenEmployeeInvite={(acct) => {
              if (onOpenEmployeeInvite) onOpenEmployeeInvite(acct);
            }}
            onCorporateOrderSubmitted={onCorporateOrderSubmitted}
          />
        )}

        {/* STAGE 2B: CALENDAR FOR 5-DAY OR 23-DAY MEAL PACKAGE */}
        {(selectedPackage === '5-days' || selectedPackage === '23-days') && (
          <>
            {/* Top Package Bar with Prominent Go Back Action (Gray Card — Zero Black) */}
            <div className="bg-zinc-200 text-[#1A1A1A] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-md border border-zinc-300">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleGoBackToPlans}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FF4C00] text-black hover:text-white border border-zinc-300 text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Go Back</span>
                </button>
                <div>
                  <h3 className="text-base sm:text-xl font-black text-black">
                    {selectedPackage === '5-days' ? '5 Days Meal Package · ₦20,000' : '23 Days Meal Package · ₦70,000'}
                  </h3>
                  <p className="text-xs text-zinc-600 font-medium">
                    Choose any {targetPackageDays} available dates or go back to select a different plan
                  </p>
                </div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white text-xs sm:text-sm font-black tabular-nums self-start sm:self-auto shrink-0">
                {selectedCount} / {targetPackageDays} Days Selected
              </div>
            </div>

        {/* 8-Week Selection Tabs Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 px-1 no-scrollbar">
            {CANONICAL_8_WEEKS_MENU.map((week, idx) => {
              const isCurrent = currentWeekIndex === idx;
              const weekSelectedCount = getSelectedCountForWeek(week);
              const deliverableDaysCount = week.days.filter((d) => !d.isHoliday).length;
              return (
                <button
                  key={week.weekNumber}
                  type="button"
                  onClick={() => setCurrentWeekIndex(idx)}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white border-[#FF4C00] shadow-md scale-[1.02]'
                      : 'bg-white text-zinc-800 border-zinc-200 hover:border-orange-300 hover:bg-[#FFF4ED]'
                  }`}
                >
                  <span className="font-black text-xs sm:text-sm tracking-tight">{week.dateRange}</span>
                  {weekSelectedCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isCurrent ? 'bg-black/25 text-white' : 'bg-[#FF4C00]/15 text-[#FF4C00]'
                    }`}>
                      {weekSelectedCount}/{deliverableDaysCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Meal Selection Container */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-3 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Week-by-Week Workdays Selection */}
            <div className="lg:col-span-8">
              {/* For only mobile version: Calculate Order button above header */}
              <div id="mobile-calculate-order-btn" className="block md:hidden mb-4">
                <div className="bg-[#FAF7F2] border border-zinc-200/90 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <span className="text-xs font-black text-black tabular-nums">
                      {selectedCount} / {targetPackageDays} days selected
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      selectedCount < targetPackageDays ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {selectedCount < targetPackageDays ? `Need ${targetPackageDays - selectedCount} More` : 'Ready'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCalculateOrder}
                    disabled={isCalculating || isAnimationRunning || selectedCount < targetPackageDays}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm active:scale-95 flex items-center justify-center space-x-2 ${
                      selectedCount < targetPackageDays
                        ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        : 'bg-black hover:bg-zinc-800 text-white cursor-pointer shadow-md'
                    }`}
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Calculating...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {selectedCount < targetPackageDays
                            ? `Select ${targetPackageDays} Days (${selectedCount}/${targetPackageDays})`
                            : 'Calculate Order'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {validationError && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-2 text-center">
                      {validationError}
                    </p>
                  )}
                </div>
              </div>

              {/* Active Period Header & Quick Selection Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-zinc-150">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FF4C00]/10 flex items-center justify-center text-[#FF4C00] shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg sm:text-xl font-black text-black tracking-tight">
                        {activeWeek.dateRange}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      Select Option 1 or Option 2 for each workday delivery
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllThisWeek}
                    className="text-xs font-bold text-[#FF4C00] hover:text-[#E04300] hover:underline cursor-pointer px-2 py-1"
                  >
                    Select This Period
                  </button>
                  <span className="text-zinc-300 hidden sm:inline">•</span>
                  <button
                    type="button"
                    onClick={autoFillPackageDays}
                    className="text-xs font-bold text-zinc-700 hover:text-black cursor-pointer px-2 py-1"
                  >
                    Auto-Fill {targetPackageDays} Days
                  </button>
                  <span className="text-zinc-300 hidden sm:inline">•</span>
                  <button
                    type="button"
                    onClick={clearAllSelected}
                    className="text-xs font-medium text-zinc-400 hover:text-zinc-600 cursor-pointer px-2 py-1"
                  >
                    Clear All
                  </button>
                  <div className="flex items-center space-x-1 pl-1">
                    <button
                      type="button"
                      onClick={prevWeek}
                      className="p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                      title="Previous Period"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextWeek}
                      className="p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                      title="Next Period"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day Cards List (Monday through Friday) */}
              <div className="space-y-4">
                {activeWeek.days.map((rawDay) => {
                  const canonical = CANONICAL_DATES_MAP[rawDay.dateStr];
                  const override = customMealOverrides[rawDay.dateStr];
                  const opt1Name = override?.mealOptions?.[0]?.name || (override as any)?.option1 || canonical?.option1 || rawDay.option1;
                  const opt2Name = override?.mealOptions?.[1]?.name || (override as any)?.option2 || canonical?.option2 || rawDay.option2;
                  const isHoliday = override?.isHoliday !== undefined ? Boolean(override.isHoliday || override.isNoDelivery) : Boolean(canonical?.isHoliday ?? rawDay.isHoliday);
                  const holidayName = override?.holidayName || canonical?.holidayName || rawDay.holidayName;

                  const opt1IsSwallow = override?.option1IsSwallow !== undefined
                    ? Boolean(override.option1IsSwallow)
                    : (canonical?.option1IsSwallow !== undefined ? Boolean(canonical.option1IsSwallow) : isMealTitleSwallow(opt1Name));
                  const opt2IsSwallow = override?.option2IsSwallow !== undefined
                    ? Boolean(override.option2IsSwallow)
                    : (canonical?.option2IsSwallow !== undefined ? Boolean(canonical.option2IsSwallow) : isMealTitleSwallow(opt2Name));

                  const dayMenu: CanonicalDayMenu = {
                    ...rawDay,
                    option1: opt1Name,
                    option2: opt2Name,
                    option1IsSwallow: opt1IsSwallow,
                    option2IsSwallow: opt2IsSwallow,
                    isHoliday,
                    holidayName,
                  };

                  const selectedItem = selectedDaysMap[dayMenu.dateStr];
                  const isSelected = Boolean(selectedItem);
                  const selectedOptionId = selectedItem?.selectedMealOption?.id || selectedItem?.meal?.selectedOptionId || (selectedItem ? 'opt-1' : null);
                  const selectedSwallow = selectedItem?.selectedSwallow || 'Semo';

                  const isOpt1Swallow = Boolean(dayMenu.option1IsSwallow || isMealTitleSwallow(dayMenu.option1));
                  const isOpt2Swallow = Boolean(dayMenu.option2IsSwallow || isMealTitleSwallow(dayMenu.option2));

                  return (
                    <div
                      key={dayMenu.dateStr}
                      className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                        isSelected
                          ? 'bg-[#FFF4ED]/70 border-orange-300 shadow-2xs'
                          : 'bg-zinc-100/75 border-zinc-200/90 hover:border-zinc-300'
                      }`}
                    >
                      {/* Day Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-200/80">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${
                            isSelected ? 'bg-gradient-to-br from-[#FF4C00] to-[#FF6E24] text-white' : 'bg-black text-white'
                          }`}>
                            {dayMenu.dayShort}
                          </span>
                          <div>
                            <h4 className="text-sm sm:text-base font-black text-zinc-950 leading-tight">
                              {dayMenu.dayFull}, {dayMenu.dateFormatted.split(', ')[1]}
                            </h4>
                            <p className="text-[11px] text-zinc-500 font-medium">
                              {isHoliday ? 'Official Nigerian Public Holiday' : 'Choose 1 meal option for your desk delivery'}
                            </p>
                          </div>
                        </div>

                        {/* Day Selection Status Badge */}
                        <div>
                          {isHoliday ? (
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Lock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Kitchen Closed (Holiday)</span>
                            </span>
                          ) : isSelected ? (
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Selected: {selectedOptionId === 'opt-2' ? 'Option 2' : 'Option 1'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-500 bg-zinc-200/70">
                              No meal selected yet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Day Body: Holiday Notice or Dual Options Cards */}
                      {isHoliday ? (
                        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-center space-x-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-amber-950">
                              {dayMenu.holidayName || 'Holiday (No service)'}
                            </p>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              No office deliveries on this day. Fresh deliveries resume on the next scheduled workday!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Option 1 Card */}
                          <div
                            onClick={() => handleSelectDayOption(dayMenu, 'opt-1')}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                              isSelected && selectedOptionId === 'opt-1'
                                ? 'bg-gradient-to-br from-white to-[#FFF4ED] border-[#FF4C00] shadow-md ring-2 ring-[#FF4C00]/20'
                                : 'bg-white border-zinc-200/90 hover:border-orange-300 hover:bg-[#FFF9F5] shadow-2xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isSelected && selectedOptionId === 'opt-1'
                                    ? 'bg-[#FF4C00] text-white'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}>
                                  Option 1
                                </span>
                                {isOpt1Swallow && (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                    🍲 Swallow
                                  </span>
                                )}
                              </div>

                              <h5 className="text-sm sm:text-base font-black text-zinc-950 leading-snug">
                                {dayMenu.option1}
                              </h5>
                            </div>

                            {/* Option 1 Footer */}
                            <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">
                                  {isSelected && selectedOptionId === 'opt-1' ? (
                                    <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                      <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
                                      <span>Selected Choice</span>
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 text-[11px]">Click card to choose</span>
                                  )}
                                </span>

                                <button
                                  type="button"
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    isSelected && selectedOptionId === 'opt-1'
                                      ? 'bg-zinc-100 text-zinc-700 hover:bg-rose-50 hover:text-rose-600'
                                      : 'bg-black text-white hover:bg-zinc-800'
                                  }`}
                                >
                                  {isSelected && selectedOptionId === 'opt-1' ? 'Deselect' : 'Select Option 1'}
                                </button>
                              </div>

                              {/* Swallow selector if Option 1 is chosen and is a swallow meal */}
                              {isSelected && selectedOptionId === 'opt-1' && isOpt1Swallow && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 pt-2 border-t border-dashed border-zinc-200 flex flex-wrap items-center justify-between gap-1.5"
                                >
                                  <span className="text-[11px] font-bold text-zinc-700">Choose Swallow:</span>
                                  <div className="flex items-center space-x-1">
                                    {(['Eba', 'Semo', 'Fufu'] as SwallowType[]).map((sw) => (
                                      <button
                                        key={sw}
                                        type="button"
                                        onClick={(e) => handleSelectDaySwallow(dayMenu.dateStr, sw, e)}
                                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                                          selectedSwallow === sw
                                            ? 'bg-[#FF4C00] text-white shadow-2xs'
                                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                        }`}
                                      >
                                        {sw}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Option 2 Card */}
                          <div
                            onClick={() => handleSelectDayOption(dayMenu, 'opt-2')}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                              isSelected && selectedOptionId === 'opt-2'
                                ? 'bg-gradient-to-br from-white to-[#FFF4ED] border-[#FF4C00] shadow-md ring-2 ring-[#FF4C00]/20'
                                : 'bg-white border-zinc-200/90 hover:border-orange-300 hover:bg-[#FFF9F5] shadow-2xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isSelected && selectedOptionId === 'opt-2'
                                    ? 'bg-[#FF4C00] text-white'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}>
                                  Option 2
                                </span>
                                {isOpt2Swallow && (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                    🍲 Swallow
                                  </span>
                                )}
                              </div>

                              <h5 className="text-sm sm:text-base font-black text-zinc-950 leading-snug">
                                {dayMenu.option2}
                              </h5>
                            </div>

                            {/* Option 2 Footer */}
                            <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">
                                  {isSelected && selectedOptionId === 'opt-2' ? (
                                    <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                      <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
                                      <span>Selected Choice</span>
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 text-[11px]">Click card to choose</span>
                                  )}
                                </span>

                                <button
                                  type="button"
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    isSelected && selectedOptionId === 'opt-2'
                                      ? 'bg-zinc-100 text-zinc-700 hover:bg-rose-50 hover:text-rose-600'
                                      : 'bg-black text-white hover:bg-zinc-800'
                                  }`}
                                >
                                  {isSelected && selectedOptionId === 'opt-2' ? 'Deselect' : 'Select Option 2'}
                                </button>
                              </div>

                              {/* Swallow selector if Option 2 is chosen and is a swallow meal */}
                              {isSelected && selectedOptionId === 'opt-2' && isOpt2Swallow && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 pt-2 border-t border-dashed border-zinc-200 flex flex-wrap items-center justify-between gap-1.5"
                                >
                                  <span className="text-[11px] font-bold text-zinc-700">Choose Swallow:</span>
                                  <div className="flex items-center space-x-1">
                                    {(['Eba', 'Semo', 'Fufu'] as SwallowType[]).map((sw) => (
                                      <button
                                        key={sw}
                                        type="button"
                                        onClick={(e) => handleSelectDaySwallow(dayMenu.dateStr, sw, e)}
                                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                                          selectedSwallow === sw
                                            ? 'bg-[#FF4C00] text-white shadow-2xs'
                                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                        }`}
                                      >
                                        {sw}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

        {/* Right Column: Interactive Price Vertical Line UI & Live Gauge */}
        <div className="lg:col-span-4 w-full">
            <div className="bg-gradient-to-b from-[#FFF4ED] via-white to-zinc-50 border-2 border-orange-200 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm sticky top-24">
              <div>
                {/* Selected Meal Name (No image on selection) */}
                {activePreviewMeal && (
                  <div className="mb-4 bg-white rounded-2xl border border-orange-200/80 p-3.5 sm:p-4 shadow-2xs overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2 text-left">
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-zinc-100">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF4C00]" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00]">
                          Selected Meal
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-700">
                        {activePreviewFormattedDate}
                      </span>
                    </div>

                    {/* Meal Name (Always prominent) */}
                    <h4 className="text-sm sm:text-base font-black text-black leading-snug break-words">
                      {activePreviewMeal.mealName}
                    </h4>

                    {/* Swallow selection or category tag */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {activePreviewMeal.mealCategory ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-bold uppercase tracking-wide">
                          {activePreviewMeal.mealCategory}
                        </span>
                      ) : null}
                      {activePreviewSwallow ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 text-[#FF4C00] text-[10px] font-bold uppercase tracking-wide border border-orange-200/60">
                          Swallow: {activePreviewSwallow}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-orange-200/70">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF4C00] animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                      Package Progress
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                      selectedCount >= targetPackageDays
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {selectedCount >= targetPackageDays
                      ? `${targetPackageDays} Days Ready`
                      : `Need ${targetPackageDays - selectedCount} More`}
                  </span>
                </div>

                {/* Days Count Meter */}
                <div className="my-4 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF4C00] block">
                    Lunch Days Selected
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-black tracking-tight mt-1 tabular-nums">
                    {selectedCount} / {targetPackageDays}
                  </div>
                  <p className="text-[11px] text-zinc-600 font-medium mt-1">
                    {selectedCount >= targetPackageDays
                      ? 'Ready! Click "Calculate Order" below to proceed'
                      : `Select ${targetPackageDays - selectedCount} more ${targetPackageDays - selectedCount === 1 ? 'day' : 'days'}`}
                  </p>
                </div>

                {/* Progress Bar Indicator */}
                <div className="my-4 p-4 rounded-2xl bg-white border border-orange-200/70 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-800">
                      {selectedPackage === '5-days' ? '5 Days Meal Package' : '23 Days Meal Package'}
                    </span>
                    <span className="text-[#FF4C00] font-black tabular-nums">
                      ₦{targetPackagePrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4C00] to-[#FF7B33] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${verticalProgressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                    <span>{verticalProgressPercent}% filled</span>
                    <span>{selectedCount} of {targetPackageDays} workdays</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoBackToPlans}
                  className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-black hover:text-white hover:border-black text-zinc-700 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Go Back &amp; Switch Plan</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

        {/* Action Bar & Order Calculation Trigger (Gray Card — Zero Black) */}
        <div className="mt-8 bg-zinc-200 text-[#1A1A1A] border border-zinc-300 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-full overflow-hidden">
          
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-black tabular-nums">
                {selectedCount} / {targetPackageDays} lunch {selectedCount === 1 ? 'day' : 'days'} selected
              </span>
            </div>

            <div className="mt-1 text-xs text-zinc-600 font-medium break-words">
              {validationError ? (
                <span className="text-rose-600 font-semibold flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 inline mr-1 shrink-0" />
                  {validationError}
                </span>
              ) : selectedCount === 0 ? (
                <span>Click any workday above to select your {targetPackageDays} lunch days.</span>
              ) : selectedCount < targetPackageDays ? (
                <span className="text-[#FF4C00] font-semibold">
                  Select {targetPackageDays - selectedCount} more {targetPackageDays - selectedCount === 1 ? 'day' : 'days'} to complete your {targetPackageDays}-day package.
                </span>
              ) : (
                <span
                  onClick={() => {
                    const el = document.getElementById('mobile-calculate-order-btn');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="text-emerald-700 font-semibold cursor-pointer"
                >
                  All {targetPackageDays} days selected. Click &quot;Calculate Order&quot; <span className="md:hidden font-bold underline">above</span><span className="hidden md:inline">right</span> to view total &amp; pay.
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: Go Back + Calculate Order */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleGoBackToPlans}
              className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>

            <button
              onClick={handleCalculateOrder}
              disabled={isCalculating || isAnimationRunning || selectedCount < targetPackageDays}
              className={`hidden md:flex w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wider transition shadow-sm active:scale-95 items-center justify-center space-x-2 whitespace-nowrap ${
                selectedCount < targetPackageDays
                  ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white cursor-pointer shadow-lg shadow-orange-600/25'
              }`}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <span>
                    {selectedCount < targetPackageDays
                      ? `Select ${targetPackageDays} Days (${selectedCount}/${targetPackageDays})`
                      : 'Calculate Order'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
          </>
        )}

        {/* Calculated Order Bill Section / Price Reveal */}
        {showOrderBill && calculatedSummary && (
          <div
            ref={billSectionRef}
            className="mt-8 bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div>
                <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
                  {isAnimationRunning ? 'Calculating your lunch plan...' : 'Your Lunch Plan'}
                </span>
                <h3 className="text-2xl font-black text-black mt-0.5">
                  {isRevealComplete ? 'Your lunch plan is ready.' : 'Calculating your lunch plan...'}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                  }
                  setShowOrderBill(false);
                }}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer"
                title="Close bill"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price-Reveal Showcase Card (Down from 1.35x -> Real Final Total) */}
            <div className="my-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FFF8F4] to-[#FAF7F2] border border-[#FF4C00]/25 text-center shadow-xs">
              <span className="text-xs font-bold tracking-widest text-[#FF4C00] uppercase">
                {isAnimationRunning ? 'Calculating personalized rate...' : 'Total'}
              </span>

              {/* Animated Price Figure */}
              <div className="my-3 flex flex-col items-center justify-center">
                <div
                  className={`text-4xl sm:text-6xl font-black text-black tracking-tight transition-transform duration-300 select-none ${
                    isRevealComplete ? 'scale-105 text-[#FF4C00]' : isAnimationRunning ? 'text-zinc-800' : ''
                  }`}
                >
                  ₦{displayedPrice.toLocaleString()}
                </div>
                {calculatedSummary.discountNGN > 0 && isRevealComplete && (
                  <div className="mt-2.5 inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-bold border border-emerald-200 animate-in fade-in zoom-in-95 duration-200">
                    <span>-₦{calculatedSummary.discountNGN.toLocaleString()} discount applied (Original: ₦{calculatedSummary.subtotalNGN.toLocaleString()})</span>
                  </div>
                )}
              </div>

              {/* Sub-status */}
              <p className="text-xs sm:text-sm text-zinc-600 font-medium max-w-md mx-auto">
                {isAnimationRunning ? (
                  <span className="inline-flex items-center space-x-1.5 text-zinc-700">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF4C00]" />
                    <span>Calculating schedule for {calculatedSummary.totalDays} delivery {calculatedSummary.totalDays === 1 ? 'day' : 'days'}...</span>
                  </span>
                ) : (
                  <span>
                    Direct office desk delivery schedule • All taxes included
                  </span>
                )}
              </p>
            </div>

            {/* Order Summary */}
            <div className="my-6">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-sm font-bold text-black uppercase tracking-wider">
                  Your Lunch Plan
                </span>
                <span className="text-xs font-black text-[#FF4C00] bg-[#FF4C00]/10 px-2.5 py-1 rounded-full">
                  {calculatedSummary.totalDays} lunch {calculatedSummary.totalDays === 1 ? 'day' : 'days'}
                </span>
              </div>

              {/* Selected Meals List */}
              <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-2 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
                {selectedDaysList.map((item) => {
                  const dateObj = new Date(item.dateStr);
                  const formatted = dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <div
                      key={item.dateStr}
                      className="text-xs flex items-center justify-between text-zinc-700 bg-white p-2.5 rounded-xl border border-zinc-100"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-[#FF4C00] shrink-0" />
                        <span className="font-semibold text-zinc-900">{item.meal.mealName}</span>
                        {item.selectedSwallow && (
                          <span className="text-[10px] text-[#FF4C00] bg-orange-50 px-2 py-0.5 rounded-full font-bold border border-orange-200">
                            {item.selectedSwallow}
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-400 text-[11px] font-medium shrink-0 pl-2">
                        {formatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                onClick={() => {
                  if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                  }
                  setShowOrderBill(false);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
              >
                Modify Days
              </button>

              <button
                onClick={handleProceedToPayout}
                disabled={isAnimationRunning}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-black uppercase tracking-wider transition shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}



      {/* UNIVERSAL FRIDAY SWALLOW SELECTION & CONFIRMATION POPUP (Desktop & Mobile) */}
      {swallowModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-['Poppins'] animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest text-[#FF4C00] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full mb-1">
                  <Soup className="w-3 h-3" />
                  <span>Friday Desk Drop Swallow</span>
                </span>
                <h3 className="text-xl font-black text-black leading-tight">
                  Pick Your Friday Swallow
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {swallowModal.dateFormatted} • {swallowModal.meal.mealName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSwallowModal(null)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 block">
                Select Swallow Choice:
              </label>

              {(['Eba', 'Semo', 'Fufu'] as SwallowType[]).map((swallow) => {
                const isSelected = chosenSwallow === swallow;
                return (
                  <button
                    key={swallow}
                    type="button"
                    onClick={() => setChosenSwallow(swallow)}
                    className={`w-full px-4 py-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#FF4C00] bg-orange-50 text-[#FF4C00] font-bold shadow-xs'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold'
                    }`}
                  >
                    <span className="text-sm">{swallow}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[#FF4C00] bg-[#FF4C00] text-white'
                          : 'border-zinc-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions: Confirm and continue */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmSwallow}
                className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm {chosenSwallow}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                {swallowModal.isAlreadySelected ? (
                  <button
                    type="button"
                    onClick={handleRemoveSwallowDay}
                    className="text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    Remove Day
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => setSwallowModal(null)}
                  className="text-zinc-500 font-semibold hover:text-black cursor-pointer ml-auto"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      </div>

      {/* Mobile-Only Floating Calculate Order Bar: floats on screen bottom once a user clicks any date, removed when no date is selected */}
      {(selectedPackage === '5-days' || selectedPackage === '23-days') && selectedCount > 0 && !showOrderBill && (
        <aside
          aria-label="Mobile Calculate Order"
          className="fixed bottom-3 inset-x-3 z-40 md:hidden font-['Poppins'] animate-in fade-in slide-in-from-bottom-5 duration-300 select-none pointer-events-auto"
        >
          <div className="bg-zinc-200/95 text-[#1A1A1A] backdrop-blur-md border border-zinc-300 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-2 max-w-lg mx-auto">
            {/* Selected days count & status */}
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF4C00] animate-pulse shrink-0" />
                <span className="text-xs font-black text-black truncate tabular-nums">
                  {selectedCount} / {targetPackageDays} days
                </span>
              </div>
              <span className="text-[10px] text-zinc-600 font-medium pl-3.5 leading-tight mt-0.5">
                {selectedCount < targetPackageDays
                  ? `Select ${targetPackageDays - selectedCount} more`
                  : 'Ready to calculate bill'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleGoBackToPlans}
                className="py-2.5 px-2.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="Go back and select a different plan"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              {/* Calculate Order Action Button */}
              <button
                type="button"
                onClick={handleCalculateOrder}
                disabled={isCalculating || isAnimationRunning || selectedCount < targetPackageDays}
                className={`py-2.5 px-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center space-x-1.5 shrink-0 whitespace-nowrap ${
                  selectedCount < targetPackageDays
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
                    : 'bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white cursor-pointer shadow-lg shadow-orange-600/30'
                }`}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {selectedCount < targetPackageDays
                        ? `${selectedCount}/${targetPackageDays} Days`
                        : 'Calculate Order'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      )}
    </section>
  );
};
