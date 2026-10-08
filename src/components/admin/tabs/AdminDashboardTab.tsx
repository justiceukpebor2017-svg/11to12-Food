import React, { useState, useMemo } from 'react';
import {
  CustomerRecord,
  OrderSubmission,
  WaitlistLead,
  StructuredMeal,
} from '../../../types';
import { AdminTab } from '../AdminSidebar';
import { getStructuredMealForDate } from '../../../data/menuRotation';
import { exportToCsv } from '../../../utils/csvExport';
import { LAUNCH_CONFIG } from '../../../config/launchConfig';
import {
  Users,
  CreditCard,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Utensils,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Eye,
  TrendingUp,
  X,
  Filter,
  CheckCircle2,
  Wallet,
} from 'lucide-react';

interface AdminDashboardTabProps {
  onNavigateTab: (tab: AdminTab) => void;
  customers: CustomerRecord[];
  submittedOrders: OrderSubmission[];
  waitlistLeads: WaitlistLead[];
  onOpenCustomerProfile?: (customer: CustomerRecord) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  onNavigateTab,
  customers,
  submittedOrders,
  waitlistLeads,
  onOpenCustomerProfile,
}) => {
  // Format YYYY-MM-DD
  const formatYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = useMemo(() => formatYmd(new Date()), []);

  // Selected date defaults to launch date (e.g. Dec 7, 2026) or today/next weekday
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (LAUNCH_CONFIG.isEnabled) {
      return LAUNCH_CONFIG.dateString;
    }
    const now = new Date();
    // If weekend, move to upcoming Monday
    const day = now.getDay();
    if (day === 0) now.setDate(now.getDate() + 1);
    else if (day === 6) now.setDate(now.getDate() + 2);
    return formatYmd(now);
  });

  // Calculate Counts
  const waitlistCount = waitlistLeads.length;
  const pendingOrders = useMemo(
    () => submittedOrders.filter((o) => o.paymentStatus !== 'Confirmed'),
    [submittedOrders]
  );
  const pendingPaymentCount = pendingOrders.length;
  const confirmedCustomers = useMemo(
    () => customers.filter((c) => c.status === 'Active' || c.paymentStatus === 'Paid'),
    [customers]
  );
  const confirmedCustomerCount = confirmedCustomers.length;

  // Revenue State & Month Filtering
  const [selectedRevenueMonth, setSelectedRevenueMonth] = useState<string>('all');
  const [showRevenueModal, setShowRevenueModal] = useState<boolean>(false);

  const getCustomerRevenue = (c: CustomerRecord): number => {
    if (typeof c.finalTotalNGN === 'number' && c.finalTotalNGN > 0) return c.finalTotalNGN;
    if (typeof c.subtotalNGN === 'number' && c.subtotalNGN > 0) {
      return Math.max(0, c.subtotalNGN - (c.discountNGN || 0));
    }
    return (c.totalDays || c.selectedDays?.length || 0) * 3500;
  };

  const getCustomerPaymentDate = (c: CustomerRecord): Date => {
    const raw = c.confirmedAt || c.createdAt;
    if (raw) {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  // Group verified customers by month of inflow
  const availableMonths = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number; total: number }>();

    // Seed default launch window months
    const defaultKeys = ['2026-10', '2026-11', '2026-12', '2027-01'];
    defaultKeys.forEach((key) => {
      const [y, m] = key.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      map.set(key, { key, label, count: 0, total: 0 });
    });

    confirmedCustomers.forEach((c) => {
      const d = getCustomerPaymentDate(c);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rev = getCustomerRevenue(c);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const curr = map.get(key) || { key, label, count: 0, total: 0 };
      curr.count += 1;
      curr.total += rev;
      map.set(key, curr);
    });

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [confirmedCustomers]);

  const filteredRevenueCustomers = useMemo(() => {
    if (selectedRevenueMonth === 'all') return confirmedCustomers;
    return confirmedCustomers.filter((c) => {
      const d = getCustomerPaymentDate(c);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedRevenueMonth;
    });
  }, [confirmedCustomers, selectedRevenueMonth]);

  const displayRevenue = useMemo(() => {
    return filteredRevenueCustomers.reduce((acc, c) => acc + getCustomerRevenue(c), 0);
  }, [filteredRevenueCustomers]);

  const totalAllTimeRevenue = useMemo(() => {
    return confirmedCustomers.reduce((acc, c) => acc + getCustomerRevenue(c), 0);
  }, [confirmedCustomers]);

  const activeMonthLabel = useMemo(() => {
    if (selectedRevenueMonth === 'all') return 'All Time';
    const found = availableMonths.find((m) => m.key === selectedRevenueMonth);
    return found ? found.label : selectedRevenueMonth;
  }, [selectedRevenueMonth, availableMonths]);

  // Selected Date Meal Information
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }, [selectedDate]);

  const mealForDate: StructuredMeal | null = useMemo(() => {
    return getStructuredMealForDate(selectedDateObj);
  }, [selectedDateObj]);

  // Delivery list for selected date:
  // ONLY confirmed customers with an active meal on this date (EXCLUDING customers who skipped)
  const deliveryListForDate = useMemo(() => {
    return confirmedCustomers
      .filter((cust) => {
        // Must have selected this date
        const hasDate = (cust.selectedDays || []).some((d) => d.dateStr === selectedDate);
        if (!hasDate) return false;

        // Must NOT have skipped this date
        const isSkipped = (cust.skippedDates || []).includes(selectedDate);
        if (isSkipped) return false;

        return true;
      })
      .map((cust) => {
        const selectedDay = cust.selectedDays.find((d) => d.dateStr === selectedDate);
        return {
          customer: cust,
          name: cust.fullName,
          phone: cust.phone,
          email: cust.email,
          primaryAddress: cust.officeAddress,
          secondAddress: cust.secondAddress || '—',
          mealTitle: mealForDate?.mealName || selectedDay?.meal.mealName || 'Standard Meal',
          swallowChoice: selectedDay?.selectedSwallow,
          orderRef: cust.orderRef || cust.id,
        };
      });
  }, [confirmedCustomers, selectedDate, mealForDate]);

  // Total lunches for the day
  const totalLunchesToday = deliveryListForDate.length;

  // Quick Date Navigation
  const handleShiftDate = (days: number) => {
    const cur = new Date(selectedDateObj);
    cur.setDate(cur.getDate() + days);
    // Skip weekends
    if (cur.getDay() === 0) cur.setDate(cur.getDate() + (days > 0 ? 1 : -2));
    else if (cur.getDay() === 6) cur.setDate(cur.getDate() + (days > 0 ? 2 : -1));
    setSelectedDate(formatYmd(cur));
  };

  const setDateToToday = () => {
    if (LAUNCH_CONFIG.isEnabled) {
      setSelectedDate(LAUNCH_CONFIG.dateString);
      return;
    }
    const now = new Date();
    if (now.getDay() === 0) now.setDate(now.getDate() + 1);
    else if (now.getDay() === 6) now.setDate(now.getDate() + 2);
    setSelectedDate(formatYmd(now));
  };

  const setDateToTomorrow = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    if (now.getDay() === 0) now.setDate(now.getDate() + 1);
    else if (now.getDay() === 6) now.setDate(now.getDate() + 2);
    setSelectedDate(formatYmd(now));
  };

  // CSV Download for selected day
  const handleDownloadCsv = () => {
    const headers = [
      'Customer Name',
      'Phone Number',
      'Email',
      'Primary Delivery Address',
      'Second Delivery Address',
      'Meal',
      'Swallow Choice',
      'Reference',
    ];

    const rows = deliveryListForDate.map((item) => [
      item.name,
      item.phone,
      item.email,
      item.primaryAddress,
      item.secondAddress,
      item.mealTitle,
      item.swallowChoice || 'Standard',
      item.orderRef,
    ]);

    exportToCsv(`delivery-list-${selectedDate}`, headers, rows);
  };

  // CSV Download for Revenue Inflow Report
  const handleDownloadRevenueCsv = () => {
    const headers = [
      'Customer Name',
      'Company',
      'Email',
      'Phone',
      'Confirmation Date',
      'Plan Name',
      'Total Days',
      'Amount (NGN)',
      'Status',
    ];

    const rows = filteredRevenueCustomers.map((c) => {
      const pDate = getCustomerPaymentDate(c);
      return [
        c.fullName,
        c.company,
        c.email,
        c.phone,
        pDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        c.planName || 'Standard Lunch Plan',
        c.totalDays || c.selectedDays?.length || 0,
        getCustomerRevenue(c),
        c.status,
      ];
    });

    exportToCsv(`revenue-report-${selectedRevenueMonth}`, headers, rows);
  };

  const formattedDateLabel = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Poppins']">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Quick overview of pending items and upcoming lunches</p>
        </div>
      </div>

      {/* 5 Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Total Revenue Card (Click to open month filter breakdown) */}
        <div
          onClick={() => setShowRevenueModal(true)}
          className="bg-gradient-to-br from-emerald-50/70 via-white to-white border-2 border-emerald-500/40 hover:border-emerald-600 rounded-2xl p-5 hover:shadow-md transition cursor-pointer shadow-xs group relative overflow-hidden"
          title="Click to view revenue breakdown and filter by month"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-emerald-800">Total Revenue</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {selectedRevenueMonth === 'all' ? 'All Time' : activeMonthLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              ₦{displayRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 group-hover:underline flex items-center">
              Filter <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {filteredRevenueCustomers.length} verified payment{filteredRevenueCustomers.length === 1 ? '' : 's'} • Click to filter
          </p>
        </div>

        {/* 2. Pending Payments Card */}
        <div
          onClick={() => onNavigateTab('pending-payments')}
          className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-400 transition cursor-pointer shadow-xs group relative overflow-hidden"
        >
          {pendingPaymentCount > 0 && (
            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#FF4C00] m-3" />
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Pending Payments</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4C00] flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-zinc-900">{pendingPaymentCount}</span>
            <span className="text-[11px] font-semibold text-[#FF4C00] group-hover:underline flex items-center">
              Verify <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Needs verification</p>
        </div>

        {/* 3. Confirmed Customers Card */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-400 transition cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Confirmed Customers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-zinc-900">{confirmedCustomerCount}</span>
            <span className="text-[11px] font-semibold text-emerald-600 group-hover:underline flex items-center">
              View <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Paid subscribers</p>
        </div>

        {/* 4. Waitlist Card */}
        <div
          onClick={() => onNavigateTab('waitlist')}
          className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-400 transition cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Waitlist</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-zinc-900">{waitlistCount}</span>
            <span className="text-[11px] font-semibold text-purple-600 group-hover:underline flex items-center">
              View <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Interested people</p>
        </div>

        {/* 5. Upcoming Lunch Activity Card */}
        <div
          onClick={() => onNavigateTab('meal-schedule')}
          className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-400 transition cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Lunch Activity</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-zinc-900">{totalLunchesToday}</span>
            <span className="text-[11px] font-semibold text-blue-600 group-hover:underline flex items-center">
              Schedule <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Lunches on selected date</p>
        </div>

      </div>

      {/* Date Selector & Selected Day Overview */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        
        {/* Date Selector Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Upcoming Lunch Activity</h2>
            <p className="text-xs text-zinc-500">Select any date to see meals and customer deliveries</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={setDateToToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={setDateToTomorrow}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
            >
              Tomorrow
            </button>

            <div className="flex items-center space-x-1 bg-zinc-50 border border-zinc-200 rounded-xl p-1">
              <button
                onClick={() => handleShiftDate(-1)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
                title="Previous Workday"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <input
                type="date"
                min={LAUNCH_CONFIG.isEnabled ? LAUNCH_CONFIG.dateString : undefined}
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 px-2 py-0.5 focus:outline-none cursor-pointer"
              />

              <button
                onClick={() => handleShiftDate(1)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
                title="Next Workday"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Date Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Meal Box */}
          <div className="md:col-span-2 bg-[#FAF7F2] border border-zinc-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FF4C00]/10 text-[#FF4C00] flex items-center justify-center shrink-0 mt-0.5">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C00]">
                  {formattedDateLabel}
                </span>
                <h3 className="text-base font-bold text-zinc-900 mt-0.5">
                  {mealForDate ? mealForDate.mealName : 'No Kitchen Delivery (Weekend / Off)'}
                </h3>
                {mealForDate && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Category: <span className="font-semibold text-zinc-700">{mealForDate.mealCategory}</span> • {mealForDate.ingredients?.join(', ') || 'Gourmet meal'}
                  </p>
                )}
              </div>
            </div>

            {mealForDate?.mealCategory === 'Swallow' && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                Friday Swallow Choice
              </span>
            )}
          </div>

          {/* Customer Count Box */}
          <div className="bg-zinc-900 text-white rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Scheduled Lunches</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                Excludes Skips
              </span>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white">{totalLunchesToday}</span>
              <span className="text-xs text-zinc-400">customers receiving lunch</span>
            </div>
          </div>

        </div>

        {/* Customer Delivery List Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Delivery List ({totalLunchesToday})
              </h3>
              <p className="text-xs text-zinc-500">
                Customers receiving lunch on {selectedDate} (skipped meals excluded)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadCsv}
                disabled={deliveryListForDate.length === 0}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span>Download Day CSV</span>
              </button>

              <button
                onClick={() => onNavigateTab('meal-schedule')}
                className="px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Delivery List</span>
              </button>
            </div>
          </div>

          {deliveryListForDate.length === 0 ? (
            <div className="py-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-600">No deliveries scheduled for this date</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Either no customers picked this day, or selected customers skipped it.</p>
            </div>
          ) : (
            <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Contact</th>
                      <th className="py-2.5 px-4">Primary Address</th>
                      <th className="py-2.5 px-4">Second Address</th>
                      <th className="py-2.5 px-4">Meal / Choice</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {deliveryListForDate.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3 px-4 font-bold text-zinc-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-4 text-zinc-600">
                          <div>{item.phone}</div>
                          <div className="text-[10px] text-zinc-400">{item.email}</div>
                        </td>
                        <td className="py-3 px-4 text-zinc-700 max-w-[200px] truncate" title={item.primaryAddress}>
                          {item.primaryAddress}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 max-w-[150px] truncate" title={item.secondAddress}>
                          {item.secondAddress}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-zinc-900">{item.mealTitle}</span>
                          {item.swallowChoice && (
                            <span className="ml-1 text-[10px] font-bold text-[#FF4C00] bg-orange-50 px-1.5 py-0.5 rounded">
                              {item.swallowChoice}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
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

      {/* Revenue Breakdown & Monthly Inflow Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-white to-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">Verified Revenue & Inflow</h3>
                  <p className="text-xs text-zinc-500">
                    Live financial ledger • Filter by month of bank confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRevenueModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Highlight Stat Card */}
              <div className="bg-emerald-950 text-white p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-900 shadow-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                      {activeMonthLabel} Inflow
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 font-semibold border border-emerald-800">
                      {filteredRevenueCustomers.length} Verified Subscriber{filteredRevenueCustomers.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
                    ₦{displayRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-emerald-300/80 mt-1">
                    {selectedRevenueMonth === 'all'
                      ? 'Total verified subscription revenue collected across all operating months'
                      : `Revenue confirmed and deposited during ${activeMonthLabel}`}
                  </p>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={handleDownloadRevenueCsv}
                    disabled={filteredRevenueCustomers.length === 0}
                    className="px-4 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-800" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Month Filter Selector Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                  <span className="flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Filter By Inflow Month:</span>
                  </span>
                  <span className="text-zinc-400 font-normal">
                    Showing: <strong className="text-zinc-900">{activeMonthLabel}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* All Time Pill */}
                  <button
                    type="button"
                    onClick={() => setSelectedRevenueMonth('all')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center space-x-1.5 ${
                      selectedRevenueMonth === 'all'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <span>All Time</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ₦{totalAllTimeRevenue.toLocaleString()}
                    </span>
                  </button>

                  {/* Individual Months */}
                  {availableMonths.map((m) => {
                    const isSelected = selectedRevenueMonth === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelectedRevenueMonth(m.key)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <span>{m.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          ₦{m.total.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informational Policy Banner */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
                <div className="font-bold text-zinc-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real-Time Inflow Accounting Rules:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  • Revenue is only added to this dashboard once an admin verifies and confirms a subscriber's payment.<br />
                  • If an admin deletes a customer profile, their payment amount is automatically deducted in real time.
                </p>
              </div>

              {/* Itemized Transactions / Confirmed Customers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                    Confirmed Payments ({filteredRevenueCustomers.length})
                  </h4>
                  {selectedRevenueMonth !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedRevenueMonth('all')}
                      className="text-xs text-[#FF4C00] hover:underline font-semibold cursor-pointer"
                    >
                      Clear Month Filter
                    </button>
                  )}
                </div>

                {filteredRevenueCustomers.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 space-y-2">
                    <Wallet className="w-8 h-8 text-zinc-400 mx-auto stroke-1" />
                    <p className="text-xs font-bold text-zinc-700">No verified revenue recorded for {activeMonthLabel}</p>
                    <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                      Payments appear here as soon as orders in "Pending Payments" are approved and confirmed.
                    </p>
                  </div>
                ) : (
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-100">
                    {filteredRevenueCustomers.map((cust) => {
                      const pDate = getCustomerPaymentDate(cust);
                      const revAmount = getCustomerRevenue(cust);
                      return (
                        <div key={cust.id} className="p-4 hover:bg-zinc-50/80 transition flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-zinc-900 truncate">{cust.fullName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                Paid & Active
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500 truncate">
                              {cust.company} • {cust.email} • {cust.phone}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              Confirmed: {pDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {cust.planName || `${cust.totalDays} Days`}
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <div className="text-sm font-extrabold text-emerald-600">
                              +₦{revAmount.toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowRevenueModal(false);
                                if (onOpenCustomerProfile) onOpenCustomerProfile(cust);
                              }}
                              className="text-xs font-semibold text-[#FF4C00] hover:underline cursor-pointer inline-flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 bg-[#FAF7F2] flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Filtered: <strong className="text-zinc-800">{activeMonthLabel}</strong> (₦{displayRevenue.toLocaleString()})
              </span>
              <button
                type="button"
                onClick={() => setShowRevenueModal(false)}
                className="px-5 py-2 rounded-xl bg-black text-white hover:bg-zinc-800 text-xs font-bold transition cursor-pointer"
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
