import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CustomerRecord,
  StructuredMeal,
  calculateMealPrice,
  PER_DAY_FEE,
  CreditRedemptionOrder,
} from '../../../types';
import { getStructuredMealForDate, updateCustomMealForDate, subscribeMenuChanges } from '../../../data/menuRotation';
import { exportToCsv } from '../../../utils/csvExport';
import { downloadMealExcelTemplate, parseAndApplyMealSpreadsheet } from '../../../utils/mealExcelService';
import { liveSync } from '../../../services/liveSyncService';
import {
  CalendarDays,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Eye,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  Edit,
  Sparkles,
  X,
} from 'lucide-react';

interface AdminMealScheduleTabProps {
  customers: CustomerRecord[];
  creditRedemptions?: CreditRedemptionOrder[];
  onOpenCustomerProfile?: (customer: CustomerRecord) => void;
  initialDate?: string;
}

export const AdminMealScheduleTab: React.FC<AdminMealScheduleTabProps> = ({
  customers,
  creditRedemptions = [],
  onOpenCustomerProfile,
  initialDate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [, setMenuUpdateVersion] = useState(0);
  const [syncVersion, setSyncVersion] = useState(0);

  useEffect(() => {
    const unsubMenu = subscribeMenuChanges(() => {
      setMenuUpdateVersion((v) => v + 1);
    });
    const unsubLive = liveSync.subscribe(() => {
      setSyncVersion((v) => v + 1);
    });
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === '11to12_persistent_credit_redemptions_v1' ||
        e.key === '11to12_persistent_customers_v1' ||
        e.key === '11to12_persistent_user_profile_v1'
      ) {
        setSyncVersion((v) => v + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      unsubMenu();
      unsubLive();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const formatYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = useMemo(() => formatYmd(new Date()), []);

  // Selected date defaults to official launch date Dec 7, 2026
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialDate && initialDate >= '2026-12-07') return initialDate;
    return '2026-12-07';
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await parseAndApplyMealSpreadsheet(file);
      if (res.success) {
        setImportStatus(`Successfully adapted & auto-filled ${res.importedCount} dates! Distributed real-time everywhere.`);
      } else {
        setImportStatus(`Import notice: ${res.errors.join('; ')}`);
      }
    } catch (err: any) {
      setImportStatus(`Failed to parse file: ${err.message || 'Check template format'}`);
    }
    setTimeout(() => setImportStatus(null), 5000);
    if (e.target) e.target.value = '';
  };

  // Inline edit state for selected date
  const [isEditingMeal, setIsEditingMeal] = useState(false);
  const [editMealName, setEditMealName] = useState('');
  const [editMealPrice, setEditMealPrice] = useState(2900);
  const [editIsHoliday, setEditIsHoliday] = useState(false);

  // Selected Date Object
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }, [selectedDate]);

  // Meal for that date
  const mealForDate: StructuredMeal | null = useMemo(() => {
    return getStructuredMealForDate(selectedDateObj);
  }, [selectedDateObj, importStatus]);

  const handleStartEditCurrentDate = () => {
    if (mealForDate) {
      setEditMealName(mealForDate.mealName);
      setEditMealPrice(calculateMealPrice(mealForDate));
      setEditIsHoliday(mealForDate.isHoliday || mealForDate.isNoDelivery || false);
    } else {
      setEditMealName('Jollof Rice + Chicken');
      setEditMealPrice(2900);
      setEditIsHoliday(false);
    }
    setIsEditingMeal(true);
  };

  const handleSaveCurrentDateMeal = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = (dayNames[new Date(y, m - 1, d).getDay()] || 'Monday') as any;

    const parsedPrice = Number(editMealPrice) > 0 ? Number(editMealPrice) : 2900;

    const updatedMeal: StructuredMeal = {
      ...(mealForDate || {
        id: `meal-${selectedDate}`,
        dateStr: selectedDate,
        day: dayName,
        mealName: editMealName,
        mealCategory: 'Rice',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
      }),
      mealName: editMealName.trim() || (mealForDate?.mealName ?? 'Daily Chef Special'),
      price: parsedPrice,
      isHoliday: editIsHoliday,
      isNoDelivery: editIsHoliday,
      holidayName: editIsHoliday ? 'Holiday / No Delivery' : undefined,
    };

    updateCustomMealForDate(selectedDate, updatedMeal);
    setIsEditingMeal(false);
    setImportStatus(`Saved & Distributed! Meal "${updatedMeal.mealName}" (₦${parsedPrice.toLocaleString()}) updated real-time across Website, Dashboard & Admin.`);
    setTimeout(() => setImportStatus(null), 4000);
  };

  // Filter and compile EVERY customer receiving food on this date (Main Meals + Credit Plates)
  // "Food is food. It should be updated real time."
  const deliveryListForDate = useMemo(() => {
    const list: Array<{
      id: string;
      customer: CustomerRecord;
      name: string;
      phone: string;
      email: string;
      primaryAddress: string;
      secondAddress: string;
      mealTitle: string;
      swallowChoice?: string;
      orderRef: string;
      mealType: 'Main Scheduled' | '⭐ Credit Plate';
      isCredit: boolean;
      portions: number;
    }> = [];

    // 1. Confirmed / Active customers who selected this date and did not skip
    const confirmed = customers.filter(
      (c) => c.status === 'Active' || c.paymentStatus === 'Paid'
    );

    confirmed.forEach((cust) => {
      const hasDate = (cust.selectedDays || []).some((d) => d.dateStr === selectedDate);
      const isSkipped = (cust.skippedDates || []).includes(selectedDate);

      if (hasDate && !isSkipped) {
        const selectedDay = cust.selectedDays.find((d) => d.dateStr === selectedDate);
        list.push({
          id: `main-${cust.id}-${selectedDate}`,
          customer: cust,
          name: cust.fullName,
          phone: cust.phone,
          email: cust.email,
          primaryAddress: cust.officeAddress,
          secondAddress: cust.secondAddress || '—',
          mealTitle: mealForDate?.mealName || selectedDay?.meal?.mealName || 'Standard Meal',
          swallowChoice: selectedDay?.selectedSwallow,
          orderRef: cust.orderRef || cust.id,
          mealType: 'Main Scheduled',
          isCredit: false,
          portions: 1,
        });
      }
    });

    // 2. Customers who used Credit on this date ("Food is food!")
    // Gather all credit redemptions from prop, localStorage, and from customer records
    let localRedemptions: CreditRedemptionOrder[] = [];
    try {
      const raw = localStorage.getItem('11to12_persistent_credit_redemptions_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localRedemptions = parsed;
      }
    } catch {}

    const allRedemptionOrders: CreditRedemptionOrder[] = [
      ...(creditRedemptions || []),
      ...localRedemptions,
      ...customers.flatMap((c) => (c as any).creditRedemptions || []),
    ];

    const processedKeys = new Set<string>();

    allRedemptionOrders.forEach((order) => {
      if (!order || !order.items) return;
      (order.items || []).forEach((item, itemIdx) => {
        if (item.dateStr === selectedDate) {
          const uniqueKey = `${order.id}-${item.dateStr}-${itemIdx}`;
          if (processedKeys.has(uniqueKey)) return;
          processedKeys.add(uniqueKey);

          const matchedCust = customers.find(
            (c) =>
              c.id === order.userId ||
              (c.email && order.email && c.email.toLowerCase() === (order.email || '').toLowerCase()) ||
              (c.fullName && order.userName && c.fullName.toLowerCase() === order.userName.toLowerCase())
          );

          list.push({
            id: `credit-${uniqueKey}`,
            customer: matchedCust || ({
              id: order.userId || `cust-${Date.now()}`,
              fullName: order.userName || 'Subscriber',
              email: order.email || '',
              phone: order.userPhone || '',
              officeAddress: order.officeAddress || 'Desk Drop',
              secondAddress: '—',
              selectedDays: [],
              status: 'Active',
              paymentStatus: 'Paid',
              planName: 'Credit Meal',
              totalDays: 1,
              subtotalNGN: 0,
              discountNGN: 0,
              finalTotalNGN: 0,
              createdAt: order.submittedAt || new Date().toISOString(),
              isPasswordSet: true,
              company: order.company || '',
            } as CustomerRecord),
            name: order.userName || matchedCust?.fullName || 'Subscriber',
            phone: order.userPhone || matchedCust?.phone || '—',
            email: matchedCust?.email || (order as any).email || '—',
            primaryAddress: order.officeAddress || matchedCust?.officeAddress || 'Desk Drop',
            secondAddress: matchedCust?.secondAddress || '—',
            mealTitle: item.dishName || mealForDate?.mealName || 'Redeemed Credit Plate',
            swallowChoice: item.swallowChoice,
            orderRef: order.id,
            mealType: '⭐ Credit Plate',
            isCredit: true,
            portions: Math.max(1, item.portions || 1),
          });
        }
      });
    });

    // 3. Also check if any customer has selectedDate in creditUsedDates or extraPlateDates
    customers.forEach((cust) => {
      const usedDates = (cust.creditUsedDates || []).concat(cust.extraPlateDates || []);
      if (usedDates.includes(selectedDate)) {
        const alreadyInList = list.some(
          (it) => it.isCredit && (it.customer.id === cust.id || Boolean(cust.email && it.customer.email && it.customer.email.toLowerCase() === cust.email.toLowerCase()))
        );
        if (!alreadyInList) {
          list.push({
            id: `credit-date-${cust.id}-${selectedDate}`,
            customer: cust,
            name: cust.fullName,
            phone: cust.phone,
            email: cust.email,
            primaryAddress: cust.officeAddress,
            secondAddress: cust.secondAddress || '—',
            mealTitle: mealForDate?.mealName || 'Redeemed Credit Plate',
            swallowChoice: undefined,
            orderRef: cust.orderRef || cust.id,
            mealType: '⭐ Credit Plate',
            isCredit: true,
            portions: 1,
          });
        }
      }
    });

    return list;
  }, [customers, creditRedemptions, selectedDate, mealForDate, syncVersion]);

  // Search filtered within delivery list
  const filteredDeliveryList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return deliveryListForDate;
    return deliveryListForDate.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.primaryAddress.toLowerCase().includes(q) ||
        item.secondAddress.toLowerCase().includes(q) ||
        item.mealType.toLowerCase().includes(q)
    );
  }, [deliveryListForDate, searchQuery]);

  const totalConfirmedLunches = useMemo(() => {
    return deliveryListForDate.reduce((acc, it) => acc + it.portions, 0);
  }, [deliveryListForDate]);

  const mainMealsCount = useMemo(() => {
    return deliveryListForDate.filter((it) => !it.isCredit).reduce((acc, it) => acc + it.portions, 0);
  }, [deliveryListForDate]);

  const creditMealsCount = useMemo(() => {
    return deliveryListForDate.filter((it) => it.isCredit).reduce((acc, it) => acc + it.portions, 0);
  }, [deliveryListForDate]);

  // Date shifting (guarded to never go before Dec 7, 2026 launch)
  const handleShiftDate = (days: number) => {
    const cur = new Date(selectedDateObj);
    cur.setDate(cur.getDate() + days);
    if (cur.getDay() === 0) cur.setDate(cur.getDate() + (days > 0 ? 1 : -2));
    else if (cur.getDay() === 6) cur.setDate(cur.getDate() + (days > 0 ? 2 : -1));
    const nextYmd = formatYmd(cur);
    if (nextYmd < '2026-12-07') {
      setSelectedDate('2026-12-07');
      return;
    }
    setSelectedDate(nextYmd);
  };

  const handleDownloadCsv = () => {
    const headers = [
      'Customer Name',
      'Meal Type',
      'Phone Number',
      'Email',
      'Primary Delivery Address',
      'Second Delivery Address',
      'Meal',
      'Swallow Choice',
      'Portions',
      'Customer Reference',
    ];

    const rows = deliveryListForDate.map((item) => [
      item.name,
      item.mealType,
      item.phone,
      item.email,
      item.primaryAddress,
      item.secondAddress,
      item.mealTitle,
      item.swallowChoice || 'Standard',
      item.portions,
      item.orderRef,
    ]);

    exportToCsv(`kitchen-delivery-list-${selectedDate}`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDateLabel = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Meal Schedule</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Operations Control
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Answer in 1 click: “On this date, how many lunches am I preparing and who am I delivering them to?”
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden Excel File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
            title="Upload Excel (.xlsx) or CSV with Date and Food Title"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Excel Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => downloadMealExcelTemplate('xlsx')}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
            title="Download official Excel template with 1 default sample row"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sample Excel Template</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            disabled={deliveryListForDate.length === 0}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-40 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={deliveryListForDate.length === 0}
            className="px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-40 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Delivery Sheet</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Date Picker Bar & Daily Stats Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        
        {/* Date Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-[#FF4C00]" />
            <span className="text-sm font-bold text-zinc-900">Select Date</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedDate('2026-12-07')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate === '2026-12-07'
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Launch Day (Dec 7)
            </button>
            <button
              onClick={() => setSelectedDate('2026-12-08')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate === '2026-12-08'
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Dec 8
            </button>
            <button
              onClick={() => setSelectedDate('2026-12-09')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate === '2026-12-09'
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Dec 9
            </button>
            <button
              onClick={() => setSelectedDate('2026-12-10')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate === '2026-12-10'
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Dec 10
            </button>
            <button
              onClick={() => setSelectedDate('2026-12-11')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate === '2026-12-11'
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Dec 11 (Egusi)
            </button>
            <button
              onClick={() => setSelectedDate('2026-12-14')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate === '2026-12-14'
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Week 2 (Dec 14)
            </button>

            <div className="flex items-center space-x-1 bg-zinc-50 border border-zinc-200 rounded-xl p-1">
              <button
                onClick={() => handleShiftDate(-1)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                min="2026-12-07"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value < '2026-12-07' ? '2026-12-07' : e.target.value);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-zinc-900 px-2 py-0.5 focus:outline-none cursor-pointer"
              />

              <button
                onClick={() => handleShiftDate(1)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Operational Highlights for Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Meal Details & Quick Pricing/Holiday Controls */}
          <div className="md:col-span-2 bg-[#FAF7F2] border border-zinc-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            {isEditingMeal ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4C00]">
                    Edit Meal & Price for {formattedDateLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingMeal(false)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                      Meal Name
                    </label>
                    <input
                      type="text"
                      value={editMealName}
                      onChange={(e) => setEditMealName(e.target.value)}
                      placeholder="e.g. Jollof rice + chicken + plantain"
                      className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                      Meal Price (₦)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-zinc-400 font-bold">₦</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={editMealPrice}
                        onChange={(e) => setEditMealPrice(Number(e.target.value))}
                        className="w-full bg-white border border-zinc-300 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                  </div>
                </div>

                {/* Holiday Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-zinc-700">Day Delivery Status:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditIsHoliday(false)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        !editIsHoliday
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                      }`}
                    >
                      ✓ Delivering Food
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsHoliday(true)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        editIsHoliday
                          ? 'bg-amber-600 text-white'
                          : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                      }`}
                    >
                      Holiday (No Delivery)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingMeal(false)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCurrentDateMeal}
                    className="px-4 py-1.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save Meal & Price</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4C00]">
                    {formattedDateLabel}
                  </span>
                  <h2 className="text-lg font-bold text-zinc-900">
                    {mealForDate ? mealForDate.mealName : 'Kitchen Off / Weekend'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {mealForDate && (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ₦{calculateMealPrice(mealForDate).toLocaleString()} (Each Meal)
                      </span>
                    )}
                    {mealForDate?.isHoliday || mealForDate?.isNoDelivery ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Holiday (No Delivery)
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Delivering Food
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleStartEditCurrentDate}
                    className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Meal & Price</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Total Confirmed Lunches */}
          <div className="bg-zinc-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Total Confirmed Lunches</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  {mainMealsCount} Main
                </span>
                {creditMealsCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-[#FF4C00]">
                    +{creditMealsCount} Credit
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-white">{totalConfirmedLunches}</span>
                <span className="text-xs text-zinc-400">total meals to cook & deliver</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Desk drop delivery window: 11:00 AM – 12:00 PM
              </p>
            </div>
          </div>

        </div>

        {/* Customer Delivery List */}
        <div className="space-y-3 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Customer Delivery List ({totalConfirmedLunches} Meals)
              </h3>
              <p className="text-xs text-zinc-500">
                Every confirmed subscriber receiving food on {selectedDate} (Main Scheduled & Credit Plates)
              </p>
            </div>

            {/* In-table Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search delivery list..."
                className="w-full bg-white border border-zinc-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00]"
              />
            </div>
          </div>

          {filteredDeliveryList.length === 0 ? (
            <div className="py-14 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-700">No customers scheduled for delivery</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {searchQuery
                  ? 'No recipients match your search.'
                  : 'No confirmed customers or credit meals scheduled for this date.'}
              </p>
            </div>
          ) : (
            <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Meal Type</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Primary Delivery Address</th>
                      <th className="py-3 px-4">Second Delivery Address</th>
                      <th className="py-3 px-4">Meal & Choice</th>
                      <th className="py-3 px-4">Portions</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredDeliveryList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-zinc-900">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.isCredit
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-orange-50 text-[#FF4C00] border-orange-200'
                            }`}
                          >
                            {item.mealType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-700 text-[11px]">
                          {item.phone}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-zinc-800 max-w-[200px] truncate" title={item.primaryAddress}>
                          {item.primaryAddress}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500 max-w-[150px] truncate" title={item.secondAddress}>
                          {item.secondAddress}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-zinc-900">{item.mealTitle}</span>
                          {item.swallowChoice && (
                            <span className="ml-1 text-[10px] font-bold text-[#FF4C00] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                              Swallow: {item.swallowChoice}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-zinc-800">
                          {item.portions} plate{item.portions > 1 ? 's' : ''}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400 text-[10px] truncate max-w-[100px]" title={item.orderRef}>
                          {item.orderRef}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenCustomerProfile && onOpenCustomerProfile(item.customer)}
                            className="text-xs font-semibold text-[#FF4C00] hover:underline cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Profile</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
