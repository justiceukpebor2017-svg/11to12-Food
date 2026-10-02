import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Receipt,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  Plus,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { InvoiceSlipModal } from '../marketing/InvoiceSlipModal';
import { AddPlanDaysModal } from './AddPlanDaysModal';
import { OrderSubmission, UserProfile } from '../../types';
import { CONTACT_CONFIG } from '../../config/contactConfig';

interface PlanAndBillingSectionProps {
  planName: string; // "Desk Drop (20 Lunches)"
  status: 'Active' | 'Paused' | 'Finished';
  startDate: string; // "Oct 5, 2026"
  endDate: string; // "Mar 30, 2027"
  totalLunches: number; // 20
  selectedLunches: number; // 14
  completedLunches: number; // 4
  upcomingLunches: number; // 10
  skippedLunches?: number; // 0
  creditsBalance?: number; // 0
  userProfile?: UserProfile;
  onUseCreditExtraPlate?: () => void;
  onAddMoreLunches: () => void;
  onTopUpRequested?: (days: number, amountNGN: number, refId: string) => void;
}

export const PlanAndBillingSection: React.FC<PlanAndBillingSectionProps> = ({
  planName = 'Desk Drop (20 Lunches)',
  status = 'Active',
  startDate = 'Oct 5, 2026',
  endDate = 'Mar 30, 2027',
  totalLunches = 20,
  selectedLunches = 0,
  completedLunches = 0,
  upcomingLunches = 0,
  skippedLunches = 0,
  creditsBalance = 0,
  userProfile,
  onUseCreditExtraPlate,
  onAddMoreLunches,
  onTopUpRequested,
}) => {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddDaysModal, setShowAddDaysModal] = useState(false);

  const remainingToPick = Math.max(0, totalLunches - selectedLunches);

  const currentOrderData: OrderSubmission = {
    id: '11TO12-2026-0842',
    fullName: userProfile?.name || 'Active Subscriber',
    email: userProfile?.email || 'subscriber@11to12.com',
    phone: userProfile?.phone || CONTACT_CONFIG.whatsappDisplay,
    company: userProfile?.company || 'Corporate Desk Drop',
    officeAddress: userProfile?.address || 'Victoria Island, Lagos',
    selectedDays: Array.from({ length: totalLunches }).map((_, idx) => ({
      dateStr: `2026-10-${String(idx + 5).padStart(2, '0')}`,
      meal: {
        id: `plan-m-${idx}`,
        dateStr: `2026-10-${String(idx + 5).padStart(2, '0')}`,
        day: (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][idx % 5]) as any,
        mealName: idx === 19 ? 'Chef Celebration Feast (20th Day Free)' : '11 to 12 Daily Chef Creation',
        mealCategory: 'Rice',
      },
    })),
    totalDays: totalLunches,
    subtotalNGN: totalLunches * 2900,
    discountNGN: totalLunches >= 20 ? 2900 : 0,
    finalTotalNGN: Math.max(0, totalLunches * 2900 - (totalLunches >= 20 ? 2900 : 0)),
    submittedAt: '2026-10-01T09:30:00Z',
    paymentStatus: 'Confirmed',
  };

  return (
    <div className="space-y-6 font-['Poppins'] text-left">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] block">
            Billing & Desk Credits
          </span>
          <h2 className="text-2xl font-black text-black">
            Plan & Billing
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Transparent breakdown of your desk drop package, lunch usage, invoices, and credit balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Download Official Invoice PDF */}
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-4 py-2.5 rounded-full border border-zinc-300 hover:border-black text-xs font-bold text-black flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#FF4C00]" />
            <span>Download Invoice (PDF)</span>
          </button>

          {/* Add More Days Trigger */}
          <button
            onClick={() => setShowAddDaysModal(true)}
            className="px-4 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More Days to Plan</span>
          </button>
        </div>
      </div>

      {/* Grid: Plan Overview + Lunch Counts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Column 1: Current Plan Card */}
        <div className="bg-black text-white rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4C00]">
                Current Plan
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-black uppercase">
                ● {status}
              </span>
            </div>

            <h3 className="text-2xl font-black">{planName}</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Guaranteed daily desk delivery to Landmark Towers before 12:00 PM.
            </p>

            <div className="mt-6 pt-6 border-t border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Plan Period:</span>
                <span className="font-bold text-white">{startDate} – {endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Lunches:</span>
                <span className="font-bold text-white">{totalLunches} Meals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Payment Status:</span>
                <span className="font-bold text-emerald-400">Paid in Full (Flutterwave MFB Verified)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800">
            <button
              onClick={onAddMoreLunches}
              className="w-full py-3 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>Manage Selected Days</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Column 2: Lunches Usage Breakdown */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-3">
              Lunches Allocation
            </span>
            <h3 className="text-lg font-black text-black">
              Usage Breakdown
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-zinc-150">
                <span className="font-semibold text-zinc-600">Selected in calendar:</span>
                <span className="font-black text-black">{selectedLunches} / {totalLunches}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-150">
                <span className="font-semibold text-emerald-900">Completed & dropped:</span>
                <span className="font-black text-emerald-700">{completedLunches} Lunches</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-150">
                <span className="font-semibold text-zinc-600">Upcoming scheduled:</span>
                <span className="font-black text-black">{upcomingLunches} Lunches</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/50 border border-orange-200">
                <span className="font-semibold text-zinc-600">Skipped (Saved to credits):</span>
                <span className="font-black text-[#FF4C00]">{skippedLunches} Lunches</span>
              </div>

            </div>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-zinc-100 text-center">
            <span className="text-xs font-bold text-zinc-700">
              {remainingToPick} lunches left to schedule on this plan.
            </span>
          </div>
        </div>

      </div>

      {/* Official Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="flex items-center space-x-3 pb-4 border-b border-zinc-200">
              <img
                src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                alt="11 to 12"
                className="h-8 w-auto object-contain"
              />
              <div>
                <h4 className="text-sm font-black text-black">11 to 12 Official Receipt</h4>
                <p className="text-[10px] text-zinc-500">Flutterwave MFB Direct Settlement</p>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="my-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Order Reference:</span>
                <span className="font-mono font-bold text-black">11TO12-2026-0842</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer Name:</span>
                <span className="font-bold text-black">{userProfile?.name || 'Active Subscriber'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Workplace:</span>
                <span className="font-bold text-black">{userProfile?.company || userProfile?.address || 'Victoria Island, Lagos'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Package:</span>
                <span className="font-bold text-black">Desk Drop (20 Lunches)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Bonus Applied:</span>
                <span className="font-bold text-emerald-700">20th Day Free (100% Off)</span>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-black">
                <span>Total Paid:</span>
                <span className="text-[#FF4C00]">₦90,000 NGN</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                <span>Payment Status:</span>
                <span>Confirmed & Verified</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setShowInvoiceModal(true);
                }}
                className="py-2.5 rounded-full border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-black flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FF4C00]" />
                <span>Invoice PDF</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="py-2.5 rounded-full bg-black hover:bg-zinc-800 text-xs font-bold text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Downloadable / Printable Invoice Slip Modal */}
      {showInvoiceModal && (
        <InvoiceSlipModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={currentOrderData}
        />
      )}

      {/* Add Plan Days Top-Up Modal */}
      {showAddDaysModal && (
        <AddPlanDaysModal
          isOpen={showAddDaysModal}
          onClose={() => setShowAddDaysModal(false)}
          subscriberName={userProfile?.name || 'Active Subscriber'}
          subscriberEmail={userProfile?.email || 'subscriber@11to12.com'}
          subscriberPhone={userProfile?.phone || CONTACT_CONFIG.whatsappDisplay}
          company={userProfile?.company || 'Corporate Desk Drop'}
          officeAddress={userProfile?.address || 'Victoria Island, Lagos'}
          onTopUpRequested={(days, amount, refId) => {
            if (onTopUpRequested) {
              onTopUpRequested(days, amount, refId);
            }
          }}
        />
      )}

    </div>
  );
};
