import React, { useEffect, useMemo, useState } from 'react';
import { CorporateAccount, CorporateEmployeeRecord } from '../../types';
import {
  db,
  doc,
  onSnapshot,
  subscribeToCorporateEmployees,
  getCorporateAccountByInviteCode,
} from '../../services/firebase';
import {
  isCorporateRecordedAsDeleted,
  isCustomerRecordedAsDeleted,
} from '../../utils/customerDeletions';
import { CONTACT_CONFIG } from '../../config/contactConfig';
import {
  Building2,
  Users,
  CheckCircle2,
  Utensils,
  Truck,
  Wallet,
  Copy,
  Check,
  LogOut,
  Eye,
  Lock,
  Phone,
  Mail,
  MapPin,
  Search,
  CalendarDays,
  MessageSquare,
} from 'lucide-react';

interface CompanyDashboardPageProps {
  corporateAccount: CorporateAccount;
  isDemoMode?: boolean;
  demoEmployees?: CorporateEmployeeRecord[];
  onLogout: () => void;
  onAccountDeleted?: () => void;
  embedded?: boolean;
}

export const CompanyDashboardPage: React.FC<CompanyDashboardPageProps> = ({
  corporateAccount,
  isDemoMode = false,
  demoEmployees = [],
  onLogout,
  onAccountDeleted,
  embedded = false,
}) => {
  const [liveAccount, setLiveAccount] = useState<CorporateAccount>(corporateAccount);
  const [employees, setEmployees] = useState<CorporateEmployeeRecord[]>(
    isDemoMode ? demoEmployees : []
  );
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStaffIds, setExpandedStaffIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLiveAccount(corporateAccount);
    if (isDemoMode) {
      setEmployees(demoEmployees);
    }
  }, [corporateAccount, isDemoMode, demoEmployees]);

  useEffect(() => {
    if (isDemoMode || !corporateAccount.id) return;

    if (isCorporateRecordedAsDeleted(corporateAccount.id)) {
      onAccountDeleted?.();
      return;
    }

    let hasSeenRemoteDoc = false;
    const unsubAcct = onSnapshot(
      doc(db, 'corporateAccounts', corporateAccount.id),
      (snap) => {
        const isFromCache = snap.metadata.fromCache;
        if (snap.exists()) {
          hasSeenRemoteDoc = true;
          const data = { ...(snap.data() as CorporateAccount), id: snap.id };
          setLiveAccount(data);
        } else if (hasSeenRemoteDoc && !isFromCache) {
          onAccountDeleted?.();
        }
      },
      (err) => {
        console.warn('[CompanyDashboard] Corporate account listener notice:', err);
      }
    );

    const unsubEmps = subscribeToCorporateEmployees(corporateAccount.id, (list) => {
      setEmployees(list.filter((e) => !isCustomerRecordedAsDeleted(e.id)));
    });

    // Also refresh by invite code once in case id synced remotely
    if (corporateAccount.inviteCode) {
      getCorporateAccountByInviteCode(corporateAccount.inviteCode)
        .then((fresh) => {
          if (fresh && fresh.id === corporateAccount.id) {
            setLiveAccount(fresh);
          }
        })
        .catch(() => {});
    }

    return () => {
      unsubAcct();
      unsubEmps();
    };
  }, [corporateAccount.id, corporateAccount.inviteCode, isDemoMode]);

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.11to12.food'}/?corp=${liveAccount.inviteCode}`;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleLogoReloadHome = () => {
    try {
      localStorage.removeItem('11to12_active_view_mode');
      localStorage.removeItem('11to12_corporate_session_v1');
      localStorage.removeItem('11to12_subscriber_profile');
      localStorage.removeItem('11to12_user_profile');
    } catch {}
    window.location.href = '/';
  };

  const stats = useMemo(() => {
    const invited = liveAccount.totalEmployees || 0;
    const claimed = isDemoMode
      ? Math.max(liveAccount.usedSlots || 0, employees.length)
      : employees.length;
    const openSlots = Math.max(0, invited - claimed);
    const totalPlatesAllocated = employees.reduce(
      (sum, emp) => sum + (emp.selectedDays?.length || 0),
      0
    );
    const totalCredits = liveAccount.totalMealCredits || invited * (liveAccount.mealDaysPerEmployee || 5);
    const remainingCredits = Math.max(0, totalCredits - totalPlatesAllocated);

    const dailyMap = new Map<string, { dateStr: string; count: number; opt1: number; opt2: number }>();
    employees.forEach((emp) => {
      (emp.selectedDays || []).forEach((sel) => {
        const cur = dailyMap.get(sel.dateStr) || {
          dateStr: sel.dateStr,
          count: 0,
          opt1: 0,
          opt2: 0,
        };
        cur.count += 1;
        if (sel.selectedMealOption?.id === 'opt-2') cur.opt2 += 1;
        else cur.opt1 += 1;
        dailyMap.set(sel.dateStr, cur);
      });
    });

    const dailyMealsBreakdown = Array.from(dailyMap.values()).sort((a, b) =>
      a.dateStr.localeCompare(b.dateStr)
    );

    return {
      invited,
      claimed,
      openSlots,
      totalPlatesAllocated,
      remainingCredits,
      dailyMealsBreakdown,
    };
  }, [liveAccount, employees, isDemoMode]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(q) ||
        (emp.email || '').toLowerCase().includes(q) ||
        (emp.department || '').toLowerCase().includes(q) ||
        (emp.deskLocation || '').toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const formatDateNice = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      return dt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const toggleExpandStaff = (empId: string) => {
    setExpandedStaffIds((prev) => ({
      ...prev,
      [empId]: prev[empId] === undefined ? false : !prev[empId],
    }));
  };

  const adminWaHelpUrl = `https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
    `Hello 11:12 Food Admin, this is ${liveAccount.companyName} (${liveAccount.inviteCode}). We would like to request a staff roster update or removal from our corporate plan.`
  )}`;

  const content = (
    <div className="space-y-6 font-['Poppins']">
      {/* Orange Gradient Company Identity Banner */}
      <div className="bg-gradient-to-br from-[#FF4C00] via-[#FF5E14] to-[#FF8533] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-orange-100 font-bold">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>{isDemoMode ? 'Sample Company Portal' : 'Company Portal · Read-Only View'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Access Code: {liveAccount.accessCode}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight truncate">
            {liveAccount.companyName}
          </h1>
          <p className="text-xs sm:text-sm text-orange-50">
            HR Contact: <strong>{liveAccount.adminName}</strong> ({liveAccount.adminEmail}) ·{' '}
            {liveAccount.officeAddress}
          </p>
        </div>

        {liveAccount.paymentStatus === 'Confirmed' ? (
          <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-4 space-y-2.5 lg:min-w-[390px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Staff Invitation Link</span>
              <span className="font-mono text-orange-100 font-bold">{liveAccount.inviteCode}</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl">
              <span className="text-xs font-mono text-zinc-800 truncate flex-1">{inviteUrl}</span>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="px-3 py-1.5 rounded-lg bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold cursor-pointer flex items-center space-x-1 shrink-0"
              >
                {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedInvite ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
            <div className="text-[11px] text-orange-50 font-medium tabular-nums">
              {stats.claimed} of {stats.invited} staff slots claimed · {stats.openSlots} open slots
            </div>
          </div>
        ) : (
          <div className="bg-white text-zinc-900 rounded-2xl p-4 lg:max-w-sm space-y-1.5 shadow-sm">
            <div className="text-xs font-black text-amber-700 uppercase tracking-wider">
              Awaiting Admin Confirmation
            </div>
            <p className="text-xs text-zinc-600">
              Your employee invitation link activates automatically once 11:12 Admin confirms your payment.
            </p>
          </div>
        )}
      </div>

      {/* Read-Only Governance Banner (Light Orange Card) */}
      <div className="bg-gradient-to-br from-[#FFF4ED] to-[#FFE7D6] border border-orange-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 text-[#FF4C00] flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-zinc-800">
            <div className="font-black text-black flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#FF4C00]" />
              <span>View-Only Company Dashboard</span>
            </div>
            <p className="text-xs text-zinc-700 leading-relaxed">
              You can monitor all staff members who claimed slots using your link and inspect the exact meal dishes each employee selected for every day. Staff rosters cannot be modified or deleted directly from this portal — to remove any individual staff member, please contact 11:12 Admin on{' '}
              <strong>{CONTACT_CONFIG.whatsappDisplay}</strong> or{' '}
              <strong>{CONTACT_CONFIG.supportEmail}</strong>.
            </p>
          </div>
        </div>
        <a
          href={adminWaHelpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 border border-orange-300 text-[#FF4C00] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-2xs"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Contact Admin to Remove Staff</span>
        </a>
      </div>

      {/* Key Metric Cards — Strictly Gray & White (Zero Black Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
            <span>Purchased Staff Slots</span>
            <Users className="w-4 h-4 text-[#FF4C00]" />
          </div>
          <div className="text-3xl font-black text-black mt-2 tabular-nums">
            {stats.claimed} <span className="text-base font-bold text-zinc-400">/ {stats.invited}</span>
          </div>
          <p className="text-xs text-zinc-600 mt-1 tabular-nums">{stats.openSlots} open slots available</p>
        </div>

        <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
            <span>Days Per Staff</span>
            <CalendarDays className="w-4 h-4 text-[#FF4C00]" />
          </div>
          <div className="text-3xl font-black text-black mt-2 tabular-nums">
            {liveAccount.mealDaysPerEmployee} Days
          </div>
          <p className="text-xs text-zinc-600 mt-1 tabular-nums">
            {stats.totalPlatesAllocated.toLocaleString()} total meals picked
          </p>
        </div>

        <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
            <span>Unclaimed Meal Credits</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-black mt-2 tabular-nums">
            {stats.remainingCredits.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            Package Total: ₦{(liveAccount.totalPackageNGN || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
            <span>Delivery Status</span>
            <Truck className="w-4 h-4 text-[#FF4C00]" />
          </div>
          <div className="text-2xl font-black text-black mt-2">{liveAccount.deliveryStatus}</div>
          <p className="text-xs text-zinc-600 mt-1">11:00 AM – 12:00 PM Delivery Window</p>
        </div>
      </div>

      {/* Main Grid: Staff Members & Every Daily Meal Choice + Daily Kitchen Tally */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Top: Staff Members Who Used the Link & Their Meal Picks Per Day */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-black">
                Staff Members &amp; Daily Meal Selections ({employees.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Every staff member who redeemed your invite link ({liveAccount.inviteCode}) and the meals they chose for each day.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff name, email, dept..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 text-xs focus:border-[#FF4C00] outline-none bg-zinc-50"
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-100 text-center space-y-1.5">
              <Users className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm font-bold text-black">
                {employees.length === 0
                  ? 'No Staff Members Have Used Your Link Yet'
                  : 'No Staff Member Matches Your Search'}
              </p>
              <p className="text-xs text-zinc-600">
                {employees.length === 0
                  ? `Share ${inviteUrl} with your team so they can claim their meal slots.`
                  : 'Try clearing the search input.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map((emp, idx) => {
                const sortedDays = [...(emp.selectedDays || [])].sort((a, b) =>
                  a.dateStr.localeCompare(b.dateStr)
                );
                const isExpanded = expandedStaffIds[emp.id] !== false; // Expanded by default so meals per day are immediately visible

                return (
                  <div
                    key={emp.id}
                    className="bg-zinc-100 border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-4"
                  >
                    {/* Staff Member Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-[#FF4C00] tabular-nums">
                            #{idx + 1}
                          </span>
                          <h3 className="text-base font-black text-black">{emp.fullName}</h3>
                          {emp.department && (
                            <span className="px-2.5 py-0.5 rounded-full bg-white border border-zinc-300 text-[11px] font-bold text-zinc-700">
                              {emp.department}
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Slot Claimed</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-zinc-400" />
                            {emp.email}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-zinc-400" />
                            {emp.phone}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div className="text-xs font-black text-[#FF4C00] tabular-nums">
                          {sortedDays.length} / {emp.mealDaysAllocated} Meal Days Picked
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleExpandStaff(emp.id)}
                          className="px-3 py-1 rounded-lg bg-white border border-zinc-300 hover:bg-zinc-50 text-[11px] font-bold text-zinc-800 cursor-pointer"
                        >
                          {isExpanded ? 'Hide Daily Meals' : `Show ${sortedDays.length} Daily Meals`}
                        </button>
                      </div>
                    </div>

                    {/* Delivery Locations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white border border-zinc-200 rounded-xl p-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Primary Delivery Address
                        </span>
                        <span className="font-semibold text-zinc-800 inline-flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#FF4C00] shrink-0" />
                          <span>{emp.deskLocation}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Second Address
                        </span>
                        <span className="font-semibold text-zinc-700 mt-0.5 block">
                          {emp.secondAddress || 'Not specified'}
                        </span>
                      </div>
                    </div>

                    {/* Per-Day Meal Selections */}
                    {isExpanded && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-[#FF4C00]" />
                          <span>Meals Chosen Per Day (View Only)</span>
                        </div>

                        {sortedDays.length === 0 ? (
                          <div className="p-3 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-500">
                            No meal dates recorded for this staff member.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sortedDays.map((sel, dayIdx) => {
                              const optLabel =
                                sel.selectedMealOption?.id === 'opt-2' ? 'Option 2' : 'Option 1';
                              const dishName =
                                sel.selectedMealOption?.name || sel.meal?.mealName || 'Scheduled Meal';
                              return (
                                <div
                                  key={sel.dateStr}
                                  className="bg-white border border-zinc-200 rounded-xl p-3 flex items-start justify-between gap-2 text-xs"
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-[#FF4C00] uppercase tracking-wider tabular-nums">
                                        Day {dayIdx + 1} · {formatDateNice(sel.dateStr)}
                                      </span>
                                    </div>
                                    <div className="font-bold text-black leading-snug">
                                      {dishName}
                                    </div>
                                    {sel.selectedSwallow && (
                                      <div className="text-[11px] font-semibold text-zinc-600">
                                        Swallow Choice: <strong>{sel.selectedSwallow}</strong>
                                      </div>
                                    )}
                                  </div>
                                  <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[#FF4C00] text-[10px] font-bold shrink-0">
                                    {optLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Daily Kitchen Meal Tally */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <div>
            <h2 className="text-base font-black text-black">Daily Meals Tally</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Total plates scheduled for your team per workday.
            </p>
          </div>

          {stats.dailyMealsBreakdown.length === 0 ? (
            <div className="p-6 rounded-2xl bg-zinc-100 text-center text-xs font-semibold text-zinc-600">
              No daily totals yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 px-2 text-right">Opt 1</th>
                    <th className="py-2 px-2 text-right">Opt 2</th>
                    <th className="py-2 pl-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 tabular-nums">
                  {stats.dailyMealsBreakdown.map((row) => (
                    <tr key={row.dateStr}>
                      <td className="py-2.5 pr-2 font-bold text-zinc-900">
                        {formatDateNice(row.dateStr)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-zinc-600">{row.opt1}</td>
                      <td className="py-2.5 px-2 text-right text-zinc-600">{row.opt2}</td>
                      <td className="py-2.5 pl-2 text-right font-black text-[#FF4C00]">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins']">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleLogoReloadHome}
              title="Reload 11:12 Homepage"
              className="flex items-center gap-2 cursor-pointer shrink-0"
            >
              <img
                src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                alt="11 to 12 Logo"
                className="h-9 w-auto object-contain"
              />
            </button>
            <div className="hidden sm:block border-l border-zinc-200 pl-3 min-w-0">
              <div className="text-xs font-black text-black truncate">{liveAccount.companyName}</div>
              <div className="text-[11px] font-semibold text-[#FF4C00]">
                Company Meal Portal (Read-Only)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs font-bold transition cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 text-[#FF4C00]" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {content}
      </main>
    </div>
  );
};
