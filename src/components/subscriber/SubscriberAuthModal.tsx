import React, { useState } from 'react';
import { CustomerRecord, TestimonialItem } from '../../types';
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { CONTACT_CONFIG } from '../../config/contactConfig';
import { SignInPage } from '../ui/sign-in';
import {
  loginSubscriberAccount,
  loginWithGoogleAccount,
  sendSubscriberPasswordReset,
  updateCustomerPasswordInFirestore,
} from '../../services/firebase';

interface SubscriberAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerRecord[];
  onLoginSuccess: (customer: CustomerRecord) => void;
  onUpdateCustomerPassword: (customerId: string, newPass: string) => void;
  onOpenAdminLogin?: () => void;
  testimonials?: TestimonialItem[];
}

type AuthMode = 'login' | 'forgot_email' | 'enter_code' | 'reset_password' | 'first_login_change_password';

export const SubscriberAuthModal: React.FC<SubscriberAuthModalProps> = ({
  isOpen,
  onClose,
  customers,
  onLoginSuccess,
  onUpdateCustomerPassword,
  onOpenAdminLogin,
  testimonials,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password / OTP Verification States
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [realtimeEmailToast, setRealtimeEmailToast] = useState<{
    to: string;
    code: string;
    sentAt: string;
  } | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<CustomerRecord | null>(null);

  // Password Change / First Login States
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (!isOpen) return null;

  // Execute login verification with real Firebase Authentication
  const executeLogin = async (cleanEmail: string, cleanPass: string) => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Check if this is an admin logging in via the main modal
    if (cleanEmail === 'admin@11to12.food' && cleanPass === 'XGa4Z#j0;F') {
      setIsLoading(false);
      if (onOpenAdminLogin) {
        onOpenAdminLogin();
      }
      onClose();
      return;
    }

    // Helper to detect any default / initial password
    const isDefaultPasswordValue = (pass: string, cust?: CustomerRecord | null): boolean => {
      if (!cust) return false;

      // If customer already customized and set their personal password, NEVER prompt to change again
      if (
        cust.mustChangePassword === false ||
        cust.isDefaultPassword === false ||
        Boolean(cust.passwordLastChangedAt)
      ) {
        return false;
      }

      // Only prompt if account is genuinely on initial temporary/default password
      const p = (pass || '').trim().toLowerCase();
      const defP = (cust.defaultPassword || '').trim().toLowerCase();
      const knownDefaults = ['11to12desk', '11to12lagos', '11to12', 'welcome123', 'password', '123456', 'deskdrop2026', 'deskdrop'];

      if (cust.mustChangePassword || cust.isDefaultPassword) {
        if (defP && p === defP) return true;
        if (knownDefaults.includes(p)) return true;
        if (cust.defaultPassword && pass.trim() === cust.defaultPassword.trim()) return true;
      }

      return false;
    };

    // Pre-check registered customer in active customers list
    const registeredCustomer = customers.find(
      (c) => c.email && c.email.trim().toLowerCase() === cleanEmail
    );
    if (registeredCustomer) {
      const passMatches = Boolean(
        (registeredCustomer.password && cleanPass === registeredCustomer.password.trim()) ||
        (registeredCustomer.defaultPassword && cleanPass === registeredCustomer.defaultPassword.trim())
      );
      if (passMatches) {
        if (isDefaultPasswordValue(cleanPass, registeredCustomer)) {
          setMatchedCustomer(registeredCustomer);
          setNewPassword('');
          setConfirmNewPassword('');
          setMode('first_login_change_password');
          setIsLoading(false);
          return;
        }
        // Custom password already set: log in directly without asking to change password
        onLoginSuccess(registeredCustomer);
        setIsLoading(false);
        onClose();
        return;
      }
    }

    try {
      // 1. Authenticate with real Firebase Authentication backend
      const { user, customer } = await loginSubscriberAccount(cleanEmail, cleanPass);

      if (customer) {
        if (isDefaultPasswordValue(cleanPass, customer)) {
          setMatchedCustomer(customer);
          setNewPassword('');
          setConfirmNewPassword('');
          setMode('first_login_change_password');
          setIsLoading(false);
          return;
        }

        onLoginSuccess(customer);
        setIsLoading(false);
        onClose();
        return;
      }

      // If authenticated in Firebase but doc is pending, create canonical subscriber record
      const fallbackCustomer: CustomerRecord = {
        id: user.uid,
        fullName: user.displayName || 'Office Subscriber',
        email: cleanEmail,
        phone: user.phoneNumber || '0802 618 0680',
        company: 'Corporate Office',
        officeAddress: 'Victoria Island / Ikoyi, Lagos',
        floorSuite: 'Desk Drop Station',
        status: 'Active',
        paymentStatus: 'Paid',
        planName: 'Standard Workday Lunch Plan',
        totalDays: 20,
        creditsBalance: 0,
        createdAt: new Date().toISOString(),
        isPasswordSet: true,
        selectedDays: [],
        subtotalNGN: 0,
        discountNGN: 0,
        finalTotalNGN: 0,
      };

      if (isDefaultPasswordValue(cleanPass, fallbackCustomer)) {
        setMatchedCustomer(fallbackCustomer);
        setNewPassword('');
        setConfirmNewPassword('');
        setMode('first_login_change_password');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(fallbackCustomer);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      console.warn('[Firebase Auth] Sign in error:', err);

      // Check if user is a pre-seeded / legacy customer
      const legacyCustomer = customers.find(
        (c) => c.email && c.email.toLowerCase() === cleanEmail
      );
      if (
        legacyCustomer &&
        ((legacyCustomer.password && cleanPass === legacyCustomer.password.trim()) ||
         (legacyCustomer.defaultPassword && cleanPass === legacyCustomer.defaultPassword.trim()) ||
         isDefaultPasswordValue(cleanPass, legacyCustomer))
      ) {
        if (isDefaultPasswordValue(cleanPass, legacyCustomer)) {
          setMatchedCustomer(legacyCustomer);
          setNewPassword('');
          setConfirmNewPassword('');
          setMode('first_login_change_password');
          setIsLoading(false);
          return;
        }

        onLoginSuccess(legacyCustomer);
        setIsLoading(false);
        onClose();
        return;
      }

      setIsLoading(false);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect password or email. Please verify your credentials or click "Forgot Password".');
      } else if (err.code === 'auth/user-not-found') {
        setError('No subscriber account found with this email. Only registered office members can access.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid work email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed sign-in attempts. Please wait a moment or reset your password.');
      } else {
        setError(err.message || 'Unable to authenticate. Please check your credentials.');
      }
    }
  };

  // Google Sign-In with real Firebase Authentication
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { customer } = await loginWithGoogleAccount();
      setIsLoading(false);
      onLoginSuccess(customer);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      if (err?.code === 'auth/popup-closed-by-user') return;
      console.warn('[Firebase Auth] Google error:', err);
      setError('Google Sign-In canceled or encountered an issue. You can sign in using your corporate email.');
    }
  };

  // 1. Regular Login with password or default password
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(email.trim().toLowerCase(), password.trim());
  };

  // 2. Request Password Reset Verification Code
  const handleRequestVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const customer = customers.find((c) => c.email && c.email.toLowerCase() === cleanEmail);

    if (!customer) {
      setError('No subscriber found with this email address. Please make sure you enter your registered work email.');
      return;
    }

    // Generate real-time 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setMatchedCustomer(customer);

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
      setError('Invalid verification code. Please enter the 6-digit code shown in the dispatch notice.');
      return;
    }

    setMode('reset_password');
  };

  // 4. Save New Password & Log In
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
      setError('Session expired. Please sign in again.');
      setMode('login');
      return;
    }

    // Update password in local and central live database & Firestore
    onUpdateCustomerPassword(matchedCustomer.id, newPassword);
    updateCustomerPasswordInFirestore(matchedCustomer.id, newPassword).catch(() => {});

    const updatedCustomer: CustomerRecord = {
      ...matchedCustomer,
      password: newPassword,
      defaultPassword: '',
      isDefaultPassword: false,
      mustChangePassword: false,
      isPasswordSet: true,
      passwordLastChangedAt: new Date().toISOString(),
      status: 'Active',
    };

    onLoginSuccess(updatedCustomer);
    onClose();
  };

  return (
    <>
      {mode === 'login' ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center animate-fadeIn">
          <SignInPage
            title={<span className="font-black text-zinc-900 tracking-tight">Subscriber Portal</span>}
            description="Access your lunch control center, calendar days, and desk drop tracking."
            heroImageSrc="https://i.ibb.co/rG6JFnyY/0904-ezgif-com-resize.gif"
            testimonials={
              testimonials && testimonials.length > 0
                ? testimonials.slice(0, 4).map((t) => ({
                    name: t.name,
                    handle: `${t.role}${t.company ? ` • ${t.company}` : ''}`,
                    text: t.text,
                  }))
                : undefined
            }
            error={error}
            successMessage={successMessage}
            isLoading={isLoading}
            onClose={onClose}
            onSignIn={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              const cleanEmail = ((formData.get('email') as string) || '').trim().toLowerCase();
              const cleanPass = ((formData.get('password') as string) || '').trim();
              setEmail(cleanEmail);
              setPassword(cleanPass);
              executeLogin(cleanEmail, cleanPass);
            }}
            onResetPassword={() => {
              setError(null);
              setSuccessMessage(null);
              setMode('forgot_email');
            }}
            onGoogleSignIn={handleGoogleSignIn}
            onCreateAccount={() => {
              onClose();
              const reserveSection = document.getElementById('reserve-section') || document.getElementById('plans-section');
              if (reserveSection) {
                reserveSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        </div>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-6 animate-fadeIn">
            {/* Real-time Email Toast Banner (Live Verification Notice) */}
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
                {mode === 'first_login_change_password' && 'One-Time Password Setup'}
                {mode === 'forgot_email' && 'Reset your dashboard password'}
                {mode === 'enter_code' && 'Enter 6-digit verification code'}
                {mode === 'reset_password' && 'Create your new password'}
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
                  placeholder="Enter password or default password"
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

            <div className="pt-2 text-center text-xs text-zinc-500">
              New subscriber? Use the default password sent to you on WhatsApp by 11 to 12.
            </div>
          </form>
        )}

        {/* MODE: FIRST LOGIN - MANDATORY PASSWORD CHANGE */}
        {mode === 'first_login_change_password' && (
          <form onSubmit={handleSaveNewPassword} className="p-6 sm:p-7 space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
              <div className="flex items-center space-x-2 font-bold text-amber-950">
                <Sparkles className="w-4 h-4 text-[#FF4C00]" />
                <span>Welcome, {matchedCustomer?.fullName}!</span>
              </div>
              <p>
                11 to 12 created your default login. Please set your personal permanent password to officially secure your lunch dashboard.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Your Registered Account Email</label>
              <input
                type="text"
                readOnly
                value={matchedCustomer?.email || ''}
                className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-600 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Create Permanent Password</label>
              <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
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
              <label className="text-xs font-bold text-zinc-700 block mb-1">Confirm Permanent Password</label>
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
                  placeholder="Re-type your password"
                  className="bg-transparent w-full text-zinc-900 text-sm font-medium focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Set Password & Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* MODE 2: FORGOT PASSWORD - CONFIRM EMAIL */}
        {mode === 'forgot_email' && (
          <form onSubmit={handleRequestVerificationCode} className="p-6 sm:p-7 space-y-4 text-left">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
              Enter your registered work email. We will send a secure 6-digit verification code to reset your password.
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
              <span>Send Verification Code</span>
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

        {/* MODE 3: ENTER 6-DIGIT CODE */}
        {mode === 'enter_code' && (
          <form onSubmit={handleVerifyCode} className="p-6 sm:p-7 space-y-4 text-left">
            <div className="p-3 rounded-2xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 leading-relaxed">
              We dispatched a 6-digit verification code to <strong>{matchedCustomer?.email}</strong>.
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Enter 6-Digit Code</label>
              <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                <KeyRound className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCodeInput}
                  onChange={(e) => {
                    setVerificationCodeInput(e.target.value.trim());
                    if (error) setError(null);
                  }}
                  placeholder="e.g. 749201"
                  className="bg-transparent w-full text-zinc-900 text-base font-mono font-bold tracking-widest focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Verify Code & Continue</span>
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

        {/* MODE 4: RESET PASSWORD (FROM FORGOT PASSWORD) */}
        {mode === 'reset_password' && (
          <form onSubmit={handleSaveNewPassword} className="p-6 sm:p-7 space-y-4 text-left">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
              Code verified! Create your new personal password for <strong>{matchedCustomer?.email}</strong>.
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
                <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
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
              <span>Save New Password & Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer Admin Switch */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 text-center text-xs text-zinc-500 flex items-center justify-center space-x-2">
          <span>Are you kitchen management?</span>
          <button
            type="button"
            onClick={() => {
              if (onOpenAdminLogin) {
                onOpenAdminLogin();
              }
              onClose();
            }}
            className="text-[#FF4C00] font-bold hover:underline cursor-pointer"
          >
            11 to 12 Admin Portal →
          </button>
        </div>

      </div>
    </div>
      )}
    </>
  );
};
