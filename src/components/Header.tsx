import React, { useState } from 'react';
import { User, LogIn, AlertCircle, X, ShieldAlert, ShieldCheck, ArrowRight, Lock, KeyRound } from 'lucide-react';

interface HeaderProps {
  currentTab: 'marketing' | 'subscriber' | 'admin';
  setCurrentTab: (tab: 'marketing' | 'subscriber' | 'admin') => void;
  timeWindow?: 'morning' | 'delivery' | 'post_lunch';
  setTimeWindow?: (tw: 'morning' | 'delivery' | 'post_lunch') => void;
  creditsBalance?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

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
      <header className="sticky top-0 z-50 bg-[#FF4C00] text-white shadow-sm transition-all font-['Poppins']">
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
                className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://i.ibb.co/mV0z77Mb/11to12logg.png';
                }}
              />
            </a>

            {/* Clean Restaurant Nav Links */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold tracking-wide text-white/95">
              <a
                href="#how-it-works"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="#menu"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="hover:text-white transition-colors"
              >
                Menu
              </a>
              <a
                href="#pricing"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="hover:text-white transition-colors"
              >
                Build Plan
              </a>
              <a
                href="#faq"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="hover:text-white transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Primary Action: Log In Button */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setLoginError('');
                  setShowLoginModal(true);
                }}
                className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition cursor-pointer border border-white/20 shadow-xs"
                title="Log In"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            </div>

          </div>

          {/* Mobile Navigation Row */}
          <div className="flex md:hidden items-center justify-between py-2.5 border-t border-white/15 text-xs font-semibold">
            <div className="flex space-x-4">
              <a href="#how-it-works" onClick={() => setCurrentTab('marketing')} className="text-white/90">How It Works</a>
              <a href="#menu" onClick={() => setCurrentTab('marketing')} className="text-white/90">Menu</a>
              <a href="#pricing" onClick={() => setCurrentTab('marketing')} className="text-white/90">Build Plan</a>
              <a href="#faq" onClick={() => setCurrentTab('marketing')} className="text-white/90">FAQ</a>
            </div>
            <button
              onClick={() => {
                setLoginError('');
                setShowLoginModal(true);
              }}
              className="text-white font-bold underline flex items-center space-x-1 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
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
