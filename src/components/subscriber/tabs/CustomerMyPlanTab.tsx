import React, { useState } from 'react';
import {
  UserProfile,
  OrderSubmission,
} from '../../../types';
import {
  Calendar,
  CheckCircle2,
  Receipt,
  MapPin,
  Clock,
  RotateCcw,
  Sparkles,
  Plus,
  ArrowRight,
  Download,
  ShieldCheck,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { downloadInvoiceDocument } from '../../../utils/invoiceDownload';

interface CustomerMyPlanTabProps {
  userProfile: UserProfile;
  onOpenAddDaysModal: () => void;
  onOpenAddressModal: () => void;
}

export const CustomerMyPlanTab: React.FC<CustomerMyPlanTabProps> = ({
  userProfile,
  onOpenAddDaysModal,
  onOpenAddressModal,
}) => {
  const selectedDays = userProfile.selectedDays || [];
  const skippedDates = userProfile.skippedDates || [];

  // Sort dates to calculate start and end dates
  const sortedDays = [...selectedDays].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  const planStartDate = sortedDays[0]?.dateStr || '—';
  const planEndDate = sortedDays[sortedDays.length - 1]?.dateStr || '—';

  const totalSelectedLunches = selectedDays.length;
  const totalSkippedLunches = skippedDates.length;
  const remainingLunches = Math.max(0, totalSelectedLunches - totalSkippedLunches);
  const remainingCredits = userProfile.creditsBalance || 0;

  // Mock / Real order object for invoice download
  const handleDownloadReceipt = () => {
    const mockOrder: OrderSubmission = {
      id: userProfile.orderRef || userProfile.id || 'ORD-1112',
      fullName: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      company: userProfile.company || 'Corporate Office',
      officeAddress: userProfile.address || 'Desk Drop Location',
      secondAddress: userProfile.secondAddress,
      selectedDays,
      totalDays: totalSelectedLunches,
      subtotalNGN: userProfile.orderTotalNGN || totalSelectedLunches * 3200,
      discountNGN: 0,
      finalTotalNGN: userProfile.orderTotalNGN || totalSelectedLunches * 3200,
      submittedAt: new Date().toISOString(),
      paymentStatus: 'Confirmed',
    };
    downloadInvoiceDocument(mockOrder);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Plan</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {userProfile.subscriptionStatus || 'Active'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Complete details of your lunch plan, order payment receipt, and delivery settings
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddDaysModal}
          className="px-4 py-2 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add More Workdays</span>
        </button>
      </div>

      {/* 3 Pillars of The Plan (Clearly distinguished) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Pillar 1: Selected Lunches */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Total Selected Lunches
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-zinc-900">{totalSelectedLunches}</span>
            <span className="text-xs text-zinc-500">days booked</span>
          </div>
          <p className="text-[11px] text-zinc-400 pt-1">
            From <strong>{planStartDate}</strong> to <strong>{planEndDate}</strong>
          </p>
        </div>

        {/* Pillar 2: Skipped Lunches */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
            Skipped Lunches
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-amber-700">{totalSkippedLunches}</span>
            <span className="text-xs text-zinc-500">meals skipped</span>
          </div>
          <p className="text-[11px] text-zinc-400 pt-1">
            Excluded from kitchen delivery
          </p>
        </div>

        {/* Pillar 3: Remaining Credits */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Remaining Credits
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-emerald-700">{remainingCredits}</span>
            <span className="text-xs text-zinc-500">available in wallet</span>
          </div>
          <p className="text-[11px] text-zinc-400 pt-1">
            Redeemable for future extra plates
          </p>
        </div>

      </div>

      {/* Order & Payment Information */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Order & Payment Receipt</h2>
            <p className="text-xs text-zinc-500">Payment confirmed and verified with 11 to 12 finance</p>
          </div>

          <button
            type="button"
            onClick={handleDownloadReceipt}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Download Invoice (.html)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Plan Name</span>
            <span className="font-bold text-zinc-900 text-sm mt-0.5 block">{userProfile.planName}</span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Order Total Paid</span>
            <span className="font-bold text-zinc-900 text-sm mt-0.5 block">
              ₦{(userProfile.orderTotalNGN || totalSelectedLunches * 3200).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Payment Status</span>
            <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
              ✓ Confirmed & Paid
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Order Reference</span>
            <span className="font-mono text-zinc-700 text-xs mt-0.5 block truncate" title={userProfile.orderRef || userProfile.id}>
              {userProfile.orderRef || userProfile.id}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Addresses */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Delivery Information</h2>
            <p className="text-xs text-zinc-500">Workstation locations for 11:00 AM – 12:00 PM drop</p>
          </div>

          <button
            type="button"
            onClick={onOpenAddressModal}
            className="text-xs font-bold text-[#FF4C00] hover:underline cursor-pointer"
          >
            Update Address
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-zinc-500 font-semibold text-[10px] uppercase">
              <MapPin className="w-3.5 h-3.5 text-[#FF4C00]" />
              <span>Primary Delivery Address</span>
            </div>
            <p className="font-bold text-zinc-900 text-sm pt-1">
              {userProfile.address || 'Office Desk'}
            </p>
            <p className="text-zinc-500">
              {userProfile.company || 'Corporate Office'} • {userProfile.deliveryArea || 'Victoria Island'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-zinc-400 font-semibold text-[10px] uppercase">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>Second Delivery Address</span>
            </div>
            <p className="font-bold text-zinc-800 text-sm pt-1">
              {userProfile.secondAddress || 'None provided'}
            </p>
            <p className="text-zinc-400">
              Alternate desk or reception for backup delivery
            </p>
          </div>
        </div>
      </div>

      {/* Selected Lunch Dates List */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Selected Meal Schedule ({totalSelectedLunches})
            </h2>
            <p className="text-xs text-zinc-500">All dates included in your current subscription</p>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-2xl p-2 bg-zinc-50/50 text-xs">
          {sortedDays.map((d, idx) => {
            const isSkipped = skippedDates.includes(d.dateStr);
            return (
              <div key={idx} className="py-2.5 px-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-zinc-900">{d.dateStr}</span>
                  <span className="text-zinc-400">({d.day})</span>
                  {isSkipped && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Skipped
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-zinc-700 font-medium">{d.meal.mealName}</span>
                  {d.selectedSwallow && (
                    <span className="ml-1 text-[10px] font-bold text-[#FF4C00] bg-orange-50 px-1.5 py-0.5 rounded">
                      {d.selectedSwallow}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
