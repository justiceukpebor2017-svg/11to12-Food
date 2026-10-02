import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Download,
  Building,
} from 'lucide-react';
import { OrderSubmission } from '../../types';

interface PaymentsManagerProps {
  submittedOrders: OrderSubmission[];
  onConfirmOrderPayment: (orderId: string) => void;
}

interface TransactionItem {
  id: string;
  customerName: string;
  company: string;
  date: string;
  method: string;
  amountNGN: number;
  status: 'Paid' | 'Pending' | 'Failed';
  reference: string;
}

export const PaymentsManager: React.FC<PaymentsManagerProps> = ({
  submittedOrders,
  onConfirmOrderPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('All');

  // Initial transactions (starts clean)
  const [initialTransactions, setInitialTransactions] = useState<TransactionItem[]>([]);

  // Combine with submitted orders
  const liveTransactions: TransactionItem[] = submittedOrders.map((ord) => ({
    id: `tx-${ord.id}`,
    customerName: ord.fullName,
    company: ord.company,
    date: new Date(ord.submittedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    method: 'Bank Transfer (Flutterwave MFB)',
    amountNGN: ord.finalTotalNGN,
    status: ord.paymentStatus === 'Confirmed' ? 'Paid' : 'Pending',
    reference: ord.id,
  }));

  const allTransactions = [...liveTransactions, ...initialTransactions];

  const filtered = allTransactions.filter((tx) => {
    const matchesStatus = activeStatus === 'All' ? true : tx.status === activeStatus;
    const matchesSearch =
      tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate live financial figures from submitted orders
  const totalVolume = submittedOrders.reduce((acc, o) => acc + o.finalTotalNGN, 0);
  const collected = submittedOrders.filter((o) => o.paymentStatus === 'Confirmed').reduce((acc, o) => acc + o.finalTotalNGN, 0);
  const outstanding = submittedOrders.filter((o) => o.paymentStatus === 'Pending Verification').reduce((acc, o) => acc + o.finalTotalNGN, 0);
  const collectedPercent = totalVolume > 0 ? ((collected / totalVolume) * 100).toFixed(1) : '100';

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Financial Ledger
          </span>
          <h2 className="text-2xl font-black text-black mt-0.5">
            Payments & Manual Transfer Verification
          </h2>
          <p className="text-xs text-zinc-500">
            Verify manual Flutterwave MFB bank receipts submitted via WhatsApp or Email matching generated order slips.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold bg-[#FAF7F2] border border-zinc-200 px-3 py-1.5 rounded-full text-zinc-700">
            Flutterwave MFB: 9838242145
          </span>
        </div>
      </div>

      {/* Overview Cards (Derived from Live Data) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-400 block">Revenue Total</span>
          <span className="text-xl sm:text-2xl font-black text-black block mt-0.5">₦{totalVolume.toLocaleString()}</span>
          <span className="text-[10px] text-zinc-400">Total volume</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200">
          <span className="text-[11px] font-semibold text-emerald-600 block">Collected (Verified)</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 block mt-0.5">₦{collected.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-600">{collectedPercent}% cleared</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200">
          <span className="text-[11px] font-semibold text-amber-600 block">Outstanding</span>
          <span className="text-xl sm:text-2xl font-black text-amber-700 block mt-0.5">₦{outstanding.toLocaleString()}</span>
          <span className="text-[10px] text-amber-600">Pending receipts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 block">Credits Issued</span>
          <span className="text-xl sm:text-2xl font-black text-zinc-800 block mt-0.5">₦0</span>
          <span className="text-[10px] text-zinc-400">Meal skips refunded</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200">
          <span className="text-[11px] font-semibold text-rose-600 block">Refunds</span>
          <span className="text-xl sm:text-2xl font-black text-rose-700 block mt-0.5">₦0</span>
          <span className="text-[10px] text-rose-500">Bank reversals</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, reference, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-zinc-200 rounded-xl pl-10 pr-4 py-1.5 text-xs font-medium text-black focus:outline-none focus:border-[#FF4C00]"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          {['All', 'Paid', 'Pending'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                activeStatus === st
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table: Section 9 Specification */}
      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Customer & Company</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method & Reference</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-zinc-400">
                    <p className="text-xs font-semibold">No payment transactions recorded yet.</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Submitted bank transfer orders will appear here automatically for verification.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isPending = tx.status === 'Pending';
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/70 transition">
                      
                      <td className="py-3.5 px-4 font-bold text-black whitespace-nowrap">
                        <span className="block">{tx.customerName}</span>
                        <span className="text-[11px] text-zinc-400 font-normal">{tx.company}</span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-600 whitespace-nowrap">
                        {tx.date}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-zinc-900 block">{tx.method}</span>
                        <span className="text-[10px] text-zinc-400 font-mono block">{tx.reference}</span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-black whitespace-nowrap text-sm">
                        ₦{tx.amountNGN.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tx.status === 'Paid' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Paid & Verified
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Verification
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (tx.reference.startsWith('ORD-')) {
                                onConfirmOrderPayment(tx.reference);
                              }
                              setInitialTransactions((prev) =>
                                prev.map((t) => (t.id === tx.id ? { ...t, status: 'Paid' } : t))
                              );
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            Verify Transfer Proof
                          </button>
                        ) : (
                          <span className="text-zinc-400 text-xs font-semibold">
                            Reconciled ✓
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
