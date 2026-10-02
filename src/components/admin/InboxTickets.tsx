import React, { useState } from 'react';
import { SupportTicket } from '../../types';
import { Inbox, CheckCircle2, Clock, AlertCircle, MessageSquare } from 'lucide-react';

interface InboxTicketsProps {
  tickets: SupportTicket[];
  onResolveTicket: (ticketId: string) => void;
}

export const InboxTickets: React.FC<InboxTicketsProps> = ({ tickets, onResolveTicket }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = tickets.filter((t) => categoryFilter === 'all' || t.category === categoryFilter);

  return (
    <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-black">
        <div>
          <span className="text-xs font-black uppercase text-black bg-[#FACC15] px-3 py-1 border-2 border-black font-mono-custom shadow-[2px_2px_0px_#000]">
            CUSTOMER SUPPORT CENTER
          </span>
          <h3 className="text-2xl font-black uppercase font-heading text-black mt-2">INBOX & COMPLAINTS CENTER</h3>
          <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
            Track and resolve subscriber complaints regarding delivery times, spice adjustments, or billing.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex bg-white p-1 border-3 border-black shadow-[3px_3px_0px_#000] text-xs">
          {['all', 'Meal Quality', 'Delivery Time', 'Billing'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 border border-transparent font-black uppercase text-[10px] transition cursor-pointer ${
                categoryFilter === cat ? 'bg-[#FF4C00] text-white border-black font-mono-custom' : 'text-black hover:bg-[#FACC15]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filtered.map((ticket) => (
          <div
            key={ticket.id}
            className={`p-5 border-3 border-black shadow-[4px_4px_0px_#000] transition ${
              ticket.status === 'Open'
                ? 'bg-[#F8F8F8]'
                : 'bg-zinc-100 opacity-80'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase text-black">{ticket.userName}</span>
                <span className="text-[10px] text-zinc-600 font-mono-custom font-bold">• {ticket.createdAt}</span>
                <span className="px-2.5 py-0.5 border-2 border-black bg-[#FACC15] text-black font-mono-custom font-black text-[10px] uppercase shadow-[1px_1px_0px_#000]">
                  {ticket.category}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 border-2 border-black text-[10px] font-black uppercase shadow-[1px_1px_0px_#000] ${
                  ticket.status === 'Open' ? 'bg-[#FF4C00] text-white' : 'bg-[#22C55E] text-black'
                }`}>
                  {ticket.status}
                </span>

                {ticket.status === 'Open' && (
                  <button
                    onClick={() => onResolveTicket(ticket.id)}
                    className="px-3 py-1.5 bg-[#22C55E] hover:bg-[#1eb052] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition-all flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    <span>RESOLVE</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs font-bold text-zinc-900 mt-1 leading-relaxed uppercase">"{ticket.subject}"</p>
          </div>
        ))}
      </div>

    </div>
  );
};
