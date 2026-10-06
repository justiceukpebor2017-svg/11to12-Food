import React, { useState } from 'react';
import {
  CalendarDays,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  PlusCircle,
  Bell,
  Utensils,
  MinusCircle,
} from 'lucide-react';

interface SubscriptionItem {
  id: string;
  customerName: string;
  company: string;
  plan: string;
  totalSubscribedDays: number;
  daysDelivered: number;
  daysRemaining: number;
  selectedDays: string[];
  priceNGN: number;
  paymentStatus: 'Paid' | 'Pending verification';
  creditsNGN: number;
  status: 'Active' | 'Low Days' | 'Finished';
}

export const SubscriptionsManager: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Low Days' | 'Finished'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // Clean slate subscriptions (populated when customers subscribe or are onboarded)
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);

  const handleLogDeliveredDay = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (s.daysRemaining <= 0) return s;
          const nextDelivered = s.daysDelivered + 1;
          const nextRemaining = Math.max(0, s.totalSubscribedDays - nextDelivered);
          const nextStatus = nextRemaining === 0 ? 'Finished' : nextRemaining <= 5 ? 'Low Days' : 'Active';
          return {
            ...s,
            daysDelivered: nextDelivered,
            daysRemaining: nextRemaining,
            status: nextStatus,
          };
        }
        return s;
      })
    );
  };

  const handleAddDays = (id: string, daysToAdd: number) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextTotal = s.totalSubscribedDays + daysToAdd;
          const nextRemaining = nextTotal - s.daysDelivered;
          const nextStatus = nextRemaining <= 5 ? 'Low Days' : 'Active';
          return {
            ...s,
            totalSubscribedDays: nextTotal,
            daysRemaining: nextRemaining,
            status: nextStatus,
          };
        }
        return s;
      })
    );
    setReminderToast(`Added +${daysToAdd} days to subscription!`);
    setTimeout(() => setReminderToast(null), 3500);
  };

  const handleSendReminder = (customerName: string, daysLeft: number) => {
    setReminderToast(
      `Renewal Reminder sent to ${customerName}! (${daysLeft} days remaining on lunch plan)`
    );
    setTimeout(() => setReminderToast(null), 4000);
  };

  const filtered = subscriptions.filter((s) => {
    if (!s) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesFilter = activeFilter === 'All' ? true : s.status === activeFilter;
    const matchesSearch =
      !term ||
      (s.customerName || '').toLowerCase().includes(term) ||
      (s.company || '').toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const finishedCount = subscriptions.filter((s) => s.status === 'Finished').length;
  const lowDaysCount = subscriptions.filter((s) => s.status === 'Low Days').length;

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Subscription Days Engine
          </span>
          <h2 className="text-2xl font-black text-black mt-0.5">
            Subscriptions & Days Remaining Tracker
          </h2>
          <p className="text-xs text-zinc-500">
            Monitor countdown of subscribed days. Users with 0 days are auto-halted so no food is delivered without renewal.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {finishedCount > 0 && (
            <span className="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-full flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{finishedCount} Finished (Food Halted)</span>
            </span>
          )}
          {lowDaysCount > 0 && (
            <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full flex items-center space-x-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>{lowDaysCount} Low Days (Remind)</span>
            </span>
          )}
        </div>
      </div>

      {reminderToast && (
        <div className="p-4 rounded-2xl bg-black text-white text-xs font-bold flex items-center space-x-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#FF4C00] shrink-0" />
          <span>{reminderToast}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-zinc-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFilter === 'All'
                ? 'bg-black text-white'
                : 'bg-[#FAF7F2] text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
            }`}
          >
            All Subscriptions ({subscriptions.length})
          </button>
          
          <button
            onClick={() => setActiveFilter('Active')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFilter === 'Active'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#FAF7F2] text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
            }`}
          >
            Healthy Days ({subscriptions.filter((s) => s.status === 'Active').length})
          </button>

          <button
            onClick={() => setActiveFilter('Low Days')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFilter === 'Low Days'
                ? 'bg-[#FF4C00] text-white'
                : 'bg-[#FAF7F2] text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
            }`}
          >
            Low Days Remaining ({lowDaysCount})
          </button>

          <button
            onClick={() => setActiveFilter('Finished')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFilter === 'Finished'
                ? 'bg-rose-600 text-white'
                : 'bg-[#FAF7F2] text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
            }`}
          >
            Finished / Halted ({finishedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search subscriber, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-zinc-200 rounded-xl pl-10 pr-4 py-1.5 text-xs font-medium text-black focus:outline-none"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Subscriber</th>
                <th className="py-3 px-4">Subscribed Plan</th>
                <th className="py-3 px-4">Days Progress</th>
                <th className="py-3 px-4">Days Remaining</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.map((sub) => {
                const percent = Math.min(100, Math.round((sub.daysDelivered / sub.totalSubscribedDays) * 100));

                return (
                  <tr key={sub.id} className="hover:bg-zinc-50/70 transition">
                    
                    {/* Subscriber & Company */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-black block">{sub.customerName}</span>
                      <span className="text-[11px] text-zinc-400 font-medium">{sub.company}</span>
                    </td>

                    {/* Subscribed Plan */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-zinc-900 block">{sub.plan}</span>
                      <span className="text-[10px] text-zinc-400">Total {sub.totalSubscribedDays} Lunch Days</span>
                    </td>

                    {/* Progress Bar (Delivered vs Total) */}
                    <td className="py-3.5 px-4 min-w-[150px]">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 mb-1">
                        <span>{sub.daysDelivered} Delivered</span>
                        <span>{sub.totalSubscribedDays} Total</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sub.daysRemaining === 0
                              ? 'bg-rose-500'
                              : sub.daysRemaining <= 5
                              ? 'bg-[#FF4C00]'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    {/* Days Remaining Countdown */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-base font-black ${
                            sub.daysRemaining === 0
                              ? 'text-rose-600'
                              : sub.daysRemaining <= 5
                              ? 'text-[#FF4C00]'
                              : 'text-emerald-700'
                          }`}
                        >
                          {sub.daysRemaining} Days Left
                        </span>
                      </div>
                    </td>

                    {/* Delivery Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {sub.daysRemaining === 0 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                            🚫 Auto-Halted (0 Days)
                          </span>
                          <span className="block text-[10px] text-rose-600 font-semibold">
                            No food dispatched
                          </span>
                        </div>
                      ) : sub.daysRemaining <= 5 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                            ⚠️ Renewal Reminder Active
                          </span>
                          <span className="block text-[10px] text-amber-700 font-semibold">
                            Expiring in {sub.daysRemaining} days
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          ✓ Active Delivery
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* Send Reminder button if low days or finished */}
                        {sub.daysRemaining <= 5 && (
                          <button
                            onClick={() => handleSendReminder(sub.customerName, sub.daysRemaining)}
                            title="Send WhatsApp/Email reminder to add more days"
                            className="px-2.5 py-1 rounded-lg bg-black hover:bg-zinc-800 text-white text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3 text-[#FF4C00]" />
                            <span>Remind</span>
                          </button>
                        )}

                        {/* Log 1 Delivered Day */}
                        {sub.daysRemaining > 0 && (
                          <button
                            onClick={() => handleLogDeliveredDay(sub.id)}
                            title="Log 1 day delivered (reduces remaining days by 1)"
                            className="px-2 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-[11px] font-semibold cursor-pointer"
                          >
                            -1 Day
                          </button>
                        )}

                        {/* Add Days / Top Up */}
                        <button
                          onClick={() => handleAddDays(sub.id, 20)}
                          title="Add 20 Days to Plan"
                          className="px-2.5 py-1 rounded-lg bg-[#FF4C00]/10 hover:bg-[#FF4C00]/20 text-[#FF4C00] text-[11px] font-bold cursor-pointer"
                        >
                          +20 Days
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
