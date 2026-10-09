import React, { useState } from 'react';
import {
  ChefHat,
  Scale,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Printer,
  Sparkles,
  Utensils,
  MapPin,
  Building,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import { CustomerRecord, CreditRedemptionOrder } from '../../types';
import { getStructuredMealForDate } from '../../data/menuRotation';

interface ProductionDashboardProps {
  customers?: CustomerRecord[];
  creditRedemptions?: CreditRedemptionOrder[];
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  onUpdateCustomer?: (customer: CustomerRecord) => void;
}

export const ProductionDashboard: React.FC<ProductionDashboardProps> = ({
  customers = [],
  creditRedemptions = [],
  selectedDate: propSelectedDate,
  onSelectDate,
  onUpdateCustomer,
}) => {
  // Navigation across calendar dates starting from launch date Dec 7, 2026
  const [internalDate, setInternalDate] = useState<Date>(new Date(2026, 11, 7)); // Monday Dec 7, 2026
  const selectedDate = propSelectedDate || internalDate;
  const setSelectedDate = onSelectDate || setInternalDate;

  const [productionStatus, setProductionStatus] = useState<'Cooking' | 'Ready'>('Cooking');

  const [prepChecklist, setPrepChecklist] = useState<Record<string, boolean>>({
    base: false,
    protein: false,
    veg: false,
    oil: false,
    packs: false,
  });

  // Date formatted to YYYY-MM-DD
  const yyyy = selectedDate.getFullYear();
  const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const dd = String(selectedDate.getDate()).padStart(2, '0');
  const selectedDateStr = `${yyyy}-${mm}-${dd}`;

  const dayOfWeekIndex = selectedDate.getDay();
  const isFriday = dayOfWeekIndex === 5;
  const currentMeal = getStructuredMealForDate(selectedDate);

  // Derive subscribers who have meals on this day from customers list
  const subscribersWithDay = customers.filter((cust) =>
    cust.selectedDays?.some((d) => d.dateStr === selectedDateStr)
  );

  // Build subscriber roster for this day with meal details and swallow choices
  const subscriberRoster = subscribersWithDay.map((cust) => {
    const dayItem = cust.selectedDays.find((d) => d.dateStr === selectedDateStr)!;
    const isSkipped = cust.skippedDates?.includes(selectedDateStr) || cust.dayStatuses?.[selectedDateStr] === 'Skipped';
    const isExtraPlate = cust.extraPlateDates?.includes(selectedDateStr) || cust.dayStatuses?.[selectedDateStr] === 'Extra Plate';

    const portions = isSkipped ? 0 : isExtraPlate ? 2 : 1;
    const status: 'Accepted' | 'Extra Plate' | 'Skipped' = isSkipped
      ? 'Skipped'
      : isExtraPlate
      ? 'Extra Plate'
      : 'Accepted';

    return {
      customerId: cust.id,
      customerName: cust.fullName,
      company: cust.company,
      officeAddress: cust.officeAddress,
      floorSuite: cust.floorSuite,
      phone: cust.phone,
      mealName: dayItem.meal?.mealName || currentMeal?.mealName || 'Scheduled Lunch',
      swallowChoice: dayItem.selectedSwallow || (isFriday ? 'Semo' : undefined),
      portions,
      status,
      notes: cust.notes,
      creditsBalance: cust.creditsBalance ?? 0,
    };
  });

  // Credit redemptions for this day
  const redemptionsOnDay = (creditRedemptions || []).filter(
    (r) => r.status === 'Confirmed' && r.items?.some((it) => it.dateStr === selectedDateStr)
  );

  const creditPortions = redemptionsOnDay.reduce((sum, r) => {
    const it = r.items.find((x) => x.dateStr === selectedDateStr);
    return sum + (it?.portions || 0);
  }, 0);

  // Compute active totals
  const totalSubscribersCooking = subscriberRoster.filter((s) => s.status !== 'Skipped').length;
  const totalSubscriberMeals = subscriberRoster.reduce((sum, s) => sum + s.portions, 0);
  const totalMealsForDay = totalSubscriberMeals + creditPortions;
  const skippedCount = subscriberRoster.filter((s) => s.status === 'Skipped').length;
  const extraPlatesCount = subscriberRoster.filter((s) => s.status === 'Extra Plate').length + redemptionsOnDay.length;

  // Friday Swallow Portions (calculated dynamically from actual subscriber choices)
  let semoCount = 0;
  let ebaCount = 0;
  let fufuCount = 0;

  subscriberRoster.forEach((s) => {
    if (s.portions > 0) {
      if (s.swallowChoice === 'Eba') ebaCount += s.portions;
      else if (s.swallowChoice === 'Fufu') fufuCount += s.portions;
      else semoCount += s.portions; // Default is Semo
    }
  });

  redemptionsOnDay.forEach((r) => {
    const it = r.items.find((x) => x.dateStr === selectedDateStr);
    if (it) {
      if (it.swallowChoice === 'Eba') ebaCount += it.portions;
      else if (it.swallowChoice === 'Fufu') fufuCount += it.portions;
      else semoCount += it.portions;
    }
  });

  const totalSwallowCount = isFriday ? totalMealsForDay : semoCount + ebaCount + fufuCount;

  // Scaled ingredient weights based on meal count
  const rawRiceKg = Math.round((totalMealsForDay * 0.13) * 10) / 10;
  const rawProteinKg = Math.round((totalMealsForDay * 0.09) * 10) / 10;
  const rawVegKg = Math.round((totalMealsForDay * 0.055) * 10) / 10;
  const cookingOilLiters = Math.round((totalMealsForDay * 0.045) * 10) / 10;

  const navigateDay = (direction: 'prev' | 'next') => {
    const next = new Date(selectedDate);
    const step = direction === 'next' ? 1 : -1;
    next.setDate(selectedDate.getDate() + step);
    // Skip weekends
    if (next.getDay() === 6) next.setDate(next.getDate() + (direction === 'next' ? 2 : -1));
    if (next.getDay() === 0) next.setDate(next.getDate() + (direction === 'next' ? 1 : -2));
    setSelectedDate(next);
  };

  const toggleCheck = (k: string) => {
    setPrepChecklist((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Kitchen Operating System
          </span>
          <h2 className="text-2xl font-black text-black mt-0.5">
            Production & Dish Prep
          </h2>
          <p className="text-xs text-zinc-500">
            Real-time subscriber meals synced with kitchen cook sheets. Shows exact food choices, swallow ratios, and scaled ingredients.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-full border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Shift Sheet</span>
          </button>

          <button
            onClick={() => setProductionStatus(productionStatus === 'Cooking' ? 'Ready' : 'Cooking')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm ${
              productionStatus === 'Ready'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#FF4C00] hover:bg-[#E04300] text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{productionStatus === 'Ready' ? '✓ Production Ready' : 'Mark Production Ready'}</span>
          </button>
        </div>
      </div>

      {/* Date Navigation Bar (Synchronized with Orders Tab) */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateDay('prev')}
              className="p-2 rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              title="Previous Workday"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateDay('next')}
              className="p-2 rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              title="Next Workday"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <span className="text-[11px] font-bold text-[#FF4C00] uppercase tracking-wider block">
              Active Production Workday
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

        {/* Quick Date Switcher starting from December 7 */}
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

      {/* Main Shift Overview Card (Shows the Food & Real-Time Sync) */}
      <div className="p-6 rounded-3xl bg-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF4C00] flex items-center justify-center font-black shadow-md">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C00] bg-[#FF4C00]/20 px-2 py-0.5 rounded-md">
                Food Cooking Today
              </span>
              <span className="text-xs text-zinc-400">
                • {totalSubscribersCooking} Active Orders
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mt-1">
              {currentMeal?.mealName || 'Scheduled Workday Dish'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Category: <strong className="text-zinc-200">{currentMeal?.mealCategory || 'Daily Feast'}</strong> • Dispatch Window: 11:00 AM – 12:00 PM
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
          <span className="text-xs text-zinc-400 uppercase font-semibold block">Total Meals to Cook</span>
          <span className="text-3xl sm:text-4xl font-black text-[#FF4C00]">
            {totalMealsForDay} <span className="text-sm font-medium text-white">Packs</span>
          </span>
          {extraPlatesCount > 0 && (
            <span className="text-[11px] text-amber-400 font-bold block">
              Includes {extraPlatesCount} extra plates (credits used)
            </span>
          )}
        </div>
      </div>

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dish Breakdown & Friday Swallow Specification */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* FRIDAY SWALLOW SPECIFICATION: Real-time Swallow Counts based on subscriber preferences */}
          {isFriday ? (
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center space-x-2">
                  <Utensils className="w-5 h-5 text-[#FF4C00]" />
                  <h3 className="text-sm font-bold text-black uppercase tracking-wider">
                    Friday Swallow Portions ({totalMealsForDay} Total Soups)
                  </h3>
                </div>
                <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
                  Soup: {currentMeal?.soup || 'Egusi Soup'}
                </span>
              </div>

              <p className="text-xs text-zinc-500">
                Synced in real time with subscriber calendar choices. Kitchen prep station needs:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                {/* Semo Card */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex flex-col justify-between">
                  <div>
                    <span className="text-zinc-500 font-bold block text-[11px]">Swallow Type</span>
                    <span className="text-xl font-black text-black block mt-0.5">Semo</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between">
                    <span className="text-2xl font-black text-[#FF4C00]">{semoCount}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      {totalMealsForDay > 0 ? Math.round((semoCount / totalMealsForDay) * 100) : 0}% of packs
                    </span>
                  </div>
                </div>

                {/* Eba Card */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex flex-col justify-between">
                  <div>
                    <span className="text-zinc-500 font-bold block text-[11px]">Swallow Type</span>
                    <span className="text-xl font-black text-black block mt-0.5">Eba</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between">
                    <span className="text-2xl font-black text-[#FF4C00]">{ebaCount}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      {totalMealsForDay > 0 ? Math.round((ebaCount / totalMealsForDay) * 100) : 0}% of packs
                    </span>
                  </div>
                </div>

                {/* Fufu Card */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex flex-col justify-between">
                  <div>
                    <span className="text-zinc-500 font-bold block text-[11px]">Swallow Type</span>
                    <span className="text-xl font-black text-black block mt-0.5">Fufu</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between">
                    <span className="text-2xl font-black text-[#FF4C00]">{fufuCount}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      {totalMealsForDay > 0 ? Math.round((fufuCount / totalMealsForDay) * 100) : 0}% of packs
                    </span>
                  </div>
                </div>

              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center justify-between">
                <span>Exact Wraps: {semoCount} Semo • {ebaCount} Eba • {fufuCount} Fufu</span>
                <span className="font-black text-black">= {totalMealsForDay} Portions Total</span>
              </div>
            </div>
          ) : (
            /* STANDARD WORKDAY DISH BREAKDOWN */
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h4 className="text-sm font-bold text-black uppercase tracking-wider flex items-center space-x-2">
                  <ChefHat className="w-4 h-4 text-[#FF4C00]" />
                  <span>Standard Shift Portions</span>
                </h4>
                <span className="text-xs font-black text-black">{totalMealsForDay} Total Packs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200">
                  <span className="text-zinc-500 font-semibold block text-[11px]">Primary Dish</span>
                  <span className="text-xl font-black text-black block mt-0.5">
                    {currentMeal?.mealName || 'Lunch Pack'}
                  </span>
                  <span className="text-xs font-bold text-[#FF4C00] block mt-1">
                    {totalMealsForDay} Portions (Thermal Packs)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200">
                  <span className="text-zinc-500 font-semibold block text-[11px]">Protein Cut</span>
                  <span className="text-xl font-black text-black block mt-0.5">
                    {currentMeal?.protein || 'Standard Protein'}
                  </span>
                  <span className="text-xs font-bold text-zinc-800 block mt-1">
                    {totalMealsForDay} Portions
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* KITCHEN SUBSCRIBER ORDER ROSTER (Synced with individual customer days) */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-[#FF4C00]" />
                <h4 className="text-sm font-bold text-black uppercase tracking-wider">
                  Subscriber Meals on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({subscriberRoster.length})
                </h4>
              </div>
              <span className="text-xs font-bold text-zinc-500">
                {totalMealsForDay} Total Packs to Dispatch
              </span>
            </div>

            {subscriberRoster.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs">
                No subscriber meals scheduled for this workday yet. Navigate to other workdays or assign meals in Customers tab.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 space-y-3">
                {subscriberRoster.map((sub, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-zinc-900 text-sm">{sub.customerName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sub.status === 'Extra Plate'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : sub.status === 'Skipped'
                            ? 'bg-zinc-100 text-zinc-500 line-through'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {sub.status === 'Extra Plate' ? '2 Packs (Extra Plate)' : sub.status === 'Skipped' ? 'Skipped (0 Packs)' : '1 Pack'}
                        </span>
                      </div>
                      <div className="text-zinc-500 text-[11px] flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{sub.company} • {sub.officeAddress} {sub.floorSuite && `(${sub.floorSuite})`}</span>
                      </div>
                      {sub.notes && (
                        <div className="text-[11px] text-[#FF4C00] font-medium pt-0.5">
                          ⚠️ Note: {sub.notes}
                        </div>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="font-bold text-black block">{sub.mealName}</span>
                      {sub.swallowChoice && (
                        <span className="text-[11px] font-bold text-[#FF4C00] block">
                          Swallow: {sub.swallowChoice}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 block">
                        Phone: {sub.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Scaled Kitchen Prep Sheet */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-black uppercase tracking-wider">
                Kitchen Prep Sheet
              </h4>
            </div>
            <span className="text-xs font-bold text-zinc-600">Scaled for {totalMealsForDay} Meals</span>
          </div>

          <p className="text-xs text-zinc-500">
            Check off raw ingredients as pots and weighing stations finish measuring:
          </p>

          <div className="space-y-2.5 text-xs">
            
            <div
              onClick={() => toggleCheck('base')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                prepChecklist['base'] ? 'bg-emerald-50/70 border-emerald-200' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={prepChecklist['base']}
                  onChange={() => {}}
                  className="rounded text-emerald-600"
                />
                <span className="font-bold text-black">
                  {isFriday ? 'Swallow (Eba / Semo / Fufu)' : (currentMeal?.mealName || 'Main Food Prep')}
                </span>
              </div>
              <span className="font-black text-sm text-zinc-900">{rawRiceKg} kg</span>
            </div>

            <div
              onClick={() => toggleCheck('protein')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                prepChecklist['protein'] ? 'bg-emerald-50/70 border-emerald-200' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={prepChecklist['protein']}
                  onChange={() => {}}
                  className="rounded text-emerald-600"
                />
                <span className="font-bold text-black">
                  {currentMeal?.protein || 'Protein (Beef / Chicken / Fish)'}
                </span>
              </div>
              <span className="font-black text-sm text-zinc-900">{rawProteinKg} kg</span>
            </div>

            <div
              onClick={() => toggleCheck('veg')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                prepChecklist['veg'] ? 'bg-emerald-50/70 border-emerald-200' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={prepChecklist['veg']}
                  onChange={() => {}}
                  className="rounded text-emerald-600"
                />
                <span className="font-bold text-black">
                  {isFriday ? 'Soup Greens (Ugwu / Bitterleaf / Shoko)' : 'Carrots & Vegetables'}
                </span>
              </div>
              <span className="font-black text-sm text-zinc-900">{rawVegKg} kg</span>
            </div>

            <div
              onClick={() => toggleCheck('oil')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                prepChecklist['oil'] ? 'bg-emerald-50/70 border-emerald-200' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={prepChecklist['oil']}
                  onChange={() => {}}
                  className="rounded text-emerald-600"
                />
                <span className="font-bold text-black">Cooking Oil</span>
              </div>
              <span className="font-black text-sm text-zinc-900">{cookingOilLiters} Liters</span>
            </div>

            <div
              onClick={() => toggleCheck('packs')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                prepChecklist['packs'] ? 'bg-emerald-50/70 border-emerald-200' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={prepChecklist['packs']}
                  onChange={() => {}}
                  className="rounded text-emerald-600"
                />
                <span className="font-bold text-black">Eco Packaging Packs & Thermal Bags</span>
              </div>
              <span className="font-black text-sm text-zinc-900">{totalMealsForDay} Units</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
