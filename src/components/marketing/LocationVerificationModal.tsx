import React, { useState } from 'react';
import { X, MapPin, Calendar, CreditCard, Utensils, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WaitlistLead, CustomerRecord } from '../../types';
import { getStandardPhoneKey, normalizeEmail } from '../../utils/phoneUtils';
import { isEmailAlreadyRegisteredInFirestore } from '../../services/firebase';

interface LocationVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPlan: () => void;
  onJoinWaitlist?: (leadData: {
    name: string;
    email: string;
    phone: string;
    workplace: string;
    addressFloor: string;
    memberCode: string;
  }) => Promise<{ success: boolean; lead?: WaitlistLead; error?: string; message?: string; existingLead?: WaitlistLead }>;
  existingWaitlist?: WaitlistLead[];
  existingCustomers?: CustomerRecord[];
}

const ISLAND_LOCATIONS = [
  'Epe',
  'Eleko',
  'Ibeju-Lekki',
  'Sangotedo',
  'Ajah',
  'VGC',
  'Chevron',
  'Agungi',
  'Jakunde',
  'Maruwa',
  'Lekki Phase 1',
  'Civic Center',
  'Obalende',
  'CMS',
];

export const LocationVerificationModal: React.FC<LocationVerificationModalProps> = ({
  isOpen,
  onClose,
  onProceedToPlan,
  onJoinWaitlist,
  existingWaitlist = [],
  existingCustomers = [],
}) => {
  const [step, setStep] = useState<'question' | 'outside-zone' | 'steps-guide' | 'details'>('question');

  // Form states for 'details' step
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [addressFloor, setAddressFloor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // After the question: proceed to 3-step card guide
  const handleYes = () => {
    setStep('steps-guide');
  };

  const handleNo = () => {
    setStep('outside-zone');
  };

  const handleIgnore = () => {
    setStep('steps-guide');
  };

  const handleContinueToDetails = () => {
    setStep('details');
  };

  const handleSkip = () => {
    onProceedToPlan();
  };

  // Submit details to waitlist with strict duplicate prevention
  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = fullName.trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = phone.trim();
    const phoneKey = getStandardPhoneKey(cleanPhone);

    if (!cleanName) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('Please enter a valid work email address.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setFormError('Please enter a valid Nigerian phone number (e.g. +234 903 955 7219).');
      return;
    }

    // Client-side strict uniqueness check against existing waitlist and customer records
    const isEmailTaken =
      existingWaitlist.some((l) => normalizeEmail(l.email) === cleanEmail) ||
      existingCustomers.some((c) => normalizeEmail(c.email) === cleanEmail);

    if (isEmailTaken) {
      setFormError('This email address is already registered on the waitlist.');
      return;
    }

    const isPhoneTaken =
      existingWaitlist.some((l) => getStandardPhoneKey(l.phone) === phoneKey) ||
      existingCustomers.some((c) => getStandardPhoneKey(c.phone) === phoneKey);

    if (isPhoneTaken) {
      setFormError('This phone number is already registered on the waitlist.');
      return;
    }

    const memberCode = `DD-${Math.floor(10000 + Math.random() * 90000)}`;

    const leadData = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      workplace: workplace.trim() || 'Lagos Island Office',
      addressFloor: addressFloor.trim() || 'Desk Drop Station',
      memberCode,
    };

    setIsSubmitting(true);

    try {
      const remoteDup = await isEmailAlreadyRegisteredInFirestore(cleanEmail, {
        includeWaitlist: true,
        includeOrders: true,
      });
      if (remoteDup.exists) {
        setIsSubmitting(false);
        setFormError(remoteDup.reason || 'This email address is already registered on our list.');
        return;
      }

      if (onJoinWaitlist) {
        const res = await onJoinWaitlist(leadData);
        if (!res.success) {
          setIsSubmitting(false);
          setFormError(res.message || 'Unable to submit details. Please verify your info.');
          return;
        }
      }

      // Store in localStorage for pre-populating checkout later
      try {
        localStorage.setItem(
          '11to12_active_member',
          JSON.stringify({
            fullName: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            company: workplace.trim(),
            address: addressFloor.trim(),
            memberCode,
          })
        );
      } catch {}

      setIsSuccess(true);
      setTimeout(() => {
        onProceedToPlan();
      }, 900);
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err?.message || 'A network error occurred. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-['Poppins'] animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200/80 shadow-2xl p-6 sm:p-7 text-left overflow-hidden max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-100 transition cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* SCREEN 1: QUESTION */}
        {step === 'question' && (
          <div className="space-y-5 text-center">
            {/* Location Icon */}
            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF4C00]">
              <MapPin className="w-6 h-6" />
            </div>

            {/* Question */}
            <h3
              id="location-modal-title"
              className="text-xl sm:text-2xl font-black text-black tracking-tight"
            >
              Do you stay or work in Lagos Island?
            </h3>

            {/* Continuous Left-to-Right Flowing Locations Ticker */}
            <div className="relative w-full py-2 overflow-hidden select-none">
              {/* Left/Right Fading Gradients */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

              <div className="animate-flow-left-to-right flex items-center gap-2">
                {[...ISLAND_LOCATIONS, ...ISLAND_LOCATIONS, ...ISLAND_LOCATIONS].map((loc, idx) => (
                  <button
                    key={`${loc}-${idx}`}
                    type="button"
                    tabIndex={-1}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 whitespace-nowrap shadow-2xs transition-colors shrink-0"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Yes / No */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleYes}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={handleNo}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm uppercase tracking-wider border border-zinc-200/80 transition cursor-pointer active:scale-98"
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 1B: OUTSIDE ZONE (IF USER CLICKED NO) */}
        {step === 'outside-zone' && (
          <div className="space-y-6 py-2 text-center">
            {/* Location Icon */}
            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF4C00]">
              <MapPin className="w-6 h-6" />
            </div>

            {/* Direct message requested by user */}
            <p className="text-base sm:text-lg font-bold text-black leading-snug px-2">
              We are currently only delivering to 9 to 5ers in Lagos Island.
            </p>

            {/* Action Buttons: Ignore / Back */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleIgnore}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
              >
                Ignore
              </button>
              <button
                type="button"
                onClick={() => setStep('question')}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm uppercase tracking-wider border border-zinc-200/80 transition cursor-pointer active:scale-98"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: 3-STEP CARD-LIKE UI */}
        {step === 'steps-guide' && (
          <div className="space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C00]">
                Quick Guide
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight mt-0.5">
                How It Works
              </h3>
            </div>

            {/* Card-like Steps */}
            <div className="space-y-3">
              {/* Step 1/3 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF4C00] font-black text-xs flex items-center justify-center shrink-0 border border-orange-200">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] block">
                    Step 1/3
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-900 mt-0.5">
                    Select the number of days you want food to be delivered
                  </p>
                </div>
              </div>

              {/* Step 2/3 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF4C00] font-black text-xs flex items-center justify-center shrink-0 border border-orange-200">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] block">
                    Step 2/3
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-900 mt-0.5">
                    Make payment and get logged in to dashboard
                  </p>
                </div>
              </div>

              {/* Step 3/3 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF4C00] font-black text-xs flex items-center justify-center shrink-0 border border-orange-200">
                  <Utensils className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] block">
                    Step 3/3
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-900 mt-0.5">
                    Start receiving meals on your selected days
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button: Continue */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleContinueToDetails}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: DETAILS FORM (WITH REALTIME WAITLIST SYNC & SKIP) */}
        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C00]">
                Priority Registration
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight mt-0.5">
                Enter Your Details
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Fill in your workplace info or skip to begin picking your lunch days.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {isSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-black">You are on the priority waitlist!</h4>
                <p className="text-xs text-zinc-500">Opening meal selection...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDetails} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Babatunde Adeleke"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#FF4C00] bg-zinc-50 focus:bg-white transition"
                  />
                </div>

                {/* Work Email */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. adeleke@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#FF4C00] bg-zinc-50 focus:bg-white transition"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +234 903 955 7219"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#FF4C00] bg-zinc-50 focus:bg-white transition"
                  />
                </div>

                {/* Workplace / Company */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Workplace / Company
                  </label>
                  <input
                    type="text"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    placeholder="e.g. Standard Chartered / Civic Towers"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#FF4C00] bg-zinc-50 focus:bg-white transition"
                  />
                </div>

                {/* Floor / Delivery Address */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Office Address / Floor
                  </label>
                  <input
                    type="text"
                    value={addressFloor}
                    onChange={(e) => setAddressFloor(e.target.value)}
                    placeholder="e.g. 6th Floor, Victoria Island, Lagos"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#FF4C00] bg-zinc-50 focus:bg-white transition"
                  />
                </div>

                {/* Action Buttons: Submit / Skip */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit & Pick Meals</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider border border-zinc-200/80 transition cursor-pointer shrink-0"
                  >
                    Skip
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
