import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  Search,
  MessageSquare,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Calendar,
  ExternalLink,
  UserPlus,
  ArrowRight,
  Clock,
  Ticket,
  Copy,
  Check,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';
import { WaitlistLead } from '../../types';
import { subscribeToWaitlist, deleteWaitlistLeadFromFirestore } from '../../services/firebase';
import { liveSync } from '../../services/liveSyncService';

interface WaitlistManagerProps {
  waitlistLeads?: WaitlistLead[];
  onUpdateWaitlistLead?: (lead: WaitlistLead) => void;
  onDeleteWaitlistLead?: (leadId: string) => void;
  onConvertToCustomer?: (lead: WaitlistLead) => void;
}

export const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  waitlistLeads = [],
  onUpdateWaitlistLead,
  onDeleteWaitlistLead,
  onConvertToCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'waitlisted' | 'contacted' | 'converted'>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [expandedLeadIds, setExpandedLeadIds] = useState<Set<string>>(new Set());
  const [leadToDelete, setLeadToDelete] = useState<WaitlistLead | null>(null);

  // Real-time onSnapshot camera stream for Waitlist
  const [liveWaitlist, setLiveWaitlist] = useState<WaitlistLead[]>([]);
  const [hasLiveFeed, setHasLiveFeed] = useState(false);

  useEffect(() => {
    const unsub = subscribeToWaitlist((leads) => {
      setLiveWaitlist(leads);
      setHasLiveFeed(true);
    });
    return () => unsub();
  }, []);

  const leadsList = hasLiveFeed ? liveWaitlist : waitlistLeads;

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleStatusChange = (lead: WaitlistLead, newStatus: WaitlistLead['status']) => {
    const updated = { ...lead, status: newStatus };
    if (onUpdateWaitlistLead) {
      onUpdateWaitlistLead(updated);
    }
    showNotice(`Updated ${lead.name}'s status to ${newStatus}`);
  };

  const handleConfirmDeleteLead = () => {
    if (!leadToDelete) return;
    const targetId = leadToDelete.id;
    const targetName = leadToDelete.name;

    // 1. Direct callback to parent
    if (onDeleteWaitlistLead) {
      onDeleteWaitlistLead(targetId);
    }

    // 2. Direct Firestore deletion for real-time multi-device sync
    deleteWaitlistLeadFromFirestore(targetId).catch((err) => {
      console.warn('Firestore delete waitlist lead notice:', err);
    });

    // 3. Central liveSync deletion
    liveSync.deleteWaitlistLead(targetId).catch(() => {});

    // 4. Update local state
    setLiveWaitlist((prev) => prev.filter((l) => l.id !== targetId));
    setLeadToDelete(null);
    showNotice(`✓ Removed ${targetName} from the waitlist.`);
  };

  const toggleExpandLead = (leadId: string) => {
    setExpandedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  const handleDownloadCSV = () => {
    if (leadsList.length === 0) {
      showNotice('No wishlist users available to download.');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Workplace', 'Floor / Desk Location', 'Unique Details Code', 'Status', 'Registered Date'];
    const rows = leadsList.map((l) => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.workplace || '').replace(/"/g, '""')}"`,
      `"${(l.addressFloor || '').replace(/"/g, '""')}"`,
      `"${(l.memberCode || 'DD-WAITLIST').replace(/"/g, '""')}"`,
      `"${l.status || 'Waitlisted'}"`,
      `"${new Date(l.createdAt || Date.now()).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `11to12_wishlist_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice(`✓ Downloaded CSV of ${leadsList.length} wishlist users!`);
  };

  const handleCopySubscriptionInvite = (lead: WaitlistLead) => {
    const code = lead.memberCode || 'DD-WAITLIST';
    const message = `Hi ${lead.name}! Here is your unique 11 to 12 subscription details code: ${code}. When you visit our website at https://11to12.food and pick your meal days, use this code at checkout to auto-fill your contact details and activate your workday desk drop delivery!`;
    navigator.clipboard.writeText(message);
    setCopiedInviteId(lead.id);
    setTimeout(() => setCopiedInviteId(null), 3000);
    showNotice(`✓ Copied unique subscription code message for ${lead.name} (${code})!`);
  };

  const filtered = leadsList.filter((l) => {
    if (!l) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !term ||
      (l.name || '').toLowerCase().includes(term) ||
      (l.email || '').toLowerCase().includes(term) ||
      (l.phone || '').toLowerCase().includes(term) ||
      (l.workplace || '').toLowerCase().includes(term) ||
      (l.addressFloor || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (activeTab === 'waitlisted') return l.status === 'Waitlisted';
    if (activeTab === 'contacted') return l.status === 'Contacted';
    if (activeTab === 'converted') return l.status === 'Converted';
    return true;
  });

  const totalCount = leadsList.length;
  const pendingCount = leadsList.filter((l) => l.status === 'Waitlisted').length;
  const contactedCount = leadsList.filter((l) => l.status === 'Contacted').length;
  const convertedCount = leadsList.filter((l) => l.status === 'Converted').length;

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Website Waitlist Tracker
          </span>
          <h2 className="text-2xl font-black text-black mt-0.5">
            Website Waitlist Leads ({totalCount})
          </h2>
          <p className="text-xs text-zinc-500">
            Real prospective subscribers who filled the "Reserve Your Desk Drop" form on the website. Follow up to onboard them as paid subscribers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 font-bold text-xs flex items-center space-x-2 transition cursor-pointer shadow-2xs"
            title="Download CSV of all wishlist users for follow-up"
          >
            <Download className="w-3.5 h-3.5 text-[#FF4C00]" />
            <span>Download CSV ({totalCount})</span>
          </button>
          <span className="text-xs font-bold bg-[#FF4C00]/10 text-[#FF4C00] border border-[#FF4C00]/20 px-3.5 py-1.5 rounded-full">
            {pendingCount} Awaiting Follow-up
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-2 border border-emerald-200 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Cards: Waitlist Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Total Leads</span>
          <span className="text-2xl sm:text-3xl font-black text-black block mt-1">{totalCount}</span>
          <span className="text-[10px] text-zinc-500">From website reservations</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Pending Follow-up</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-700 block mt-1">{pendingCount}</span>
          <span className="text-[10px] text-zinc-500">Ready for call/WhatsApp</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Contacted</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-700 block mt-1">{contactedCount}</span>
          <span className="text-[10px] text-zinc-500">In conversation</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Converted</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 block mt-1">{convertedCount}</span>
          <span className="text-[10px] text-zinc-500">Became active subscribers</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone, workplace..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-zinc-200 rounded-xl text-xs font-medium text-black focus:outline-hidden focus:border-[#FF4C00]"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-black text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Leads ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('waitlisted')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'waitlisted'
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('contacted')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'contacted'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Contacted ({contactedCount})
          </button>
          <button
            onClick={() => setActiveTab('converted')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'converted'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Converted ({convertedCount})
          </button>
        </div>
      </div>

      {/* Leads Table / Zero State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF7F2] border border-zinc-200 flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-zinc-900 mb-1">
            {searchTerm ? 'No matching waitlist leads found' : 'No waitlist signups yet'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mb-4">
            {searchTerm
              ? 'Try modifying your search keywords.'
              : 'Visitors who fill out "Reserve Your Desk Drop" on the website will be listed here with their contact details so you can follow up and convert them into subscribers.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF7F2] text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Lead Name</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Workplace & Desk Drop Floor</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Follow-up Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((lead) => {
                  const whatsappMessage = encodeURIComponent(
                    `Hello ${lead.name}, thank you for joining the 11 to 12 Desk Drop waitlist at ${lead.workplace}! Your Unique Member Code is *${lead.memberCode}*. When you pick your meals calendar, use this code at checkout to auto-fill your contact details and reserve your plan without filling them again!`
                  );
                  const cleanPhone = lead.phone.replace(/[^0-9+]/g, '');

                  const isExpanded = expandedLeadIds.has(lead.id);

                  return (
                    <React.Fragment key={lead.id}>
                      <tr className={`hover:bg-zinc-50 transition cursor-pointer ${isExpanded ? 'bg-orange-50/30' : ''}`} onClick={() => toggleExpandLead(lead.id)}>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandLead(lead.id);
                              }}
                              className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-500 transition cursor-pointer"
                              title={isExpanded ? 'Collapse details' : 'Drop down to see full details'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-[#FF4C00]" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <div>
                              <div className="font-black text-zinc-900 text-sm">{lead.name}</div>
                              <div className="flex items-center space-x-1.5 mt-1">
                                <Ticket className="w-3.5 h-3.5 text-[#FF4C00]" />
                                <span className="font-mono text-[10px] font-bold text-[#FF4C00] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                                  {lead.memberCode || 'DD-WAITLIST'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (lead.memberCode) {
                                      navigator.clipboard.writeText(lead.memberCode);
                                      setCopiedLeadId(lead.id);
                                      setTimeout(() => setCopiedLeadId(null), 2000);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                                  title="Copy Member Code"
                                >
                                  {copiedLeadId === lead.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="font-semibold text-zinc-800">{lead.email}</div>
                          <div className="text-zinc-500 text-[11px] font-mono">{lead.phone}</div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-zinc-900">{lead.workplace}</div>
                          <div className="text-zinc-500 text-[11px]">{lead.addressFloor}</div>
                        </td>

                        <td className="py-4 px-4 text-zinc-500 text-[11px] whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead, e.target.value as any)}
                            className={`text-[11px] font-bold rounded-full px-2.5 py-1 border transition cursor-pointer ${
                              lead.status === 'Converted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : lead.status === 'Contacted'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            <option value="Waitlisted">Waitlisted</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Converted">Converted</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Copy Unique Invite Code Message */}
                            <button
                              type="button"
                              onClick={() => handleCopySubscriptionInvite(lead)}
                              className="px-2.5 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-[#FF4C00] font-bold text-xs flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                              title="Copy unique code message to send this wishlist user so they can subscribe"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">{copiedInviteId === lead.id ? 'Copied!' : 'Send Code'}</span>
                            </button>

                            {/* WhatsApp */}
                            <a
                              href={`https://wa.me/${cleanPhone.startsWith('0') ? '234' + cleanPhone.substring(1) : cleanPhone}?text=${whatsappMessage}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>

                            {/* Call */}
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                              title="Call Phone"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            {/* Email */}
                            <a
                              href={`mailto:${lead.email}?subject=${encodeURIComponent('11 to 12 Lunch Desk Drop Reservation')}`}
                              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                              title="Send Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>

                            {/* Convert to Customer */}
                            {onConvertToCustomer && (
                              <button
                                type="button"
                                onClick={() => onConvertToCustomer(lead)}
                                className="px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center space-x-1 transition cursor-pointer"
                                title="Onboard lead as paying customer"
                              >
                                <UserPlus className="w-3.5 h-3.5 text-[#FF4C00]" />
                                <span>Onboard</span>
                              </button>
                            )}

                            {/* Delete / Remove Lead */}
                            <button
                              type="button"
                              onClick={() => setLeadToDelete(lead)}
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                              title="Remove waitlist reservation completely"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* DROPDOWN DETAILS ACCORDION ROW */}
                      {isExpanded && (
                        <tr className="bg-orange-50/50 border-b border-orange-200">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="bg-white rounded-2xl border border-orange-200 p-4 sm:p-5 shadow-xs text-left space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                                <div className="flex items-center space-x-2">
                                  <div className="p-2 rounded-xl bg-orange-100 text-[#FF4C00]">
                                    <Users className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-sm text-zinc-900">{lead.name} • Wishlist Details</h4>
                                    <span className="text-[11px] text-zinc-500">Registered on {new Date(lead.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCopySubscriptionInvite(lead)}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>{copiedInviteId === lead.id ? '✓ Copied Invite Message!' : 'Send Unique Code to Subscribe'}</span>
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Contact Info</span>
                                  <div className="font-bold text-zinc-900">{lead.email}</div>
                                  <div className="font-mono text-zinc-600">{lead.phone}</div>
                                </div>

                                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Workplace & Desk Drop Floor</span>
                                  <div className="font-bold text-zinc-900">{lead.workplace}</div>
                                  <div className="text-zinc-600">{lead.addressFloor || 'Desk Drop Station'}</div>
                                </div>

                                <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-200 space-y-1">
                                  <span className="text-[10px] uppercase font-bold text-orange-900 block">Unique Details Code</span>
                                  <div className="font-mono font-black text-sm text-[#FF4C00] flex items-center space-x-2">
                                    <span>{lead.memberCode || 'DD-WAITLIST'}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (lead.memberCode) {
                                          navigator.clipboard.writeText(lead.memberCode);
                                          setCopiedLeadId(lead.id);
                                          setTimeout(() => setCopiedLeadId(null), 2000);
                                        }
                                      }}
                                      className="text-xs text-zinc-500 hover:text-black font-normal underline"
                                    >
                                      {copiedLeadId === lead.id ? 'Copied!' : 'Copy'}
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-zinc-500">
                                    Send them this code so they can enter it at checkout to subscribe on the website.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DELETE WAITLIST LEAD CONFIRMATION MODAL */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-red-200 shadow-2xl p-6 text-left animate-in fade-in zoom-in duration-150">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-black">Remove Waitlist Reservation</h3>
                <p className="text-xs text-zinc-500">Irreversible admin action</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 space-y-2 mb-5">
              <p>
                Are you sure you want to remove <strong>{leadToDelete.name}</strong> ({leadToDelete.email}) from the waitlist?
              </p>
              <p className="text-red-600 font-semibold text-[11px]">
                ⚠️ This will permanently delete their reservation record and member code across all synced devices.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2.5 rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-bold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLead}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition flex items-center space-x-1.5 shadow-md active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Reservation</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
