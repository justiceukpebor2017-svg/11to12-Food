import React, { useState, useEffect } from 'react';
import { User, LogIn, AlertCircle, X, ShieldAlert, ShieldCheck, ArrowRight, Lock, KeyRound } from 'lucide-react';

interface HeaderProps {
  currentTab: 'marketing' | 'subscriber' | 'admin';
  setCurrentTab: (tab: 'marketing' | 'subscriber' | 'admin') => void;
  onOpenSubscriberLogin?: () => void;
  timeWindow?: 'morning' | 'delivery' | 'post_lunch';
  setTimeWindow?: (tw: 'morning' | 'delivery' | 'post_lunch') => void;
  creditsBalance?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSubscriberLogin,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnterAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');

    const trimmedEmail = adminEmail.trim().toLowerCase();
    const correctEmail = 'admin@11to12.food';
    const correctPassword = 'XGa4Z#j0;F';

    if (trimmedEmail === correctEmail && adminPassword === correctPassword) {
      setShowLoginModal(false);
      setAdminEmail('');
      setAdminPassword('');
      setCurrentTab('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setLoginError('Invalid email or password. Access is strictly restricted.');
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-['Poppins'] ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-zinc-200/50'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* 11 to 12 Brand Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('marketing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center space-x-3 group"
            >
              <img
                src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                alt="11 to 12 Logo"
                className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-md"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://i.ibb.co/mV0z77Mb/11to12logg.png';
                }}
              />
            </a>

            {/* Clean Restaurant Nav Links - Styled as Orange UI Buttons */}
            <nav className="hidden md:flex items-center space-x-2.5 lg:space-x-3">
              <a
                href="#how-it-works"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md shadow-black/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
              >
                How It Works
              </a>
              <a
                href="#menu"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md shadow-black/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
              >
                Menu
              </a>
              <a
                href="#pricing"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md shadow-black/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
              >
                Build Plan
              </a>
              <a
                href="#faq"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md shadow-black/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
              >
                FAQ
              </a>
            </nav>

            {/* Primary Action: Log In Button - Styled as Orange UI Button */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (onOpenSubscriberLogin) {
                    onOpenSubscriberLogin();
                  } else {
                    setLoginError('');
                    setShowLoginModal(true);
                  }
                }}
                className="px-4.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-black/15 cursor-pointer whitespace-nowrap"
                title="Log In"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            </div>

          </div>

          {/* Mobile Navigation Row - Styled as Orange UI Buttons */}
          <div className="flex md:hidden items-center justify-center pb-2.5 px-1 overflow-x-auto gap-2">
            <a
              href="#how-it-works"
              onClick={() => setCurrentTab('marketing')}
              className="px-3 py-1.5 rounded-lg bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold text-[11px] shadow-sm whitespace-nowrap active:scale-95 transition-all"
            >
              How It Works
            </a>
            <a
              href="#menu"
              onClick={() => setCurrentTab('marketing')}
              className="px-3 py-1.5 rounded-lg bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold text-[11px] shadow-sm whitespace-nowrap active:scale-95 transition-all"
            >
              Menu
            </a>
            <a
              href="#pricing"
              onClick={() => setCurrentTab('marketing')}
              className="px-3 py-1.5 rounded-lg bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold text-[11px] shadow-sm whitespace-nowrap active:scale-95 transition-all"
            >
              Build Plan
            </a>
            <a
              href="#faq"
              onClick={() => setCurrentTab('marketing')}
              className="px-3 py-1.5 rounded-lg bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold text-[11px] shadow-sm whitespace-nowrap active:scale-95 transition-all"
            >
              FAQ
            </a>
          </div>

        </div>
      </header>

      {/* Dual Login Modal: Subscriber Under Development & Admin Portal Direct Access */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-[#FAF7F2]">
              <div className="flex items-center space-x-3">
                <img
                  src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                  alt="11 to 12"
                  className="h-8 w-auto object-contain"
                />
                <div>
                  <h3 className="text-base font-bold text-black">11 to 12 Admin Login</h3>
                  <p className="text-xs text-zinc-500">Sign in to manage kitchen operations</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError('');
                }}
                className="p-2 rounded-full hover:bg-zinc-200 transition text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnterAdmin} className="p-6 sm:p-7 space-y-5 text-left">
              {loginError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                    <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={adminEmail}
                      onChange={(e) => {
                        setAdminEmail(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      placeholder="Enter admin email"
                      className="bg-transparent w-full text-zinc-900 text-sm font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                    Password
                  </label>
                  <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-300 focus-within:border-[#FF4C00] rounded-xl px-3.5 py-2.5 text-zinc-900 transition">
                    <KeyRound className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      placeholder="Enter password"
                      className="bg-transparent w-full text-zinc-900 text-sm font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
};
