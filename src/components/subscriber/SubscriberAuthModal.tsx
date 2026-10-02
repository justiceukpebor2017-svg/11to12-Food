import React, { useState } from 'react';
import { CustomerRecord } from '../../types';
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  Send,
  Ticket,
} from 'lucide-react';

interface SubscriberAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerRecord[];
  onLoginSuccess: (customer: CustomerRecord) => void;
  onUpdateCustomerPassword: (customerId: string, newPass: string) => void;
}

type AuthMode = 'login' | 'forgot_email' | 'enter_code' | 'reset_password' | 'magic_token';

export const SubscriberAuthModal: React.FC<SubscriberAuthModalProps> = ({
  isOpen,
  onClose,
  customers,
  onLoginSuccess,
  onUpdateCustomerPassword,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password / OTP Verification States
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [realtimeEmailToast, setRealtimeEmailToast] = useState<{
    to: string;
    code: string;
    sentAt: string;
  } | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<CustomerRecord | null>(null);

  // New Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Magic Link Token State
  const [magicTokenInput, setMagicTokenInput] = useState('');

  if (!isOpen) return null;

  // 1. Regular Login with password
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const customer = customers.find((c) => c.email.toLowerCase() === cleanEmail);

    if (!customer) {
      setError('No subscriber account found with this email address. Please check your spelling or contact support.');
      return;
    }

    if (!customer.isPasswordSet || !customer.password) {
      setError(
        'You have not set your password yet! Please use the magic link sent to your email by the kitchen, or request a password reset below.'
      );
      return;
    }

    if (customer.password !== password) {
      setError('Incorrect password. Please try again or click "Forgot Password" to receive a verification code.');
      return;
    }

    // Success
    onLoginSuccess(customer);
    onClose();
  };

  // 2. Request Password Reset Verification Code
  const handleRequestVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const customer = customers.find((c) => c.email.toLowerCase() === cleanEmail);

    if (!customer) {
      setError('No subscriber found with this email address. Please make sure you enter your registered work email.');
      return;
    }

    // Generate real-time 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setMatchedCustomer(customer);

    // Simulate real-time dispatch with live notification toast
    setRealtimeEmailToast({
      to: customer.email,
      code,
      sentAt: new Date().toLocaleTimeString(),
    });

    setMode('enter_code');
  };

  // 3. Verify Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (verificationCodeInput.trim() !== generatedCode) {
      setError('Invalid verification code. Please check your email or enter the 6-digit code shown in the dispatch notice.');
      return;
    }

    // Verification code matches! Advance to password reset
    setMode('reset_password');
  };

  // 4. Save New Password & Log In (Old password completely deleted)
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please re-type your password.');
      return;
    }

    if (!matchedCustomer) {
      setError('Session expired. Please try again.');
      setMode('login');
      return;
    }

    // Delete old password and save new password
    onUpdateCustomerPassword(matchedCustomer.id, newPassword);

    const updatedCustomer: CustomerRecord = {
      ...matchedCustomer,
      password: newPassword,
      isPasswordSet: true,
      status: 'Active',
    };

    onLoginSuccess(updatedCustomer);
    onClose();
  };

  // 5. Use Magic Link Token directly
  const handleUseMagicToken = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanToken = magicTokenInput.trim();
    const customer = customers.find(
      (c) =>
        (c.magicLinkToken && c.magicLinkToken === cleanToken) ||
        (c.magicLinkUrl && c.magicLinkUrl.includes(cleanToken))
    );

    if (!customer) {
      setError('Invalid magic link token. Please check the link from your email.');
      return;
    }

    setMatchedCustomer(customer);
    setMode('reset_password');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-['Poppins']">
      <div className="relative w-full max-w-md bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-6">
        
        {/* Real-time Email Toast Banner (Live Dispatch Proof) */}
        {realtimeEmailToast && (
          <div className="bg-[#141414] text-white p-3.5 border-b border-zinc-800 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                ✉️ Code sent to <strong>{realtimeEmailToast.to}</strong>: <span className="font-mono font-bold text-[#FF4C00] text-sm">{realtimeEmailToast.code}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRealtimeEmailToast(null)}
              className="text-zinc-400 hover:text-white text-[10px] ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-[#FAF7F2]">
          <div className="flex items-center space-x-3">
            <img
              src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
              alt="11 to 12"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h3 className="text-base font-bold text-black">Subscriber Portal</h3>
              <p className="text-xs text-zinc-500">
                {mode === 'login' && 'Sign in to access your lunch dashboard'}
                {mode === 'forgot_email' && 'Reset your dashboard password'}
                {mode === 'enter_code' && 'Enter 6-digit verification code'}
                {mode === 'reset_password' && 'Create your new password'}
                {mode === 'magic_token' && 'Redeem your onboarding magic link'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200 transition text-zinc-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE 1: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="p-6 sm:p-7 space-y-4 text-left">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Work Email Address</label>
              <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="subscriber@company.com"
                  className="bg-transparent w-full text-zinc-900 text-sm font-medium focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700 block">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('forgot_email');
                  }}
                  className="text-xs font-bold text-[#FF4C00] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your subscriber password"
                  className="bg-transparent w-full text-zinc-900 text-sm font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Sign In to Lunch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('magic_token');
                }}
                className="text-xs text-zinc-500 hover:text-black font-semibold cursor-pointer"
              >
                Have an activation magic token? Click here
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: FORGOT PASSWORD - CONFIRM EMAIL */}
        {mode === 'forgot_email' && (
          <form onSubmit={handleRequestVerificationCode} className="p-6 sm:p-7 space-y-4 text-left">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
              Enter your registered work email. We will send a secure 6-digit verification code to your mail in real time to generate your reset magic link.
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Your Registered Work Email</label>
              <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="subscriber@company.com"
                  className="bg-transparent w-full text-zinc-900 text-sm font-medium focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Verification Code</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('login');
              }}
              className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-black transition cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* MODE 3: ENTER REAL-TIME VERIFICATION CODE */}
        {mode === 'enter_code' && (
          <form onSubmit={handleVerifyCode} className="p-6 sm:p-7 space-y-4 text-left">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
              ✓ Verification code sent to <strong>{email}</strong> in real time. Please enter the 6-digit code below:
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCodeInput}
                onChange={(e) => {
                  setVerificationCodeInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. 592814"
                className="w-full bg-zinc-50 border border-zinc-300 focus:border-[#FF4C00] rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-black outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Code & Open Reset Magic Link</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('forgot_email');
              }}
              className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-black transition cursor-pointer"
            >
              Didn't receive it? Re-enter email
            </button>
          </form>
        )}

        {/* MODE 4: RESET PASSWORD (Old password completely deleted) */}
        {mode === 'reset_password' && (
          <form onSubmit={handleSaveNewPassword} className="p-6 sm:p-7 space-y-4 text-left">
            <div className="p-3 rounded-2xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 leading-relaxed">
              Verification confirmed! Setting a new password will completely delete your previous password.
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">New Password</label>
              <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                <KeyRound className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="At least 6 characters"
                  className="bg-transparent w-full text-zinc-900 text-sm font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Confirm New Password</label>
              <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                <KeyRound className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Re-type your new password"
                  className="bg-transparent w-full text-zinc-900 text-sm font-medium focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Save Password & Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* MODE 5: REDEEM MAGIC TOKEN */}
        {mode === 'magic_token' && (
          <form onSubmit={handleUseMagicToken} className="p-6 sm:p-7 space-y-4 text-left">
            <div className="p-3 rounded-2xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 leading-relaxed">
              Paste the activation token or magic link URL provided to you to set up your password:
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Magic Token or URL</label>
              <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                <Ticket className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  required
                  value={magicTokenInput}
                  onChange={(e) => {
                    setMagicTokenInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Paste magic link or token"
                  className="bg-transparent w-full text-zinc-900 text-sm font-medium focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Activate with Magic Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('login');
              }}
              className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-black transition cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
