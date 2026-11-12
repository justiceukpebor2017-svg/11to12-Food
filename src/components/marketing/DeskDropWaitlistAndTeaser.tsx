import React, { useState, useEffect } from 'react';
import { CheckCircle2, Utensils, Users, Sparkles, CheckCircle, Copy, Check, Ticket, ArrowRight, AlertTriangle, Loader2, Gift } from 'lucide-react';
import { WaitlistLead, CustomerRecord } from '../../types';
import { LAUNCH_CONFIG, getTimeUntilLaunch, subscribeLaunchConfig } from '../../config/launchConfig';
import { getStandardPhoneKey, normalizeEmail } from '../../utils/phoneUtils';

interface DeskDropWaitlistAndTeaserProps {
  waitlistCount?: number;
  confirmedSubscribersCount?: number;
  existingWaitlist?: WaitlistLead[];
  existingCustomers?: CustomerRecord[];
  onJoinWaitlist?: (leadData: {
    name: string;
    email: string;
    phone: string;
    workplace: string;
    addressFloor: string;
    memberCode: string;
  }) => Promise<{ success: boolean; lead?: WaitlistLead; error?: string; message?: string; existingLead?: WaitlistLead }>;
}

export const DeskDropWaitlistAndTeaser: React.FC<DeskDropWaitlistAndTeaserProps> = ({
  waitlistCount = 0,
  confirmedSubscribersCount = 0,
  existingWaitlist = [],
  existingCustomers = [],
  onJoinWaitlist,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [addressFloor, setAddressFloor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateFieldError, setDuplicateFieldError] = useState<'email' | 'phone' | 'both' | null>(null);
  const [existingLeadMatch, setExistingLeadMatch] = useState<WaitlistLead | null>(null);
  const [generatedMemberCode, setGeneratedMemberCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Dynamic countdown anchored directly to LAUNCH_CONFIG
  const [countdown, setCountdown] = useState(getTimeUntilLaunch());
  const [, setLaunchConfigTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeLaunchConfig(() => {
      setCountdown(getTimeUntilLaunch());
      setLaunchConfigTick((t) => t + 1);
    });
    const timer = setInterval(() => {
      setCountdown(getTimeUntilLaunch());
    }, 1000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  // Clear duplicate errors when typing
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (duplicateFieldError === 'email' || duplicateFieldError === 'both') {
      setDuplicateFieldError(null);
      setFormError(null);
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (duplicateFieldError === 'phone' || duplicateFieldError === 'both') {
      setDuplicateFieldError(null);
      setFormError(null);
    }
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setDuplicateFieldError(null);
    setExistingLeadMatch(null);

    const cleanName = fullName.trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = phone.trim();
    const phoneKey = getStandardPhoneKey(cleanPhone);

    if (!cleanName || !cleanEmail || !cleanPhone) {
      setFormError('Please fill in your full name, email address, and phone number.');
      return;
    }

    // Generate unique readable member code (e.g. DD-84920)
    const code = `DD-${Math.floor(10000 + Math.random() * 90000)}`;

    const newLeadData = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      workplace: workplace.trim() || 'Workplace / Office Building',
      addressFloor: addressFloor.trim() || 'Floor & Suite Location',
      memberCode: code,
    };

    setIsSubmitting(true);

    try {
      if (onJoinWaitlist) {
        const result = await onJoinWaitlist(newLeadData);
        if (!result.success) {
          setIsSubmitting(false);
          setFormError(result.message || 'Unable to register at this time. Please try again.');
          return;
        }

        const registeredCode = result.lead?.memberCode || code;
        setGeneratedMemberCode(registeredCode);

        // Store in localStorage for quick auto-fill in checkout
        try {
          localStorage.setItem('11to12_waitlist_code', registeredCode);
          if (result.lead) {
            localStorage.setItem('11to12_waitlist_lead', JSON.stringify(result.lead));
          }
        } catch {
          // ignore storage errors
        }
      } else {
        setGeneratedMemberCode(code);
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedMemberCode) return;
    navigator.clipboard.writeText(generatedMemberCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const scrollToPlanBuilder = () => {
    const el = document.getElementById('plan-builder') || document.getElementById('menu');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMenu = () => {
    const el = document.getElementById('menu');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="reserve-desk" className="relative py-16 sm:py-24 bg-zinc-100 text-[#1A1A1A] font-['Poppins']">
      <div id="watch-and-reserve" className="absolute -top-16 left-0" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Reserve Your Desk Drop Form — Warm Gray & Orange Card (No black background) */}
        <div id="reserve-form" className="bg-zinc-200/80 rounded-3xl p-6 sm:p-10 border border-zinc-300 shadow-lg">
          <div className="text-center space-y-1 mb-8">
            <h2 className="text-2xl sm:text-4xl font-black text-black">
              Reserve Your Desk Drop
            </h2>
            <p className="text-sm sm:text-base text-zinc-700 font-medium">
              Deliveries activate {LAUNCH_CONFIG.displayShort}. Priority meal drop to your desk.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleReserve} className="max-w-xl mx-auto space-y-4">
              {formError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-rose-900">{formError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-white border border-zinc-300 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-black outline-none font-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Your work email"
                    className="w-full bg-white border border-zinc-300 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-black outline-none font-medium transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Your phone number"
                    className="w-full bg-white border border-zinc-300 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-black outline-none font-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Workplace / Building</label>
                  <input
                    type="text"
                    required
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    placeholder="Your workplace or office"
                    className="w-full bg-white border border-zinc-300 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-black outline-none font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Delivery Address &amp; Floor</label>
                <input
                  type="text"
                  required
                  value={addressFloor}
                  onChange={(e) => setAddressFloor(e.target.value)}
                  placeholder="Your office desk floor"
                  className="w-full bg-white border border-zinc-300 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-black outline-none font-medium transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] disabled:bg-zinc-400 text-white font-bold text-base py-4 rounded-xl shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Locking In Your Reservation...</span>
                    </>
                  ) : (
                    <span>Reserve Spot</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-black">
                  You're on the Waitlist, {fullName}!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-700 mt-1">
                  Deliveries activate {LAUNCH_CONFIG.displayShort} at {workplace || 'your office'}.
                </p>
              </div>

              {/* Unique Member Code Card (Light Orange) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFF4ED] to-[#FFE7D6] border border-orange-200 shadow-sm text-left space-y-3 max-w-full overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Ticket className="w-4 h-4 text-[#FF4C00] shrink-0" />
                    <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Your Unique Member Code
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    Active &amp; Dispatched
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-orange-200">
                  <span className="font-mono text-xl sm:text-2xl font-black text-[#FF4C00] tracking-wider break-all">
                    {generatedMemberCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-1.5 rounded-lg bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ml-auto sm:ml-0"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-zinc-700 leading-relaxed break-words">
                  <strong className="text-black">Skip re-filling contact forms:</strong> When you pick your meals calendar and proceed to payment, insert this unique code to instantly auto-fill your contact details and desk drop location. A copy has also been sent to <strong className="text-black break-all">{email}</strong>.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={scrollToPlanBuilder}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white px-7 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Pick Your Meals Calendar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={scrollToMenu}
                  className="w-full sm:w-auto bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 px-6 py-3.5 rounded-full font-semibold text-xs transition cursor-pointer"
                >
                  View Menu
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
