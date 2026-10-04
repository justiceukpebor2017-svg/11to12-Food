import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  X,
  User as UserIcon,
  Phone,
  Building,
  Loader2,
} from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc?: string;
  name: string;
  handle: string;
  text: string;
}

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  error?: string | null;
  successMessage?: string | null;
  isLoading?: boolean;
  initialTab?: 'signin' | 'register';
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onRegister?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  onClose?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm transition-colors focus-within:border-[#FF4C00] focus-within:ring-2 focus-within:ring-[#FF4C00]/20 shadow-xs">
    {children}
  </div>
);

// TestimonialCard without ANY images (User rule: always remove testimonial images)
const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => {
  const initials = testimonial.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 p-4 text-white w-64 shadow-xl text-left`}>
      <div className="h-9 w-9 rounded-xl bg-[#FF4C00] text-white font-bold text-xs flex items-center justify-center shrink-0">
        {initials || '11'}
      </div>
      <div className="text-xs leading-snug">
        <p className="font-bold text-white">{testimonial.name}</p>
        <p className="text-zinc-400 text-[10px]">{testimonial.handle}</p>
        <p className="mt-1 text-zinc-200 line-clamp-2">{testimonial.text}</p>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-black text-zinc-900 tracking-tight">Subscriber Portal</span>,
  description = "Access your lunch control center, calendar days, and desk drop tracking.",
  heroImageSrc = "https://i.ibb.co/rG6JFnyY/0904-ezgif-com-resize.gif",
  testimonials = [
    {
      name: "Tolu Adebayo",
      handle: "Paystack, Victoria Island",
      text: "The 11:30 AM desk drop saved our product team. Piping hot Jollof without ever interrupting deep work.",
    },
    {
      name: "Chuka Nwosu",
      handle: "KPMG, Ikoyi",
      text: "Flawless Nigerian meals right at my workstation. Skipping and swallow choices make it super flexible.",
    },
  ],
  error,
  successMessage,
  isLoading = false,
  initialTab = 'signin',
  onSignIn,
  onRegister,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  onClose,
}) => {
  const [authTab, setAuthTab] = useState<'signin' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-['Poppins'] w-full bg-[#FAF7F2] text-zinc-900 relative overflow-x-hidden">
      {/* Optional Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/80 hover:bg-white text-zinc-600 hover:text-black shadow-md border border-zinc-200 cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Left column: sign-in / registration form */}
      <section className="flex-1 flex items-center justify-center p-4 sm:p-10 lg:p-12 max-w-full">
        <div className="w-full max-w-md text-left">
          
          {/* Brand Logo Header */}
          <div className="mb-6 flex items-center space-x-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer hover:opacity-85 transition flex items-center space-x-2"
              title="Click to reload site"
            >
              <img
                src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                alt="11 to 12"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://i.ibb.co/mV0z77Mb/11to12logg.png';
                }}
              />
            </button>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-black leading-tight tracking-tight break-words">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1 break-words">
                {description}
              </p>
            </div>

            {/* Auth Tab Switcher: Sign In vs Create Account */}
            <div className="flex rounded-2xl bg-zinc-200/70 p-1 border border-zinc-300/60">
              <button
                type="button"
                onClick={() => setAuthTab('signin')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  authTab === 'signin'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  authTab === 'register'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* MODE A: SIGN IN */}
            {authTab === 'signin' ? (
              <form className="space-y-4" onSubmit={onSignIn}>
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Work Email Address</label>
                  <GlassInputWrapper>
                    <div className="flex items-center px-4">
                      <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="subscriber@company.com"
                        className="w-full bg-transparent text-sm p-3.5 pl-2.5 rounded-2xl focus:outline-none font-medium text-zinc-900"
                      />
                    </div>
                  </GlassInputWrapper>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-700 block">Password</label>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onResetPassword?.();
                      }}
                      className="text-xs font-bold text-[#FF4C00] hover:underline"
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <GlassInputWrapper>
                    <div className="relative flex items-center px-4">
                      <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your password"
                        className="w-full bg-transparent text-sm p-3.5 pl-2.5 pr-10 rounded-2xl focus:outline-none font-medium text-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </GlassInputWrapper>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-600 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      defaultChecked
                      className="rounded text-[#FF4C00] focus:ring-[#FF4C00] accent-[#FF4C00]"
                    />
                    <span>Keep me signed in</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] disabled:opacity-60 py-3.5 font-bold text-xs uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Lunch Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* MODE B: CREATE ACCOUNT / REGISTER */
              <form className="space-y-3.5" onSubmit={onRegister}>
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Full Name</label>
                  <GlassInputWrapper>
                    <div className="flex items-center px-4">
                      <UserIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                      <input
                        name="fullName"
                        type="text"
                        required
                        placeholder="e.g. Adebayo Ogunlesi"
                        className="w-full bg-transparent text-sm p-3 pl-2.5 rounded-2xl focus:outline-none font-medium text-zinc-900"
                      />
                    </div>
                  </GlassInputWrapper>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Work Email Address</label>
                  <GlassInputWrapper>
                    <div className="flex items-center px-4">
                      <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="yourname@company.com"
                        className="w-full bg-transparent text-sm p-3 pl-2.5 rounded-2xl focus:outline-none font-medium text-zinc-900"
                      />
                    </div>
                  </GlassInputWrapper>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Phone Number</label>
                    <GlassInputWrapper>
                      <div className="flex items-center px-3.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <input
                          name="phone"
                          type="tel"
                          required
                          placeholder="0802 618 0680"
                          className="w-full bg-transparent text-xs p-3 pl-2 rounded-2xl focus:outline-none font-medium text-zinc-900"
                        />
                      </div>
                    </GlassInputWrapper>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Office / Building</label>
                    <GlassInputWrapper>
                      <div className="flex items-center px-3.5">
                        <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <input
                          name="officeAddress"
                          type="text"
                          required
                          placeholder="e.g. Marina / VI"
                          className="w-full bg-transparent text-xs p-3 pl-2 rounded-2xl focus:outline-none font-medium text-zinc-900"
                        />
                      </div>
                    </GlassInputWrapper>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Password</label>
                    <GlassInputWrapper>
                      <div className="relative flex items-center px-3.5">
                        <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="6+ chars"
                          className="w-full bg-transparent text-xs p-3 pl-2 pr-7 rounded-2xl focus:outline-none font-medium text-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </GlassInputWrapper>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Confirm Password</label>
                    <GlassInputWrapper>
                      <div className="relative flex items-center px-3.5">
                        <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <input
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Re-enter password"
                          className="w-full bg-transparent text-xs p-3 pl-2 pr-7 rounded-2xl focus:outline-none font-medium text-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </GlassInputWrapper>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] disabled:opacity-60 py-3.5 font-bold text-xs uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account in Firebase...</span>
                    </>
                  ) : (
                    <>
                      <span>Register & Access Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Google Authentication Option */}
            {onGoogleSignIn && (
              <div className="pt-1">
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#FAF7F2] px-3 text-zinc-400 font-medium">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-white hover:bg-zinc-50 disabled:opacity-60 border border-zinc-200 py-3 font-semibold text-xs text-zinc-800 transition-all shadow-xs active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-2.5"
                >
                  <GoogleIcon />
                  <span>Continue with Google Workspace</span>
                </button>
              </div>
            )}

            <p className="text-center text-xs text-zinc-500 pt-2">
              Need to customize lunch dates first?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onCreateAccount?.();
                }}
                className="text-[#FF4C00] font-bold hover:underline"
              >
                Build Plan on Homepage →
              </a>
            </p>

          </div>
        </div>
      </section>

      {/* Right column: hero visual + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:flex flex-1 relative p-6 items-center justify-center bg-zinc-900 overflow-hidden">
          {/* Animated Hero Background using the homepage GIF */}
          <div
            className="absolute inset-4 rounded-3xl bg-cover bg-center shadow-2xl opacity-90 transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: `url(${heroImageSrc})`,
            }}
          />
          
          {/* Dark gradient overlay for contrast */}
          <div className="absolute inset-4 rounded-3xl bg-gradient-to-t from-black/85 via-black/35 to-black/25 pointer-events-none" />

          {/* Testimonial Cards Overlay (No images) */}
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col xl:flex-row gap-3 px-6 w-full justify-center z-10">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-100" />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-200" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default SignInPage;
