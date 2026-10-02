import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
} from 'lucide-react';

interface SkipCreditRecord {
  id: string;
  customerName: string;
  company: string;
  mealSkippedDate: string;
  mealName: string;
  creditIssuedNGN: number;
  appliedToNextBill: boolean;
  reason: string;
}

export const CreditsSkipsManager: React.FC = () => {
  const [records, setRecords] = useState<SkipCreditRecord[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  const filtered = records.filter(
    (r) =>
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleApplied = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, appliedToNextBill: !r.appliedToNextBill } : r))
    );
  };

  const totalActiveCreditsNGN = records.reduce((acc, r) => acc + (r.appliedToNextBill ? 0 : r.creditIssuedNGN), 0);

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Meal Flexibility System
          </span>
          <h2 className="text-2xl font-black text-black mt-0.5">
            Credits & Skipped Meals
          </h2>
          <p className="text-xs text-zinc-500">
            When subscribers skip lunches due to external meetings or travel, credits are logged and deducted from their next cycle.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full">
            ₦{totalActiveCreditsNGN.toLocaleString()} Total Active Credits
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-zinc-200 rounded-xl pl-10 pr-4 py-1.5 text-xs font-medium text-black focus:outline-none focus:border-[#FF4C00]"
          />
        </div>
      </div>

      {/* Table: Section 10 Specification */}
      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Customer & Company</th>
                <th className="py-3 px-4">Meal Skipped & Date</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Credit Issued</th>
                <th className="py-3 px-4">Applied to Next Bill</th>
                <th className="py-3 px-4 text-right">Toggle Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-zinc-400">
                    <p className="text-xs font-semibold">No skipped meals or active credit records yet.</p>
                    <p className="text-[11px] text-zinc-400 mt-1">When subscribers skip a scheduled lunch before cutoff, credits will be logged here.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-black whitespace-nowrap">
                      <span className="block">{r.customerName}</span>
                      <span className="text-[11px] text-zinc-400 font-normal">{r.company}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-zinc-900 block">{r.mealSkippedDate}</span>
                      <span className="text-[11px] text-zinc-400 block">{r.mealName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 max-w-xs">
                      {r.reason}
                    </td>
                    <td className="py-3.5 px-4 font-black text-black whitespace-nowrap text-sm">
                      ₦{r.creditIssuedNGN.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.appliedToNextBill
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.appliedToNextBill ? 'Yes (Deducted)' : 'Pending Application'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleApplied(r.id)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold cursor-pointer"
                      >
                        {r.appliedToNextBill ? 'Mark Unapplied' : 'Mark Applied ✓'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
