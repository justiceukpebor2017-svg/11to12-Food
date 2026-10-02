import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, ArrowDown, Utensils, Users, Sparkles, CheckCircle, Copy, Check, Ticket, ArrowRight } from 'lucide-react';
import { WaitlistLead } from '../../types';

interface DeskDropWaitlistAndTeaserProps {
  waitlistCount?: number;
  confirmedSubscribersCount?: number;
  onJoinWaitlist?: (lead: WaitlistLead) => void;
}

export const DeskDropWaitlistAndTeaser: React.FC<DeskDropWaitlistAndTeaserProps> = ({
  waitlistCount = 0,
  confirmedSubscribersCount = 0,
  onJoinWaitlist,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [addressFloor, setAddressFloor] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedMemberCode, setGeneratedMemberCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Simple countdown to launch
  const [countdown, setCountdown] = useState({
    days: 41,
    hours: 0,
    minutes: 36,
    seconds: 25,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 41, hours: 0, minutes: 36, seconds: 25 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    // Generate unique readable member code (e.g. DD-84920)
    const code = `DD-${Math.floor(10000 + Math.random() * 90000)}`;

    const newLead: WaitlistLead = {
      id: `wl-${Date.now()}`,
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || '+234 800 000 0000',
      workplace: workplace.trim() || 'Victoria Island Office',
      addressFloor: addressFloor.trim() || 'Desk Drop Location',
      createdAt: new Date().toISOString(),
      status: 'Waitlisted',
      memberCode: code,
    };

    // Store in localStorage for quick auto-fill in checkout
    try {
      localStorage.setItem('11to12_waitlist_code', code);
      localStorage.setItem('11to12_waitlist_lead', JSON.stringify(newLead));
    } catch {
      // ignore storage errors
    }

    setGeneratedMemberCode(code);
    if (onJoinWaitlist) {
      onJoinWaitlist(newLead);
    }
    setIsSubmitted(true);
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
            Deliveries Begin Monday, November 2, 2026
          </h3>
          <div className="flex justify-center items-center space-x-3 sm:space-x-6 text-center pt-2">
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-[#FF4C00]">{String(countdown.days).padStart(2, '0')}</div>
              <div className="text-xs text-zinc-400 font-medium">Days</div>
            </div>
            <span className="text-xl text-zinc-600 font-light">:</span>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-white">{String(countdown.hours).padStart(2, '0')}</div>
              <div className="text-xs text-zinc-400 font-medium">Hours</div>
            </div>
            <span className="text-xl text-zinc-600 font-light">:</span>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-white">{String(countdown.minutes).padStart(2, '0')}</div>
              <div className="text-xs text-zinc-400 font-medium">Mins</div>
            </div>
            <span className="text-xl text-zinc-600 font-light">:</span>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-white">{String(countdown.seconds).padStart(2, '0')}</div>
              <div className="text-xs text-zinc-400 font-medium">Secs</div>
            </div>
          </div>
        </div>

        {/* Video Teaser: Watch Before You Reserve */}
        <div className="bg-[#1F1F1F] rounded-3xl p-6 sm:p-10 border border-zinc-800 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              Watch Before You Reserve
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 font-normal">
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
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-black rounded-3xl p-5 sm:p-7 border border-zinc-800 shadow-xl">
          <div className="text-center mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4C00] bg-[#FF4C00]/10 border border-[#FF4C00]/30 px-3 py-1 rounded-full">
              Live Reservation Pulse
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            
            {/* Live Waitlist Counter */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-zinc-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FF4C00]/15 text-[#FF4C00] border border-[#FF4C00]/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Waitlist Joined
                </span>
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

            {/* Live Confirmed Subscribers Counter (from Admin Confirmed Customers) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-emerald-950/70 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400/90 uppercase tracking-wider block">
                  Confirmed Subscribers
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {confirmedSubscribersCount}{' '}
                  <span className="text-xs font-medium text-emerald-500/70">
                    active desks
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 block">
                  Dates selected & verified
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
              Deliveries activate Monday, November 2nd.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleReserve} className="max-w-xl mx-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nonso Babatunde"
                    className="w-full bg-[#141414] border border-zinc-700 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-white outline-none font-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nonso@company.com"
                    className="w-full bg-[#141414] border border-zinc-700 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-white outline-none font-medium transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0803 123 4567"
                    className="w-full bg-[#141414] border border-zinc-700 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-sm text-white outline-none font-medium transition"
                  />
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
                  className="w-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-base py-4 rounded-xl shadow-lg transition active:scale-98 cursor-pointer"
                >
                  Reserve Spot
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
                  Deliveries activate Monday, November 2nd at {workplace || 'your office'}.
                </p>
              </div>

              {/* Unique Member Code Card */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-xl text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Ticket className="w-4 h-4 text-[#FF4C00]" />
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Your Unique Member Code
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    Active & Dispatched
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 bg-black/60 rounded-xl border border-zinc-800">
                  <span className="font-mono text-xl sm:text-2xl font-black text-[#FF4C00] tracking-wider">
                    {generatedMemberCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-[#FF4C00] text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0"
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

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  💡 <strong className="text-zinc-200">Skip re-filling contact forms:</strong> When you pick your meals calendar and proceed to payment, insert this unique code to instantly auto-fill your contact details and desk drop location. A copy has also been sent to <strong className="text-zinc-300">{email}</strong>.
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
