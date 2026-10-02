import React, { useState } from 'react';
import { CustomerRecord } from '../types';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Building,
  MapPin,
  Calendar,
  Sparkles,
  Utensils,
  Clock,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { LAUNCH_CONFIG } from '../config/launchConfig';
import { CONTACT_CONFIG } from '../config/contactConfig';

interface ActivateAccountPageProps {
  customer: CustomerRecord;
  token?: string | null;
  onActivateSuccess: (customer: CustomerRecord, password: string) => void;
  onNavigateHome: () => void;
}

export const ActivateAccountPage: React.FC<ActivateAccountPageProps> = ({
  customer,
  token,
  onActivateSuccess,
  onNavigateHome,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMinLength = password.length >= 6;
  const isMatching = password.length > 0 && password === confirmPassword;
  const isValid = isMinLength && isMatching;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMinLength) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!isMatching) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onActivateSuccess(customer, password);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins'] flex flex-col justify-between antialiased selection:bg-[#FF4C00] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="w-full bg-[#1A1A1A] text-white border-b border-zinc-800 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <img
            src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
            alt="11 to 12"
            className="h-8 w-auto object-contain brightness-0 invert"
          />
          <span className="text-xs font-bold text-zinc-400 border-l border-zinc-700 pl-3">
            Account Activation Portal
          </span>
        </div>

        <button
          onClick={onNavigateHome}
          className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center space-x-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#FF4C00]" />
          <span>Return to Storefront</span>
        </button>
      </header>

      {/* Main Activation Experience Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-6">
          
          {/* Hero Welcome Banner */}
          <div className="bg-[#1A1A1A] text-white p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF4C00]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00] bg-[#FF4C00]/15 border border-[#FF4C00]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verified Magic Link</span>
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  Ref: {customer.orderRef || token || 'VERIFIED'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Welcome, {customer.fullName}!
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-lg leading-relaxed">
                Your corporate desk drop subscription is confirmed and linked to <strong className="text-white">{customer.email}</strong>. Set your personal password below to unlock your Lunch Dashboard.
              </p>
            </div>
          </div>

          {/* Subscription Summary Ribbon */}
          <div className="bg-orange-50/70 border-b border-orange-100 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF4C00] flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-orange-950 block uppercase tracking-wide">
                  Lunch Plan
                </span>
                <span className="font-semibold text-zinc-800">
                  {customer.totalDays} Workday Lunches
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF4C00] flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-orange-950 block uppercase tracking-wide">
                  Desk Drop Location
                </span>
                <span className="font-semibold text-zinc-800 block truncate" title={customer.company}>
                  {customer.company || customer.officeAddress}
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  {customer.floorSuite || 'Desk Drop Route'}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF4C00] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-orange-950 block uppercase tracking-wide">
                  Delivery Window
                </span>
                <span className="font-semibold text-zinc-800 block">
                  11:00 AM – 12:00 PM
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  Begins {LAUNCH_CONFIG.displayDate}
                </span>
              </div>
            </div>
          </div>

          {/* Password Setup Section */}
          <div className="p-6 sm:p-10 space-y-6">
            
            {customer.isPasswordSet ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-950">Password Already Activated!</h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Your account password is established. You can launch your Subscriber Dashboard right away.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onActivateSuccess(customer, customer.password || '')}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm inline-flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Launch My Lunch Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-lg font-black text-black">
                    Choose Your Account Password
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    This password will be used for your ongoing subscriber logins to view menus, swap swallows, and manage your lunch skips.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Address (Pre-verified) */}
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={customer.email}
                    className="w-full bg-[#FAF7F2] border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-700 cursor-not-allowed select-all"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    ✓ Authenticated via your unique magic link token.
                  </span>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                    Create Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#FAF7F2] border border-zinc-300 focus:border-[#FF4C00] rounded-xl px-4 py-3 pr-10 text-xs font-semibold text-black focus:outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Re-enter password to confirm"
                    className="w-full bg-[#FAF7F2] border border-zinc-300 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-xs font-semibold text-black focus:outline-hidden transition"
                  />
                </div>

                {/* Validation Checklist */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isMinLength ? 'bg-emerald-500 text-white' : 'bg-zinc-300 text-transparent'}`}>
                      ✓
                    </div>
                    <span className={isMinLength ? 'text-emerald-700 font-medium' : 'text-zinc-500'}>
                      At least 6 characters long
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isMatching ? 'bg-emerald-500 text-white' : 'bg-zinc-300 text-transparent'}`}>
                      ✓
                    </div>
                    <span className={isMatching ? 'text-emerald-700 font-medium' : 'text-zinc-500'}>
                      Passwords match exactly
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className={`w-full py-4 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg ${
                      isValid && !isSubmitting
                        ? 'bg-[#FF4C00] hover:bg-[#E04300] text-white cursor-pointer active:scale-98'
                        : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>Activating Your Dashboard...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Activate Account & Open Dashboard</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-zinc-400 text-center mt-2.5">
                    🔒 SSL Encrypted • Your password is encrypted and only you have access to your account.
                  </p>
                </div>
              </form>
            )}

            {/* Assistance Banner */}
            <div className="pt-4 border-t border-zinc-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Need assistance activating? Contact Chef Justice Care.</span>
              </div>
              <a
                href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
                  `Hello 11to12 Care! I am activating my account for ${customer.email} and need quick assistance.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#FF4C00] hover:underline"
              >
                WhatsApp Concierge ({CONTACT_CONFIG.whatsappDisplay})
              </a>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-zinc-400 border-t border-zinc-200 bg-white">
        © {new Date().getFullYear()} 11 to 12 Foods Ltd. Victoria Island & Ikoyi Corporate Desk Drop.
      </footer>
    </div>
  );
};
