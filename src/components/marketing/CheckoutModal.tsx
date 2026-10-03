import React, { useState, useEffect } from 'react';
import { SelectedLunchDay, OrderSummary, OrderSubmission, WaitlistLead, CustomerRecord } from '../../types';
import { X, Copy, Check, ShieldCheck, MapPin, Building, Phone, Mail, User, CheckCircle2, MessageSquare, FileText, Download, Ticket, AlertCircle, Sparkles } from 'lucide-react';
import { InvoiceSlipModal } from './InvoiceSlipModal';
import { downloadInvoiceDocument } from '../../utils/invoiceDownload';
import { CONTACT_CONFIG } from '../../config/contactConfig';
import { getStandardPhoneKey, normalizeEmail } from '../../utils/phoneUtils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDays: SelectedLunchDay[];
  summary: OrderSummary | null;
  onOrderSubmitted: (order: OrderSubmission) => void;
  waitlistLeads?: WaitlistLead[];
  customers?: CustomerRecord[];
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedDays,
  summary,
  onOrderSubmitted,
  waitlistLeads = [],
  customers = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showInvoiceSlip, setShowInvoiceSlip] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');

  // Member Code State
  const [memberCodeInput, setMemberCodeInput] = useState('');
  const [appliedMemberCode, setAppliedMemberCode] = useState<string | null>(null);
  const [memberCodeError, setMemberCodeError] = useState<string | null>(null);
  const [memberCodeSuccess, setMemberCodeSuccess] = useState<string | null>(null);

  // Generated Order reference for the invoice slip
  const [createdOrder, setCreatedOrder] = useState<OrderSubmission | null>(null);

  const handleApplyMemberCode = () => {
    const cleanCode = memberCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setMemberCodeError('Please enter your unique member code.');
      setMemberCodeSuccess(null);
      return;
    }

    // Search in waitlistLeads
    const match = waitlistLeads.find(
      (l) => l.memberCode && l.memberCode.toUpperCase() === cleanCode
    );

    if (match) {
      setFullName(match.name);
      setEmail(match.email);
      setPhone(match.phone);
      setCompany(match.workplace);
      setOfficeAddress(match.addressFloor);
      setAppliedMemberCode(match.memberCode);
      setMemberCodeSuccess(`✓ Verified Member Code: ${match.name}! Your contact and desk drop details have been auto-filled.`);
      setMemberCodeError(null);
    } else {
      // Check localStorage backup
      try {
        const rawSavedLead = localStorage.getItem('11to12_waitlist_lead');
        if (rawSavedLead) {
          const lead = JSON.parse(rawSavedLead) as WaitlistLead;
          if (lead.memberCode && lead.memberCode.toUpperCase() === cleanCode) {
            setFullName(lead.name);
            setEmail(lead.email);
            setPhone(lead.phone);
            setCompany(lead.workplace);
            setOfficeAddress(lead.addressFloor);
            setAppliedMemberCode(lead.memberCode);
            setMemberCodeSuccess(`✓ Verified Member Code: ${lead.name}! Your contact and desk drop details have been auto-filled.`);
            setMemberCodeError(null);
            return;
          }
        }
      } catch {
        // ignore
      }

      setMemberCodeError('Member code not found. You can still fill in your contact details below manually.');
      setMemberCodeSuccess(null);
    }
  };

  if (!isOpen || !summary) return null;

  const currentPreviewOrder: OrderSubmission = createdOrder || {
    id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    fullName: fullName || 'Valued Subscriber',
    email: email || 'subscriber@company.ng',
    phone: phone || '+234 800 000 0000',
    company: company || 'Corporate Office',
    officeAddress: officeAddress || 'Desk Drop Location',
    selectedDays,
    totalDays: summary.totalDays,
    subtotalNGN: summary.subtotalNGN,
    discountNGN: summary.discountNGN,
    finalTotalNGN: summary.finalTotalNGN,
    submittedAt: new Date().toISOString(),
    paymentStatus: 'Pending Verification',
    memberCode: appliedMemberCode || undefined,
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('9838242145');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    const targetEmail = normalizeEmail(email);
    const targetPhoneKey = getStandardPhoneKey(phone);

    const existingCustEmail = customers.find((c) => normalizeEmail(c.email) === targetEmail);
    const existingCustPhone = customers.find((c) => getStandardPhoneKey(c.phone) === targetPhoneKey);

    if (existingCustEmail) {
      setCheckoutError(`An active subscription already exists for ${targetEmail}. If you need to add days, please use the Subscriber Dashboard top-up.`);
      return;
    }
    if (existingCustPhone) {
      setCheckoutError(`An active subscription already exists for phone number ${phone}. Please sign in to your dashboard.`);
      return;
    }

    setIsSubmitting(true);

    const submission: OrderSubmission = {
      id: currentPreviewOrder.id,
      fullName: fullName.trim() || 'Valued Subscriber',
      email: email.trim() || 'subscriber@company.ng',
      phone: phone.trim() || '+234 800 000 0000',
      company: company.trim() || 'Corporate Office',
      officeAddress: officeAddress.trim() || 'Desk Drop Location',
      selectedDays,
      totalDays: summary.totalDays,
      subtotalNGN: summary.subtotalNGN,
      discountNGN: summary.discountNGN,
      finalTotalNGN: summary.finalTotalNGN,
      submittedAt: new Date().toISOString(),
      paymentStatus: 'Pending Verification',
      memberCode: appliedMemberCode || undefined,
    };

    setTimeout(() => {
      setCreatedOrder(submission);
      setIsSubmitting(false);
      setIsSubmitted(true);
      onOrderSubmitted(submission);
      // Automatically trigger download of invoice file
      downloadInvoiceDocument(submission);
    }, 800);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto font-['Poppins']">
        <div className="relative w-full max-w-xl bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          
          {/* Top Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-100 bg-[#FAF7F2] shrink-0">
            <div className="flex items-center space-x-3">
              <img
                src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                alt="11 to 12"
                className="h-8 w-auto object-contain"
              />
              <div>
                <h3 className="text-lg font-bold text-black">Official Payout & Registration</h3>
                <p className="text-xs text-zinc-500">11 to 12 Direct Desk Delivery</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-200 transition cursor-pointer text-zinc-500"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Post-Submission Screen (Does NOT take them to a dashboard yet!) */}
          {isSubmitted && createdOrder ? (
            <div className="p-6 sm:p-10 text-center space-y-5 bg-white overflow-y-auto flex-1">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-black">Order & Details Registered!</h3>
                <p className="text-xs font-semibold text-[#FF4C00] uppercase tracking-wider mt-1">
                  Order ID: {createdOrder.id} • {summary.totalDays} Lunch Days
                </p>
              </div>

              {/* Instructions box */}
              <div className="text-xs text-zinc-600 space-y-3 max-w-md mx-auto text-left bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-zinc-200">
                <p className="font-semibold text-zinc-900">
                  Thank you, {fullName}! Your lunch order ({createdOrder.id}) has been forwarded directly to Chef Justice's kitchen control operations.
                </p>
                
                <div className="pt-2 border-t border-zinc-200">
                  <span className="font-bold text-zinc-900 block mb-1">
                    Next Step: Send Invoice & Payment Confirmation Both
                  </span>
                  <p className="text-zinc-600">
                    Your invoice has been automatically generated. Please download your invoice below, and send both the <strong>Invoice Slip</strong> and your <strong>Bank Transfer Screenshot</strong> to:
                  </p>
                  <div className="mt-2 space-y-1 font-semibold text-zinc-800">
                    <div>📱 WhatsApp / Phone: <span className="text-[#FF4C00]">{CONTACT_CONFIG.whatsappDisplay}</span></div>
                    <div>✉️ Email: <span className="text-[#FF4C00]">{CONTACT_CONFIG.supportEmail}</span></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 text-[11px] text-zinc-500">
                  ℹ️ Your personal Subscriber Dashboard is being prepared by our team. Login credentials will be sent directly to your work email once payment proof is matched.
                </div>
              </div>

              {/* Download Invoice Button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    downloadInvoiceDocument(createdOrder);
                    setShowInvoiceSlip(true);
                  }}
                  className="px-6 py-3 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wide transition shadow-sm inline-flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download Invoice (.html / PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoiceSlip(true)}
                  className="px-5 py-3 rounded-full border border-zinc-300 hover:bg-zinc-100 text-zinc-800 font-bold text-xs uppercase tracking-wide transition inline-flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Slip</span>
                </button>
              </div>

              {/* Secondary actions: Send WhatsApp or Return Home */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                <a
                  href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
                    `Hello 11 to 12! I have made the bank transfer for my order (${createdOrder.id}) for ${summary.totalDays} lunch days (₦${summary.finalTotalNGN.toLocaleString()}). Name: ${fullName}. Attached is my payment proof and invoice slip:`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wide transition shadow-sm flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Proof on WhatsApp</span>
                </a>

                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs uppercase tracking-wide transition cursor-pointer"
                >
                  Close & Return Home
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="p-6 sm:p-8 space-y-6 bg-white overflow-y-auto flex-1">
              
              {/* Order Bill Summary Badge */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                    Lunch Plan Total
                  </span>
                  <span className="text-xs font-semibold text-zinc-700">
                    {summary.totalDays} Scheduled Workdays
                    {summary.hasTwentyDayBonus && (
                      <span className="text-emerald-600 font-bold ml-1.5">(20th Day Free Applied)</span>
                    )}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-400 block font-medium">Amount to Pay</span>
                  <span className="text-2xl font-black text-black">
                    ₦{summary.finalTotalNGN.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Official Bank Account Card */}
              <div className="p-5 rounded-2xl bg-black text-white border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C00]">
                    Official Bank Account
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Account</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-medium block">Account Number</span>
                    <span className="text-xl sm:text-2xl font-black tracking-wider text-white select-all">
                      9838242145
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-medium block">Bank Name</span>
                    <span className="text-base sm:text-lg font-extrabold text-white">
                      Flutterwave MFB
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-normal">(Formerly OK MFB)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                  Account Name: <strong className="text-white">11 TO 12 FOODS LTD 11 TO 12 FOODS FLW</strong>
                </div>
              </div>

              {/* Unique Waitlist Member Code Auto-Fill Box */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#FF4C00]/30 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Ticket className="w-4 h-4 text-[#FF4C00]" />
                    <span className="text-xs font-bold text-zinc-900">
                      Have a Waitlist Member Code?
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-500">
                    Skip filling your contact again
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Enter Unique Member Code"
                    value={memberCodeInput}
                    onChange={(e) => {
                      setMemberCodeInput(e.target.value);
                      setMemberCodeError(null);
                    }}
                    className="flex-1 bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-black focus:outline-none focus:border-[#FF4C00]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyMemberCode}
                    className="px-4 py-2.5 rounded-xl bg-black hover:bg-[#FF4C00] text-white font-bold text-xs transition cursor-pointer shrink-0 shadow-xs"
                  >
                    Apply Code
                  </button>
                </div>

                {memberCodeSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{memberCodeSuccess}</span>
                  </div>
                )}

                {memberCodeError && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{memberCodeError}</span>
                  </div>
                )}
                
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Don't have a member code? Simply fill your contact and delivery location below.
                </p>
              </div>

              {/* Customer Details Form: Your Contact & Desk Drop Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black uppercase tracking-wider block">
                    Your Contact & Desk Drop Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceSlip(true)}
                    className="text-xs font-bold text-[#FF4C00] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Preview Invoice Slip</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-[#FF4C00]"
                      placeholder="Your Full Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-[#FF4C00]"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-[#FF4C00]"
                        placeholder="Phone Number"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Workplace / Building</label>
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-[#FF4C00]"
                      placeholder="Workplace / Office Building"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Delivery Address & Floor</label>
                    <input
                      type="text"
                      required
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-[#FF4C00]"
                      placeholder="Floor 4, Suite 402"
                    />
                  </div>
                </div>
              </div>

              {/* Duplicate Error Alert */}
              {checkoutError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Duplicate Registration:</span>
                    <span>{checkoutError}</span>
                  </div>
                </div>
              )}

              {/* Payment Proof Notification */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <span className="font-bold block mb-0.5">Payment Verification Instructions:</span>
                <span>
                  Transfer <strong>₦{summary.finalTotalNGN.toLocaleString()}</strong> to the Flutterwave MFB account above. You will be able to download your official invoice slip immediately to send alongside your transfer proof.
                </span>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-base transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registering Order & Generating Invoice...</span>
                    </div>
                  ) : (
                    <span>I Have Made Transfer • Submit Order</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-bold text-xs uppercase tracking-wide transition cursor-pointer"
                >
                  Cancel & Go Back
                </button>

                <div className="mt-2 text-center text-xs text-zinc-400 flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Your details will be logged in Chef Justice's dispatch operations</span>
                </div>
              </div>

            </form>
          )}

        </div>
      </div>

      {/* Invoice Slip Modal View / Print */}
      {showInvoiceSlip && (
        <InvoiceSlipModal
          isOpen={showInvoiceSlip}
          onClose={() => setShowInvoiceSlip(false)}
          order={createdOrder || currentPreviewOrder}
        />
      )}
    </>
  );
};
