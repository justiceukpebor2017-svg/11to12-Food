import React, { useState, useMemo } from 'react';
import { WaitlistLead } from '../../../types';
import { exportToCsv } from '../../../utils/csvExport';
import {
  Search,
  Download,
  Copy,
  Check,
  Trash2,
  Eye,
  X,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
} from 'lucide-react';

interface AdminWaitlistTabProps {
  waitlistLeads: WaitlistLead[];
  onDeleteWaitlistLead?: (leadId: string) => void;
  onUpdateWaitlistLead?: (lead: WaitlistLead) => void;
}

export const AdminWaitlistTab: React.FC<AdminWaitlistTabProps> = ({
  waitlistLeads,
  onDeleteWaitlistLead,
  onUpdateWaitlistLead,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<WaitlistLead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<WaitlistLead | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return waitlistLeads;
    return waitlistLeads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.memberCode && l.memberCode.toLowerCase().includes(q))
    );
  }, [waitlistLeads, searchQuery]);

  // Copy Waitlist Code
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // CSV Download
  const handleDownloadCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Waitlist Code', 'Date Joined', 'Workplace', 'Address Floor'];
    const rows = filteredLeads.map((l) => [
      l.name,
      l.email,
      l.phone,
      l.memberCode,
      l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—',
      l.workplace || '—',
      l.addressFloor || '—',
    ]);
    exportToCsv('waitlist-leads', headers, rows);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (leadToDelete && onDeleteWaitlistLead) {
      onDeleteWaitlistLead(leadToDelete.id);
      if (selectedLead?.id === leadToDelete.id) {
        setSelectedLead(null);
      }
      setLeadToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Waitlist</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {waitlistLeads.length} Interested
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            People interested in 11 to 12 who have not subscribed yet
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCsv}
            disabled={filteredLeads.length === 0}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-40 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or phone number..."
          className="w-full bg-white border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00] shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        {filteredLeads.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No waitlist entries found</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {searchQuery ? 'Try matching another search keyword.' : 'New interested leads will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5">Phone</th>
                  <th className="py-3 px-5">Waitlist Code</th>
                  <th className="py-3 px-5">Date Joined</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLeads.map((lead) => {
                  const isCopied = copiedCodeId === lead.id;
                  const joinedDate = lead.createdAt
                    ? new Date(lead.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={lead.id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-3.5 px-5 font-bold text-zinc-900">
                        {lead.name}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-600 font-medium">
                        {lead.email}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-600 font-mono text-[11px]">
                        {lead.phone}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="inline-flex items-center space-x-1.5 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-lg">
                          <span className="font-mono font-bold text-zinc-800 text-[11px]">
                            {lead.memberCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(lead.memberCode, lead.id)}
                            className="text-zinc-500 hover:text-[#FF4C00] transition cursor-pointer p-0.5"
                            title="Copy Code"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-500">
                        {joinedDate}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition cursor-pointer"
                            title="Open Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setLeadToDelete(lead)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition cursor-pointer"
                            title="Remove / Archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-zinc-900">Waitlist Details</h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Name</span>
                <span className="text-sm font-bold text-zinc-900">{selectedLead.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Email</span>
                  <span className="font-medium text-zinc-800 break-all">{selectedLead.email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Phone</span>
                  <span className="font-medium text-zinc-800">{selectedLead.phone}</span>
                </div>
              </div>

              <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Waitlist Code</span>
                  <button
                    onClick={() => handleCopyCode(selectedLead.memberCode, selectedLead.id)}
                    className="text-xs font-semibold text-[#FF4C00] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedCodeId === selectedLead.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-base font-mono font-bold text-zinc-900">
                  {selectedLead.memberCode}
                </div>
                <p className="text-[11px] text-zinc-500">
                  When this person orders, entering this code auto-populates their contact & workstation details.
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Workplace & Address</span>
                <span className="text-zinc-700">{selectedLead.workplace || 'Not provided'} • {selectedLead.addressFloor || 'No floor'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Date Joined</span>
                <span className="text-zinc-600">{selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleString() : '—'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Remove Waitlist Entry?</h3>
            <p className="text-xs text-zinc-600">
              Are you sure you want to remove <strong>{leadToDelete.name}</strong> ({leadToDelete.memberCode}) from the waitlist?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
