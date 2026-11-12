import React, { useEffect, useMemo, useState } from 'react';
import {
  CorporateAccount,
  CorporateEmployeeRecord,
} from '../../../types';
import {
  subscribeToAllCorporateAccounts,
  subscribeToAllCorporateEmployees,
  confirmCorporateAccountAndOrder,
  saveCorporateAccountToFirestore,
} from '../../../services/firebase';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  MessageSquare,
  Mail,
  ExternalLink,
  Search,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Phone,
  Utensils,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminCompaniesTab: React.FC = () => {
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [employees, setEmployees] = useState<CorporateEmployeeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubAccts = subscribeToAllCorporateAccounts((list) => setAccounts(list));
    const unsubEmps = subscribeToAllCorporateEmployees((list) => setEmployees(list));
    return () => {
      unsubAccts();
      unsubEmps();
    };
  }, []);

  const employeesByCompany = useMemo(() => {
    const map = new Map<string, CorporateEmployeeRecord[]>();
    employees.forEach((emp) => {
      const arr = map.get(emp.corporateId) || [];
      arr.push(emp);
      map.set(emp.corporateId, arr);
    });
    return map;
  }, [employees]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = [...accounts].sort((a, b) => {
      if (a.paymentStatus !== b.paymentStatus) {
        return a.paymentStatus === 'Pending Verification' ? -1 : 1;
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    if (!q) return sorted;
    return sorted.filter(
      (a) =>
        a.companyName.toLowerCase().includes(q) ||
        a.adminName.toLowerCase().includes(q) ||
        a.adminEmail.toLowerCase().includes(q) ||
        a.inviteCode.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const selectedCompany = useMemo(
    () => accounts.find((a) => a.id === selectedCompanyId) || null,
    [accounts, selectedCompanyId]
  );

  const selectedCompanyEmployees = useMemo(() => {
    if (!selectedCompany) return [];
    return employeesByCompany.get(selectedCompany.id) || [];
  }, [employeesByCompany, selectedCompany]);

  const getInviteUrl = (inviteCode: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/?corp=${inviteCode}`;

  const handleCopyInviteLink = (inviteCode: string) => {
    const url = getInviteUrl(inviteCode);
    navigator.clipboard.writeText(url);
    setCopiedCode(inviteCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleConfirmCompany = async (acct: CorporateAccount) => {
    setConfirmingId(acct.id);
    try {
      await confirmCorporateAccountAndOrder(acct);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDeliveryStatusChange = async (
    acct: CorporateAccount,
    nextStatus: CorporateAccount['deliveryStatus']
  ) => {
    await saveCorporateAccountToFirestore({
      ...acct,
      deliveryStatus: nextStatus,
    });
  };

  const pendingCount = accounts.filter((a) => a.paymentStatus === 'Pending Verification').length;
  const totalCompanyStaffCount = employees.length;

  // COMPANY DETAIL VIEW WITH FULL EMPLOYEE ROSTER
  if (selectedCompany) {
    const usedSlots = Math.max(selectedCompany.usedSlots || 0, selectedCompanyEmployees.length);
    const remainingSlots = Math.max(0, selectedCompany.totalEmployees - usedSlots);
    const inviteUrl = getInviteUrl(selectedCompany.inviteCode);
    const waShareUrl = `https://wa.me/${selectedCompany.adminPhone.replace(/\D/g, '').replace(/^0/, '234')}?text=${encodeURIComponent(
      `Hello ${selectedCompany.adminName}! Your ${selectedCompany.companyName} corporate lunch plan (${selectedCompany.totalEmployees} employees × ${selectedCompany.mealDaysPerEmployee} days) is now confirmed and active on 11:12 Food. Share this unique link with your team so each staff member can claim their slot and choose their meals:\n${inviteUrl}\n\nEmployer Access Code: ${selectedCompany.accessCode}`
    )}`;
    const emailShareUrl = `mailto:${selectedCompany.adminEmail}?subject=${encodeURIComponent(
      `${selectedCompany.companyName} — Your 11:12 Food Employee Invitation Link`
    )}&body=${encodeURIComponent(
      `Hello ${selectedCompany.adminName},\n\nYour corporate lunch subscription (${selectedCompany.totalEmployees} employees × ${selectedCompany.mealDaysPerEmployee} meal days) has been verified.\n\nShare this unique employee invitation link with your staff:\n${inviteUrl}\n\nEmployer Dashboard Access Code: ${selectedCompany.accessCode}\n\nBest regards,\n11:12 Food Operations`
    )}`;

    return (
      <div className="space-y-6 font-['Poppins']">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedCompanyId(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-bold text-zinc-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Companies</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCompany.paymentStatus !== 'Confirmed' ? (
              <button
                type="button"
                onClick={() => handleConfirmCompany(selectedCompany)}
                disabled={confirmingId === selectedCompany.id}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {confirmingId === selectedCompany.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Confirm Payment &amp; Activate Link</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleCopyInviteLink(selectedCompany.inviteCode)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode === selectedCompany.inviteCode ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === selectedCompany.inviteCode ? 'Copied URL' : 'Copy Invite Link'}</span>
                </button>
                <a
                  href={waShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Link via WhatsApp</span>
                </a>
                <a
                  href={emailShareUrl}
                  className="px-3.5 py-2 rounded-xl bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-900 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email HR</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Company Overview Banner */}
        <div className="bg-gradient-to-br from-[#FF4C00] via-[#FF5E14] to-[#FF8533] text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-orange-100 font-bold">
                <Building2 className="w-4 h-4" />
                <span>{selectedCompany.inviteCode}</span>
                <span>·</span>
                <span>Access Code: {selectedCompany.accessCode}</span>
                <span>·</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {selectedCompany.paymentStatus}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">{selectedCompany.companyName}</h3>
              <p className="text-xs text-orange-50">
                HR Contact: <strong>{selectedCompany.adminName}</strong> · {selectedCompany.adminEmail} · {selectedCompany.adminPhone}
              </p>
              <p className="text-xs text-orange-50">
                Office: {selectedCompany.officeAddress}
                {selectedCompany.secondAddress ? ` · Alt: ${selectedCompany.secondAddress}` : ''}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-4 min-w-[240px] space-y-2">
              <div className="text-xs text-orange-100 font-semibold">Package Value</div>
              <div className="text-2xl font-black tabular-nums">
                ₦{selectedCompany.totalPackageNGN.toLocaleString()}
              </div>
              <div className="text-xs text-orange-50 tabular-nums">
                {usedSlots} / {selectedCompany.totalEmployees} employee slots claimed ({remainingSlots} left)
              </div>
            </div>
          </div>

          <div className="bg-white/15 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-mono truncate flex-1">{inviteUrl}</div>
            <div className="flex items-center gap-2">
              <span>Delivery Status:</span>
              <select
                value={selectedCompany.deliveryStatus}
                onChange={(e) =>
                  handleDeliveryStatusChange(
                    selectedCompany,
                    e.target.value as CorporateAccount['deliveryStatus']
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-white text-zinc-900 font-bold text-xs outline-none cursor-pointer"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Preparing">Preparing</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        {/* Registered Employees Under This Company */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-lg font-black text-black">
                Employees Registered Under {selectedCompany.companyName}
              </h4>
              <p className="text-xs text-zinc-500">
                {selectedCompanyEmployees.length} of {selectedCompany.totalEmployees} slots claimed · Every user also synced to Customers tab
              </p>
            </div>
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Company Link</span>
            </a>
          </div>

          {selectedCompanyEmployees.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-100 text-center text-xs font-semibold text-zinc-600">
              No employees have completed registration via {selectedCompany.inviteCode} yet.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCompanyEmployees.map((emp, idx) => (
                <div
                  key={emp.id}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-100 border border-zinc-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#FF4C00] tabular-nums">#{idx + 1}</span>
                        <h5 className="text-sm sm:text-base font-black text-black">{emp.fullName}</h5>
                        {emp.department && (
                          <span className="px-2 py-0.5 rounded-full bg-white border border-zinc-300 text-[10px] font-bold text-zinc-700">
                            {emp.department}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" /> {emp.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-zinc-400" /> {emp.phone}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-xs">
                      <div className="font-bold text-emerald-700 tabular-nums">
                        {emp.selectedDays.length} / {emp.mealDaysAllocated} Meals Picked
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Joined {new Date(emp.registeredAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-zinc-200">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Delivery Address 1
                      </span>
                      <span className="font-semibold text-zinc-800 inline-flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FF4C00] shrink-0" />
                        {emp.deskLocation}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Delivery Address 2
                      </span>
                      <span className="font-semibold text-zinc-700 mt-0.5 block">
                        {emp.secondAddress || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {emp.selectedDays.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-[#FF4C00]" />
                        Selected Dates &amp; Meals
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {emp.selectedDays.map((sel) => (
                          <span
                            key={sel.dateStr}
                            className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-800"
                          >
                            <strong className="text-[#FF4C00]">{sel.dateStr}:</strong>{' '}
                            {sel.meal.mealName}
                            {sel.selectedSwallow ? ` (${sel.selectedSwallow})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Poppins']">
      {/* Summary Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Corporate Accounts</span>
            <Building2 className="w-4 h-4 text-[#FF4C00]" />
          </div>
          <div className="text-3xl font-black text-black mt-2 tabular-nums">{accounts.length}</div>
          <p className="text-xs text-zinc-500 mt-1">Total companies subscribed</p>
        </div>

        <div className="bg-gradient-to-br from-[#FFF4ED] to-[#FFE7D6] border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#FF4C00]">
            <span>Awaiting Link Setup</span>
            <Clock className="w-4 h-4 text-[#FF4C00]" />
          </div>
          <div className="text-3xl font-black text-black mt-2 tabular-nums">{pendingCount}</div>
          <p className="text-xs text-zinc-700 mt-1">Pending payment verification</p>
        </div>

        <div className="bg-zinc-200/80 border border-zinc-300 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
            <span>Registered Staff Slots</span>
            <Users className="w-4 h-4 text-zinc-800" />
          </div>
          <div className="text-3xl font-black text-black mt-2 tabular-nums">{totalCompanyStaffCount}</div>
          <p className="text-xs text-zinc-600 mt-1">Employees onboarded via company links</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-2xl p-4">
        <div>
          <h3 className="text-base font-black text-black">Company Packages &amp; Employee Rosters</h3>
          <p className="text-xs text-zinc-500">
            Verify company payments to unlock their invite link, or click any company to inspect registered employees.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, HR, or invite code..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-300 text-xs focus:border-[#FF4C00] outline-none"
          />
        </div>
      </div>

      {/* Companies List */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 text-center space-y-2">
          <Building2 className="w-8 h-8 text-zinc-300 mx-auto" />
          <h4 className="text-sm font-bold text-black">No Corporate Packages Yet</h4>
          <p className="text-xs text-zinc-500">
            When companies submit a &quot;Your Boss Will Pay&quot; request, it appears here for confirmation and link generation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAccounts.map((acct) => {
            const companyEmps = employeesByCompany.get(acct.id) || [];
            const usedSlots = Math.max(acct.usedSlots || 0, companyEmps.length);
            const isConfirmed = acct.paymentStatus === 'Confirmed';

            return (
              <div
                key={acct.id}
                onClick={() => setSelectedCompanyId(acct.id)}
                className="bg-white border border-zinc-200 hover:border-[#FF4C00] rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition cursor-pointer space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isConfirmed ? 'Confirmed · Link Active' : 'Pending Payment Verification'}
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-500">{acct.inviteCode}</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black text-black truncate">
                      {acct.companyName}
                    </h4>
                    <p className="text-xs text-zinc-600">
                      HR: <strong>{acct.adminName}</strong> · {acct.adminEmail} · {acct.adminPhone}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-zinc-500">
                        {acct.totalEmployees} Staff × {acct.mealDaysPerEmployee} Days
                      </div>
                      <div className="text-xl font-black text-[#FF4C00] tabular-nums">
                        ₦{acct.totalPackageNGN.toLocaleString()}
                      </div>
                      <div className="text-xs font-bold text-zinc-700 tabular-nums">
                        {usedSlots} / {acct.totalEmployees} slots used
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>

                {/* Action Row (Stop propagation so clicks on buttons don't accidentally just open detail) */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {acct.paymentProofUrl && (
                      <button
                        type="button"
                        onClick={() => setProofPreviewUrl(acct.paymentProofUrl || null)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#FF4C00]" />
                        <span>View Payment Proof</span>
                      </button>
                    )}

                    {!isConfirmed ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmCompany(acct)}
                        disabled={confirmingId === acct.id}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {confirmingId === acct.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Confirm Payment &amp; Generate Link</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(acct.inviteCode)}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode === acct.inviteCode ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode === acct.inviteCode ? 'Link Copied!' : 'Copy Employee Link'}</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCompanyId(acct.id)}
                    className="text-xs font-bold text-[#FF4C00] hover:underline cursor-pointer"
                  >
                    View {companyEmps.length} Employees →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Proof Lightbox */}
      {proofPreviewUrl && (
        <div
          onClick={() => setProofPreviewUrl(null)}
          className="fixed inset-0 z-[150] bg-zinc-900/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-4 max-w-lg w-full space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-black">Company Transfer Receipt</span>
              <button
                type="button"
                onClick={() => setProofPreviewUrl(null)}
                className="px-3 py-1 rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700 cursor-pointer"
              >
                Close
              </button>
            </div>
            <img
              src={proofPreviewUrl}
              alt="Company payment proof"
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-zinc-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
