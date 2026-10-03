import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, ShieldCheck, X } from 'lucide-react';

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
  avatarSrc: string;
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
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
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

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 p-4 text-white w-64 shadow-xl text-left`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-xl shrink-0" alt="avatar" />
    <div className="text-xs leading-snug">
      <p className="flex items-center gap-1 font-bold text-white">{testimonial.name}</p>
      <p className="text-zinc-400 text-[10px]">{testimonial.handle}</p>
      <p className="mt-1 text-zinc-200 line-clamp-2">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-black text-zinc-900 tracking-tight">Subscriber Portal</span>,
  description = "Access your lunch control center, calendar days, and desk drop tracking.",
  heroImageSrc = "https://i.ibb.co/rG6JFnyY/0904-ezgif-com-resize.gif",
  testimonials = [
    {
      avatarSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      name: "Tolu Adebayo",
      handle: "@tolu_lagos • Paystack VI",
      text: "The 11:30 AM desk drop saved our product team. Piping hot Jollof without ever interrupting deep work.",
    },
    {
      avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      name: "Chuka Nwosu",
      handle: "@chuka_finance • KPMG Ikoyi",
      text: "Flawless Nigerian meals right at my workstation. Skipping and swallow choices make it super flexible.",
    },
  ],
  error,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  onClose,
}) => {
  const [showPassword, setShowPassword] = useState(false);

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

      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md text-left">
          
          {/* Brand Logo Header */}
          <div className="mb-6 flex items-center space-x-3">
            <img
              src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
              alt="11 to 12"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://i.ibb.co/mV0z77Mb/11to12logg.png';
              }}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4C00] bg-[#FF4C00]/10 border border-[#FF4C00]/20 px-2.5 py-0.5 rounded-full">
              Lagos Office Lunch OS
            </span>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-black leading-tight tracking-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                {description}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={onSignIn}>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Registered Work Email</label>
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
                  <label className="text-xs font-bold text-zinc-700 block">Password / Default Password</label>
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
                      placeholder="Enter password or default password"
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
                className="w-full rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] py-3.5 font-bold text-xs uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Sign In to Lunch Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative flex items-center justify-center my-1">
              <span className="w-full border-t border-zinc-200"></span>
              <span className="px-3 text-[11px] font-semibold text-zinc-400 bg-[#FAF7F2] absolute uppercase tracking-wider">
                Or Quick Access
              </span>
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 border border-zinc-300 bg-white rounded-2xl py-3 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition cursor-pointer shadow-2xs"
            >
              <GoogleIcon />
              <span>Continue with Corporate Google Workspace</span>
            </button>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-1">
              <p>
                <strong>New Subscriber?</strong> Use the default password sent by Chef Justice on WhatsApp. You will be prompted to set your personal permanent password on your first login.
              </p>
            </div>

            <p className="text-center text-xs text-zinc-500">
              Need to build an office plan?{' '}
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

      {/* Right column: hero image + testimonials */}
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

          {/* Top Brand Tag */}
          <div className="absolute top-8 left-8 z-10 flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-bold border border-white/25">
            <Sparkles className="w-3.5 h-3.5 text-[#FF4C00]" />
            <span>Piping-hot Nigerian corporate lunches delivered 11–12 daily</span>
          </div>

          {/* Testimonial Cards Overlay */}
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
