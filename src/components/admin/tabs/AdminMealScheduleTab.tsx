import React, { useState, useMemo } from 'react';
import {
  CustomerRecord,
  StructuredMeal,
} from '../../../types';
import { getStructuredMealForDate } from '../../../data/menuRotation';
import { exportToCsv } from '../../../utils/csvExport';
import {
  CalendarDays,
  Search,
  Download,
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
} from 'lucide-react';

interface AdminMealScheduleTabProps {
  customers: CustomerRecord[];
  onOpenCustomerProfile?: (customer: CustomerRecord) => void;
  initialDate?: string;
}

export const AdminMealScheduleTab: React.FC<AdminMealScheduleTabProps> = ({
  customers,
  onOpenCustomerProfile,
  initialDate,
}) => {
  const formatYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = useMemo(() => formatYmd(new Date()), []);

  // Selected date defaults to initialDate or today/next weekday
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialDate) return initialDate;
    const now = new Date();
    const day = now.getDay();
    if (day === 0) now.setDate(now.getDate() + 1);
    else if (day === 6) now.setDate(now.getDate() + 2);
    return formatYmd(now);
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Selected Date Object
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }, [selectedDate]);

  // Meal for that date
  const mealForDate: StructuredMeal | null = useMemo(() => {
    return getStructuredMealForDate(selectedDateObj);
  }, [selectedDateObj]);

  // Filter ONLY confirmed customers with active meal on this date
  // Logic:
  // 1. Confirmed payment / Active status
  // 2. Selected this dateStr
  // 3. Has NOT skipped this dateStr
  const deliveryListForDate = useMemo(() => {
    const confirmed = customers.filter(
      (c) => c.status === 'Active' || c.paymentStatus === 'Paid'
    );

    return confirmed
      .filter((cust) => {
        // Customer selected this date
        const hasDate = (cust.selectedDays || []).some((d) => d.dateStr === selectedDate);
        if (!hasDate) return false;

        // Customer did NOT skip this date
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
  }, [customers, selectedDate, mealForDate]);

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
        item.secondAddress.toLowerCase().includes(q)
    );
  }, [deliveryListForDate, searchQuery]);

  const totalConfirmedLunches = deliveryListForDate.length;

  // Date shifting
  const handleShiftDate = (days: number) => {
    const cur = new Date(selectedDateObj);
    cur.setDate(cur.getDate() + days);
    if (cur.getDay() === 0) cur.setDate(cur.getDate() + (days > 0 ? 1 : -2));
    else if (cur.getDay() === 6) cur.setDate(cur.getDate() + (days > 0 ? 2 : -1));
    setSelectedDate(formatYmd(cur));
  };

  const handleDownloadCsv = () => {
    const headers = [
      'Customer Name',
      'Phone Number',
      'Email',
      'Primary Delivery Address',
      'Second Delivery Address',
      'Meal',
      'Swallow Choice',
      'Customer Reference',
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

        <div className="flex items-center space-x-2">
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
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Today
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
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
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
          
          {/* Meal Details */}
          <div className="md:col-span-2 bg-[#FAF7F2] border border-zinc-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4C00]">
                {formattedDateLabel}
              </span>
              <h2 className="text-lg font-bold text-zinc-900">
                {mealForDate ? mealForDate.mealName : 'Kitchen Off / Weekend'}
              </h2>
              {mealForDate && (
                <p className="text-xs text-zinc-600 mt-1">
                  Category: <strong>{mealForDate.mealCategory}</strong> • Protein: <strong>{mealForDate.protein || 'Chef Special'}</strong>
                </p>
              )}
            </div>

            {mealForDate && (
              <div className="pt-3 border-t border-zinc-200/60 mt-3 text-[11px] text-zinc-500 flex flex-wrap items-center gap-2">
                <span>Base: {mealForDate.baseIngredient || 'Standard'}</span>
                <span>•</span>
                <span>Ingredients: {mealForDate.ingredients?.join(', ') || 'Fresh daily'}</span>
              </div>
            )}
          </div>

          {/* Total Confirmed Lunches */}
          <div className="bg-zinc-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Total Confirmed Lunches</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Active & Unskipped
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-white">{totalConfirmedLunches}</span>
                <span className="text-xs text-zinc-400">meals to prepare</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Delivered between 11:00 AM – 12:00 PM
              </p>
            </div>
          </div>

        </div>

        {/* Customer Delivery List */}
        <div className="space-y-3 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Customer Delivery List ({totalConfirmedLunches})
              </h3>
              <p className="text-xs text-zinc-500">
                Every confirmed subscriber receiving lunch at their workstation on {selectedDate}
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
                  : 'No confirmed customers have selected this date (or they have skipped it).'}
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
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Primary Delivery Address</th>
                      <th className="py-3 px-4">Second Delivery Address</th>
                      <th className="py-3 px-4">Meal & Choice</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredDeliveryList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-zinc-900">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-700 text-[11px]">
                          {item.phone}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500">
                          {item.email}
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
                            <span className="ml-1 text-[10px] font-bold text-[#FF4C00] bg-orange-50 px-1.5 py-0.5 rounded">
                              {item.swallowChoice}
                            </span>
                          )}
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
