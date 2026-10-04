import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, ArrowDown, Utensils, Users, Sparkles, CheckCircle, Copy, Check, Ticket, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { WaitlistLead, CustomerRecord } from '../../types';
import { LAUNCH_CONFIG, getTimeUntilLaunch } from '../../config/launchConfig';
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
  const [isPlaying, setIsPlaying] = useState(false);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilLaunch());
    }, 1000);
    return () => clearInterval(timer);
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

    // 1. Client-Side instant duplicate validation across both waitlist and customers
    const emailInWaitlist = existingWaitlist.find((l) => normalizeEmail(l.email) === cleanEmail);
    const emailInCustomers = existingCustomers.find((c) => normalizeEmail(c.email) === cleanEmail);
    const phoneInWaitlist = existingWaitlist.find((l) => getStandardPhoneKey(l.phone) === phoneKey);
    const phoneInCustomers = existingCustomers.find((c) => getStandardPhoneKey(c.phone) === phoneKey);

    const isDupEmail = Boolean(emailInWaitlist || emailInCustomers);
    const isDupPhone = Boolean(phoneInWaitlist || phoneInCustomers);

    if (isDupEmail && isDupPhone) {
      setDuplicateFieldError('both');
      setFormError('Both this email address and phone number are already registered on our list.');
      setExistingLeadMatch(emailInWaitlist || phoneInWaitlist || null);
      return;
    }

    if (isDupEmail) {
      setDuplicateFieldError('email');
      setFormError(`The email address "${cleanEmail}" is already registered. You're already locked in for launch!`);
      setExistingLeadMatch(emailInWaitlist || null);
      return;
    }

    if (isDupPhone) {
      setDuplicateFieldError('phone');
      setFormError(`The phone number "${cleanPhone}" is already registered on our list. Each member can register once.`);
      setExistingLeadMatch(phoneInWaitlist || null);
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
          if (result.error === 'DUPLICATE_EMAIL') {
            setDuplicateFieldError('email');
          } else if (result.error === 'DUPLICATE_PHONE') {
            setDuplicateFieldError('phone');
          }
          setFormError(result.message || 'This contact is already registered.');
          if (result.existingLead) {
            setExistingLeadMatch(result.existingLead);
          }
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

  const scrollToReserve = () => {
    const el = document.getElementById('reserve-form');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="watch-and-reserve" className="py-16 sm:py-24 bg-[#141414] text-white font-['Poppins']">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Launch Countdown Banner: Clean & Minimal */}
        <div className="text-center space-y-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Deliveries Begin {LAUNCH_CONFIG.displayDate}
          </h3>
          <div className="flex justify-center items-center gap-2 sm:gap-6 text-center pt-2 max-w-full">
            <div>
              <div className="text-xl sm:text-4xl font-bold text-[#FF4C00]">{String(countdown.days).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs text-zinc-400 font-medium">Days</div>
            </div>
            <span className="text-lg sm:text-xl text-zinc-600 font-light">:</span>
            <div>
              <div className="text-xl sm:text-4xl font-bold text-white">{String(countdown.hours).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs text-zinc-400 font-medium">Hours</div>
            </div>
            <span className="text-lg sm:text-xl text-zinc-600 font-light">:</span>
            <div>
              <div className="text-xl sm:text-4xl font-bold text-white">{String(countdown.minutes).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs text-zinc-400 font-medium">Mins</div>
            </div>
            <span className="text-lg sm:text-xl text-zinc-600 font-light">:</span>
            <div>
              <div className="text-xl sm:text-4xl font-bold text-white">{String(countdown.seconds).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs text-zinc-400 font-medium">Secs</div>
            </div>
          </div>
        </div>

        {/* Video Teaser: Watch Before You Reserve */}
        <div className="bg-[#1F1F1F] rounded-3xl p-5 sm:p-10 border border-zinc-800 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-4xl font-bold text-white break-words">
              Watch Before You Reserve
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 font-normal break-words">
              See how 11 to 12 Desk Drop works in 60 seconds.
            </p>
          </div>

          {/* Video Preview Box */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black group shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200"
              alt="11 to 12 Desk Drop Preview"
              className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF4C00] hover:bg-white text-white hover:text-[#FF4C00] flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl cursor-pointer"
                aria-label="Play Video"
              >
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
              </button>
              <span className="text-xs text-white/90 font-medium tracking-wide">
                60-Second Overview
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-zinc-300 pt-2">
            <button
              onClick={scrollToReserve}
              className="text-[#FF4C00] hover:underline cursor-pointer flex items-center space-x-1"
            >
              <span>Skip to Waitlist</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={scrollToMenu}
              className="text-white hover:text-[#FF4C00] transition cursor-pointer flex items-center space-x-1"
            >
              <Utensils className="w-3.5 h-3.5 text-[#FF4C00]" />
              <span>Already joined? See this week's kitchen menu</span>
            </button>
          </div>
        </div>

        {/* LIVE COHORT COUNTER BANNER: EXACTLY ABOVE RESERVE YOUR DESK DROP */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-black rounded-3xl p-4 sm:p-7 border border-zinc-800 shadow-xl max-w-full overflow-hidden">
          <div className="text-center mb-4 flex flex-wrap items-center justify-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] bg-[#FF4C00]/10 border border-[#FF4C00]/30 px-2.5 py-1 rounded-full text-center leading-normal break-words max-w-full">
              Live Real-Time Reservation Pulse • Synced Across Devices
            </span>
          </div>

          <div className="max-w-md mx-auto">
            {/* Live Waitlist Counter */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-zinc-800 flex items-center justify-center space-x-4 transition-all duration-300 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-[#FF4C00]/15 text-[#FF4C00] border border-[#FF4C00]/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Waitlist Joined
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-[#FF4C00] border border-[#FF4C00]/30">
                    Live
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {waitlistCount}{' '}
                  <span className="text-xs font-medium text-zinc-400">
                    professionals
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 block">
                  Awaiting route launch
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reserve Your Desk Drop Form */}
        <div id="reserve-form" className="bg-[#1F1F1F] rounded-3xl p-6 sm:p-10 border border-zinc-800 shadow-xl">
          <div className="text-center space-y-1 mb-8">
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              Reserve Your Desk Drop
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 font-normal">
              Deliveries activate {LAUNCH_CONFIG.displayShort}. One registration per email and phone.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleReserve} className="max-w-xl mx-auto space-y-4">
              {/* Form Duplicate / Validation Alert */}
              {formError && (
                <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs sm:text-sm space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{formError}</p>
                      {existingLeadMatch && (
                        <div className="mt-2 p-2.5 rounded-xl bg-black/60 border border-red-900/60 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-[11px] text-zinc-400 block">Your Existing Member Code:</span>
                            <span className="font-mono text-base font-bold text-[#FF4C00] break-words">{existingLeadMatch.memberCode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(existingLeadMatch.memberCode);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1 shrink-0 self-start sm:self-auto"
                          >
                            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full bg-[#141414] border border-zinc-700 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-white outline-none font-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Email Address <span className="text-zinc-500 font-normal">(Unique per user)</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="name@company.com"
                    className={`w-full bg-[#141414] rounded-xl px-4 py-3 text-sm text-white outline-none font-medium transition ${
                      duplicateFieldError === 'email' || duplicateFieldError === 'both'
                        ? 'border-2 border-red-500 focus:border-red-500'
                        : 'border border-zinc-700 focus:border-[#FF4C00]'
                    }`}
                  />
                  {(duplicateFieldError === 'email' || duplicateFieldError === 'both') && (
                    <span className="text-[11px] text-red-400 font-medium mt-1 block">
                      ⚠️ Email address already registered
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Phone Number <span className="text-zinc-500 font-normal">(Unique per user)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="0802 618 0680"
                    className={`w-full bg-[#141414] rounded-xl px-4 py-3 text-sm text-white outline-none font-medium transition ${
                      duplicateFieldError === 'phone' || duplicateFieldError === 'both'
                        ? 'border-2 border-red-500 focus:border-red-500'
                        : 'border border-zinc-700 focus:border-[#FF4C00]'
                    }`}
                  />
                  {(duplicateFieldError === 'phone' || duplicateFieldError === 'both') && (
                    <span className="text-[11px] text-red-400 font-medium mt-1 block">
                      ⚠️ Phone number already registered
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Workplace / Building</label>
                  <input
                    type="text"
                    required
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    placeholder="Landmark Towers, VI"
                    className="w-full bg-[#141414] border border-zinc-700 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-white outline-none font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Delivery Address & Floor</label>
                <input
                  type="text"
                  required
                  value={addressFloor}
                  onChange={(e) => setAddressFloor(e.target.value)}
                  placeholder="Floor 4, Suite 402"
                  className="w-full bg-[#141414] border border-zinc-700 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-white outline-none font-medium transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FF4C00] hover:bg-[#E04300] disabled:bg-zinc-700 text-white font-bold text-base py-4 rounded-xl shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
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
              <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  You're on the Waitlist, {fullName}!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 mt-1">
                  Deliveries activate {LAUNCH_CONFIG.displayShort} at {workplace || 'your office'}.
                </p>
              </div>

              {/* Unique Member Code Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-xl text-left space-y-3 max-w-full overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Ticket className="w-4 h-4 text-[#FF4C00] shrink-0" />
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Your Unique Member Code
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                    Active & Dispatched
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-black/60 rounded-xl border border-zinc-800">
                  <span className="font-mono text-xl sm:text-2xl font-black text-[#FF4C00] tracking-wider break-all">
                    {generatedMemberCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-[#FF4C00] text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ml-auto sm:ml-0"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed break-words">
                  💡 <strong className="text-zinc-200">Skip re-filling contact forms:</strong> When you pick your meals calendar and proceed to payment, insert this unique code to instantly auto-fill your contact details and desk drop location. A copy has also been sent to <strong className="text-zinc-300 break-all">{email}</strong>.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={scrollToPlanBuilder}
                  className="w-full sm:w-auto bg-[#FF4C00] hover:bg-[#E04300] text-white px-7 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Pick Your Meals Calendar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={scrollToMenu}
                  className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 py-3.5 rounded-full font-semibold text-xs transition cursor-pointer"
                >
                  View 26-Week Menu
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
