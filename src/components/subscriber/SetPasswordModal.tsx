import React, { useState } from 'react';
import { CustomerRecord } from '../../types';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight, Building, MapPin, Calendar } from 'lucide-react';

interface SetPasswordModalProps {
  isOpen: boolean;
  customer: CustomerRecord | null;
  onClose: () => void;
  onPasswordSet: (customer: CustomerRecord, newPass: string) => void;
}

export const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
  isOpen,
  customer,
  onClose,
  onPasswordSet,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !customer) return null;

  const isMinLength = password.length >= 6;
  const isMatching = password.length > 0 && password === confirmPassword;
  const isValid = isMinLength && isMatching;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      if (!isMinLength) {
        setError('Password must be at least 6 characters long.');
      } else if (!isMatching) {
        setError('Passwords do not match.');
      }
      return;
    }

    setError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onPasswordSet(customer, password);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto font-['Poppins']">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Brand Header */}
        <div className="bg-[#1A1A1A] text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF4C00]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4C00] bg-[#FF4C00]/20 border border-[#FF4C00]/30 px-3 py-1 rounded-full">
              ★ Account Activation Link
            </span>
            <span className="text-xs text-zinc-400 font-medium">11 to 12 Lunch OS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome, {customer.fullName}!
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Your corporate lunch plan is set up. Set your password to activate your subscriber dashboard.
          </p>

          {/* Plan & Office Summary Badge */}
          <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 font-semibold block text-[11px]">Subscribed Plan:</span>
              <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF4C00]" />
                {customer.totalDays} Workday Lunches
              </span>
            </div>
            <div>
              <span className="text-zinc-500 font-semibold block text-[11px]">Desk Drop Desk:</span>
              <span className="font-bold text-white flex items-center gap-1 mt-0.5 truncate" title={customer.company}>
                <Building className="w-3.5 h-3.5 text-[#FF4C00]" />
                {customer.company}
              </span>
            </div>
          </div>
        </div>

        {/* Set Password Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 bg-white">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Email (Readonly) */}
          <div>
            <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider block mb-1.5">
              Work Email Address (Verified)
            </label>
            <input
              type="email"
              value={customer.email}
              readOnly
              className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 text-sm font-medium cursor-not-allowed"
            />
          </div>

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Create New Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer font-medium"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                required
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-zinc-200 rounded-xl text-zinc-900 text-sm font-semibold focus:outline-hidden focus:border-[#FF4C00] focus:ring-1 focus:ring-[#FF4C00] transition"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider block mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              className="w-full px-4 py-3 bg-[#FAF7F2] border border-zinc-200 rounded-xl text-zinc-900 text-sm font-semibold focus:outline-hidden focus:border-[#FF4C00] focus:ring-1 focus:ring-[#FF4C00] transition"
            />
          </div>

          {/* Password Validation Checklist */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isMinLength ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-400'}`}>
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span className={isMinLength ? 'text-zinc-800 font-semibold' : 'text-zinc-500'}>
                Minimum 6 characters
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isMatching ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-400'}`}>
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span className={isMatching ? 'text-zinc-800 font-semibold' : 'text-zinc-500'}>
                Passwords match
              </span>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full py-4 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Activating Dashboard...
              </span>
            ) : (
              <>
                <span>Activate Account & Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
