import React from 'react';
import {
  Users,
  Utensils,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChefHat,
  ShieldCheck,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { OrderSubmission, CustomerRecord, WaitlistLead } from '../../types';
import { AdminTab } from './AdminSidebar';
import { computeFinancialLedger } from '../../utils/finance';

interface TodayOperationsViewProps {
  onNavigateTab: (tab: AdminTab) => void;
  submittedOrders?: OrderSubmission[];
  customers?: CustomerRecord[];
  waitlistLeads?: WaitlistLead[];
}

export const TodayOperationsView: React.FC<TodayOperationsViewProps> = ({
  onNavigateTab,
  submittedOrders = [],
  customers = [],
  waitlistLeads = [],
}) => {
  // Derive all operational metrics purely from live state
  const activeSubscribersCount = customers.filter((c) => c.status === 'Active').length;
  const waitlistCount = waitlistLeads.length;

  // Calculate unified live financials matching Revenue Collected across ledger
  const financials = computeFinancialLedger(submittedOrders, customers);
  const pendingOrders = submittedOrders.filter(
    (o) => o.paymentStatus === 'Pending Verification'
  );

  // Today's date (formatted)
  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Calculate meals scheduled specifically for today from customer plans
  let mealsTodayCount = 0;
  customers.forEach((c) => {
    if (c.selectedDays && c.selectedDays.some((d) => d.dateStr === todayDateStr)) {
      mealsTodayCount += 1;
    }
  });

  const deliveriesTodayCount = mealsTodayCount;
  const skippedCount = 0; // Starts clean
  const issuesCount = pendingOrders.length;

  const kpis = [
    {
      label: 'Active Subscribers',
      value: `${activeSubscribersCount}`,
      sub: activeSubscribersCount > 0 ? 'Verified corporate accounts' : 'Awaiting customer onboarding',
      icon: Users,
      color: activeSubscribersCount > 0 ? 'text-zinc-900' : 'text-zinc-400',
    },
    {
      label: 'Waitlist Leads',
      value: `${waitlistCount}`,
      sub: waitlistCount > 0 ? `${waitlistCount} website signups` : 'No leads yet',
      icon: Sparkles,
      color: waitlistCount > 0 ? 'text-[#FF4C00]' : 'text-zinc-400',
    },
    {
      label: 'Meals Today',
      value: `${mealsTodayCount}`,
      sub: mealsTodayCount > 0 ? 'Scheduled in meal calendars' : 'No meals scheduled today',
      icon: Utensils,
      color: mealsTodayCount > 0 ? 'text-zinc-900' : 'text-zinc-400',
    },
    {
      label: 'Deliveries Today',
      value: `${deliveriesTodayCount}`,
      sub: deliveriesTodayCount > 0 ? 'Desk drop routes' : 'No routes active',
      icon: Clock,
      color: deliveriesTodayCount > 0 ? 'text-zinc-900' : 'text-zinc-400',
    },
    {
      label: 'Revenue Captured',
      value: `₦${financials.revenueCollected.toLocaleString()}`,
      sub: financials.revenueCollected > 0 ? 'Matches Revenue Collected in Ledger' : '₦0 collected so far',
      icon: CreditCard,
      color: financials.revenueCollected > 0 ? 'text-emerald-600' : 'text-zinc-400',
    },
    {
      label: 'Pending Invoices',
      value: `₦${financials.revenuePending.toLocaleString()}`,
      sub: financials.revenuePending > 0 ? `${pendingOrders.length} slip(s) to verify` : '0 pending verification',
      icon: Clock,
      color: financials.revenuePending > 0 ? 'text-amber-600' : 'text-zinc-400',
    },
    {
      label: 'Skipped Meals',
      value: `${skippedCount}`,
      sub: 'Auto-credited to bank',
      icon: RotateCcw,
      color: 'text-zinc-400',
    },
    {
      label: 'Action Items',
      value: `${issuesCount}`,
      sub: issuesCount > 0 ? 'Invoices requiring approval' : 'All clear',
      icon: AlertTriangle,
      color: issuesCount > 0 ? 'text-rose-600' : 'text-zinc-400',
    },
  ];

  return (
    <div className="space-y-8 font-['Poppins']">
      
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Mission Control • Daily Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black mt-0.5">
            Today's Operations
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal">
            Real-time daily roster, scheduled meals, and action items synced from live customers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-900 text-white shadow-xs">
            <span className={`w-2 h-2 rounded-full mr-2 ${activeSubscribersCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
            TODAY — {todayFormatted}
          </span>
        </div>
      </div>

      {/* 8 Dynamic Top-Level KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition"
            >
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold text-zinc-500 truncate">{kpi.label}</span>
                <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
              </div>
              <div className={`text-2xl sm:text-3xl font-black tracking-tight ${kpi.color}`}>
                {kpi.value}
              </div>
              <span className="text-[11px] font-medium text-zinc-400 block mt-1 truncate">
                {kpi.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* Operations Quick Sheet & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Operational Summary */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Daily Roster
              </span>
              <h3 className="text-xl font-black text-black">
                Shift Schedule
              </h3>
            </div>
            <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full">
              Dispatch Window: 10:45 AM
            </span>
          </div>

          {activeSubscribersCount === 0 && submittedOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
                <ShieldCheck className="w-6 h-6 text-zinc-500" />
              </div>
              <h4 className="text-base font-black text-zinc-900">
                Clean Slate: No Active Subscribers Yet
              </h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                When a user places an order on the homepage or you onboard a customer via the meal calendar picker, their daily meals and desk drop schedules will appear here automatically.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateTab('customers')}
                  className="px-5 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Onboard First Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('menu')}
                  className="px-5 py-2.5 rounded-full border border-zinc-300 hover:bg-white text-zinc-700 font-bold text-xs transition cursor-pointer"
                >
                  Review Weekly Menu
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80">
                <span className="text-[11px] font-semibold text-zinc-500 block">Meals to Prepare</span>
                <span className="text-2xl font-black text-black">{mealsTodayCount}</span>
                <span className="text-[10px] text-zinc-400 block">Hot food production</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80">
                <span className="text-[11px] font-semibold text-zinc-500 block">Meals to Deliver</span>
                <span className="text-2xl font-black text-black">{deliveriesTodayCount}</span>
                <span className="text-[10px] text-zinc-400 block">Desk drop drops</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80">
                <span className="text-[11px] font-semibold text-zinc-500 block">Skipped by Customers</span>
                <span className="text-2xl font-black text-zinc-600">0</span>
                <span className="text-[10px] text-zinc-400 block">Credit refunded</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80">
                <span className="text-[11px] font-semibold text-zinc-500 block">Active Subscribers</span>
                <span className="text-2xl font-black text-zinc-900">{activeSubscribersCount}</span>
                <span className="text-[10px] text-zinc-400 block">Verified profiles</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80">
                <span className="text-[11px] font-semibold text-zinc-500 block">Pending Invoices</span>
                <span className="text-2xl font-black text-amber-700">{pendingOrders.length}</span>
                <span className="text-[10px] text-zinc-400 block">Awaiting confirmation</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-800 block">On-Time Projection</span>
                <span className="text-2xl font-black text-emerald-700">100%</span>
                <span className="text-[10px] text-emerald-600 block">Target: 11:00 AM</span>
              </div>
            </div>
          )}

          {/* Quick Direct Routing Buttons */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => onNavigateTab('production')}
              className="px-5 py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center space-x-2"
            >
              <ChefHat className="w-4 h-4 text-[#FF4C00]" />
              <span>View Production Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('customers')}
              className="px-5 py-3 rounded-full bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-zinc-500" />
              <span>Customers ({customers.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {submittedOrders.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="px-5 py-3 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FF4C00] font-bold text-xs uppercase tracking-wider transition cursor-pointer ml-auto flex items-center space-x-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Verify Invoices ({submittedOrders.length})</span>
              </button>
            )}
          </div>

        </div>

        {/* Attention Box */}
        <div className="bg-zinc-950 text-white rounded-3xl border border-zinc-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Attention Required</h3>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                issuesCount > 0 ? 'bg-amber-950/80 text-amber-400 border-amber-800' : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
              }`}>
                {issuesCount > 0 ? `${issuesCount} Items` : 'All Clear'}
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              {pendingOrders.length > 0 ? (
                pendingOrders.map((ord) => {
                  const ordEmail = (ord.email || '').trim().toLowerCase();
                  const isTopUp = ord.isTopUp || Boolean(ordEmail && customers.some((c) => (c.email || '').trim().toLowerCase() === ordEmail));
                  return (
                    <div
                      key={ord.id}
                      onClick={() => onNavigateTab(isTopUp ? 'orders' : 'customers')}
                      className={`p-3 rounded-xl bg-zinc-900 border transition cursor-pointer flex items-start space-x-2.5 ${
                        isTopUp ? 'border-[#FF4C00]/60 hover:border-[#FF4C00]' : 'border-amber-600/40 hover:border-amber-500'
                      }`}
                    >
                      <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${isTopUp ? 'text-[#FF4C00]' : 'text-amber-500'}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white block">
                            {isTopUp ? `🔔 Paid Top-Up: ${ord.fullName}` : `Pending Verification: ${ord.fullName}`}
                          </span>
                          {isTopUp && (
                            <span className="px-1.5 py-0.2 rounded bg-[#FF4C00] text-white text-[9px] font-black uppercase">
                              +{ord.totalDays} Days
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          {isTopUp
                            ? `${ord.company} • ₦${(ord.finalTotalNGN || 0).toLocaleString()}. Click to verify & add days to calendar.`
                            : `${ord.company} • ₦${(ord.finalTotalNGN || 0).toLocaleString()} (${ord.totalDays || 0} days). Click to sync.`}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : waitlistCount > 0 ? (
                <div
                  onClick={() => onNavigateTab('waitlist')}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer flex items-start space-x-2.5"
                >
                  <Sparkles className="w-4 h-4 text-[#FF4C00] mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">
                      {waitlistCount} Prospective Leads on Waitlist
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Website visitors waiting for desk drop launch. Follow up via WhatsApp to onboard them.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  <span className="font-bold text-white block">All Systems Green</span>
                  <p className="text-[11px] text-zinc-400">
                    No urgent operational bottlenecks or unresolved tickets.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 mt-6 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Status: Ready for dispatch</span>
            <span className="font-bold text-white">Flutterwave MFB Connected</span>
          </div>

        </div>

      </div>

    </div>
  );
};
