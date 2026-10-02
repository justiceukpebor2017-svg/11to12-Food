import React, { useState } from 'react';
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
} from 'lucide-react';
import { WaitlistLead } from '../../types';

interface WaitlistManagerProps {
  waitlistLeads?: WaitlistLead[];
  onUpdateWaitlistLead?: (lead: WaitlistLead) => void;
  onConvertToCustomer?: (lead: WaitlistLead) => void;
}

export const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  waitlistLeads = [],
  onUpdateWaitlistLead,
  onConvertToCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'waitlisted' | 'contacted' | 'converted'>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);

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

  const filtered = waitlistLeads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.workplace.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.addressFloor.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'waitlisted') return l.status === 'Waitlisted';
    if (activeTab === 'contacted') return l.status === 'Contacted';
    if (activeTab === 'converted') return l.status === 'Converted';
    return true;
  });

  const totalCount = waitlistLeads.length;
  const pendingCount = waitlistLeads.filter((l) => l.status === 'Waitlisted').length;
  const contactedCount = waitlistLeads.filter((l) => l.status === 'Contacted').length;
  const convertedCount = waitlistLeads.filter((l) => l.status === 'Converted').length;

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

                  return (
                    <tr key={lead.id} className="hover:bg-zinc-50 transition">
                      <td className="py-4 px-4">
                        <div className="font-black text-zinc-900 text-sm">{lead.name}</div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <Ticket className="w-3.5 h-3.5 text-[#FF4C00]" />
                          <span className="font-mono text-[10px] font-bold text-[#FF4C00] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                            {lead.memberCode || 'DD-WAITLIST'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
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
                      </td>

                      <td className="py-4 px-4">
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

                      <td className="py-4 px-4 whitespace-nowrap">
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

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
