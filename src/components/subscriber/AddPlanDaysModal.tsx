import React, { useState } from 'react';
import {
  X,
  Plus,
  Check,
  Copy,
  Receipt,
  Download,
  MessageSquare,
  Mail,
  ShieldCheck,
  Sparkles,
  Calendar,
  Building,
} from 'lucide-react';
import { InvoiceSlipModal } from '../marketing/InvoiceSlipModal';
import { OrderSubmission } from '../../types';
import { CONTACT_CONFIG } from '../../config/contactConfig';

interface AddPlanDaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriberName: string;
  subscriberEmail: string;
  subscriberPhone: string;
  company: string;
  officeAddress: string;
  onTopUpRequested: (days: number, amountNGN: number, refId: string) => void;
}

export const AddPlanDaysModal: React.FC<AddPlanDaysModalProps> = ({
  isOpen,
  onClose,
  subscriberName,
  subscriberEmail,
  subscriberPhone,
  company,
  officeAddress,
  onTopUpRequested,
}) => {
  const [selectedDays, setSelectedDays] = useState<number>(10);
  const [copiedBank, setCopiedBank] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [topUpSubmitted, setTopUpSubmitted] = useState(false);
  const [showInvoiceSlip, setShowInvoiceSlip] = useState(false);

  if (!isOpen) return null;

  // Calculate pricing
  const costPerDay = 2900;
  const subtotal = selectedDays * costPerDay;
  const discount = selectedDays >= 20 ? 2900 : 0; // 20th Day Free
  const finalTotal = Math.max(0, subtotal - discount);

  const invoiceRef = `11TO12-TOPUP-${Date.now().toString().slice(-4)}`;

  const mockTopUpOrder: OrderSubmission = {
    id: invoiceRef,
    fullName: subscriberName,
    email: subscriberEmail,
    phone: subscriberPhone,
    company: company,
    officeAddress: officeAddress,
    selectedDays: Array.from({ length: selectedDays }).map((_, idx) => ({
      dateStr: `2026-11-${String(idx + 1).padStart(2, '0')}`,
      meal: {
        id: `topup-meal-${idx}`,
        dateStr: `2026-11-${String(idx + 1).padStart(2, '0')}`,
        day: (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][idx % 5]) as any,
        mealName: '11 to 12 Kitchen Daily Special',
        mealCategory: 'Rice',
      },
    })),
    totalDays: selectedDays,
    subtotalNGN: subtotal,
    discountNGN: discount,
    finalTotalNGN: finalTotal,
    submittedAt: new Date().toISOString(),
    paymentStatus: 'Pending Verification',
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('9838242145');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  };

  const handleSubmitTopUp = () => {
    onTopUpRequested(selectedDays, finalTotal, invoiceRef);
    setTopUpSubmitted(true);
  };

  const waMessage = `Hello 11 to 12 Kitchen! I am topping up my lunch plan with +${selectedDays} days (₦${finalTotal.toLocaleString()} NGN).%0A%0A• Subscriber: ${encodeURIComponent(
    subscriberName
  )} (${encodeURIComponent(company)})%0A• Invoice Ref: ${invoiceRef}%0A• Amount: ₦${finalTotal.toLocaleString()} NGN%0A%0AAttached is my bank transfer receipt for verification and activation:`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-['Poppins']">
        <div className="relative w-full max-w-xl bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-2 text-[#FF4C00] mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Add More Lunch Days
            </span>
          </div>

          <h3 className="text-2xl font-black text-black">
            Extend Your Lunch Plan
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Add more days to your active desk drop schedule. New days are automatically unlocked once the kitchen verifies payment.
          </p>

          {!topUpSubmitted ? (
            <div className="mt-5 space-y-5">
              
              {/* Day Selection Options */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2">
                  Select Days to Add
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((days) => {
                    const price = days * 2900 - (days >= 20 ? 2900 : 0);
                    const isSelected = selectedDays === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setSelectedDays(days)}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#FF4C00] text-white border-[#FF4C00] shadow-sm'
                            : 'bg-[#FAF7F2] border-zinc-200 text-zinc-800 hover:border-black'
                        }`}
                      >
                        {days === 20 && (
                          <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                            isSelected ? 'bg-black text-white' : 'bg-emerald-600 text-white'
                          }`}>
                            1 Free Day
                          </span>
                        )}
                        <span className="text-lg font-black block">+{days} Days</span>
                        <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-white/90' : 'text-zinc-500'}`}>
                          ₦{price.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Breakdown Box */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Additional workdays:</span>
                  <span className="font-bold text-black">+{selectedDays} Lunches</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Price per lunch plate:</span>
                  <span className="font-bold text-black">₦2,900 NGN</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold">
                    <span>20th Day Free Bonus:</span>
                    <span>-₦{discount.toLocaleString()} NGN</span>
                  </div>
                )}
                <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline text-sm font-black">
                  <span>Total Amount Payable:</span>
                  <span className="text-lg text-[#FF4C00]">₦{finalTotal.toLocaleString()} NGN</span>
                </div>
              </div>

              {/* Official Flutterwave Bank Account Box */}
              <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00]">
                    Direct Bank Remittance
                  </span>
                  <span className="text-[10px] text-zinc-400">Ref: {invoiceRef}</span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs text-zinc-400 block">Account Number</span>
                    <span className="text-xl font-black text-white tracking-wider select-all">
                      9838242145
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBank ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800 text-zinc-400">
                  <div>
                    <span className="text-[10px] block">Bank Name:</span>
                    <span className="font-bold text-zinc-200">Flutterwave MFB (Formerly OK MFB)</span>
                  </div>
                  <div>
                    <span className="text-[10px] block">Account Name:</span>
                    <span className="font-bold text-zinc-200">11 TO 12 FOODS LTD 11 TO 12 FOODS FLW</span>
                  </div>
                </div>
              </div>

              {/* Invoice Download & WhatsApp / Email Actions */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2">
                  Invoice & Payment Proof Channels
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Download PDF Button */}
                  <button
                    type="button"
                    onClick={() => setShowInvoiceSlip(true)}
                    className="py-2.5 px-3 rounded-xl border border-zinc-300 hover:border-black text-xs font-bold text-black flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FF4C00]" />
                    <span>Download PDF</span>
                  </button>

                  {/* Send to Email Button */}
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    className="py-2.5 px-3 rounded-xl border border-zinc-300 hover:border-black text-xs font-bold text-black flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{emailSent ? 'Sent to Email!' : 'Send to Email'}</span>
                  </button>

                  {/* WhatsApp Direct Link */}
                  <a
                    href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Proof</span>
                  </a>
                </div>

                {emailSent && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-2 text-center">
                    ✓ Official top-up invoice sent to {subscriberEmail}!
                  </p>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={handleSubmitTopUp}
                  className="w-full py-3.5 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>I Have Made This Transfer (Submit For Verification)</span>
                </button>
                <p className="text-[10px] text-zinc-400 text-center mt-2">
                  Once submitted, the admin kitchen dashboard verifies remittance and activates your +{selectedDays} days immediately.
                </p>
              </div>

            </div>
          ) : (
            /* Confirmation Step */
            <div className="py-6 text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <Check className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-xl font-black text-black">Top-Up Request Submitted!</h4>
                <p className="text-xs text-zinc-600 mt-1 max-w-md mx-auto">
                  Invoice Ref <span className="font-mono font-bold text-black">{invoiceRef}</span> for +{selectedDays} days (₦{finalTotal.toLocaleString()}) has been queued for verification.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 text-xs text-left max-w-md mx-auto space-y-2">
                <p className="text-zinc-700">
                  <strong>What happens next:</strong>
                </p>
                <ul className="text-zinc-600 space-y-1 list-disc pl-4">
                  <li>Please forward your transfer receipt to WhatsApp ({CONTACT_CONFIG.whatsappDisplay}) or email ({CONTACT_CONFIG.supportEmail}).</li>
                  <li>Admin checks Flutterwave MFB settlement.</li>
                  <li>Your lunch dashboard will automatically show +{selectedDays} additional meal days!</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setShowInvoiceSlip(true)}
                  className="px-5 py-2.5 rounded-full border border-zinc-300 hover:border-black text-xs font-bold text-black flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#FF4C00]" />
                  <span>Download Invoice PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Invoice Slip Modal View / Print / PDF */}
      {showInvoiceSlip && (
        <InvoiceSlipModal
          isOpen={showInvoiceSlip}
          onClose={() => setShowInvoiceSlip(false)}
          order={mockTopUpOrder}
        />
      )}
    </>
  );
};
