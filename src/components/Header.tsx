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
  const [adminEmail, setAdminEmail] = useState('justice@11to12.com');
  const [adminPassword, setAdminPassword] = useState('••••••••••••');

  const handleEnterAdmin = () => {
    setShowLoginModal(false);
    setCurrentTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                href="#watch-and-reserve"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="hover:text-white transition-colors"
              >
                Reserve
              </a>
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

            {/* Primary Action Button & Log In Icon */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              
              {/* Log In Icon Button */}
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition cursor-pointer border border-white/20 shadow-xs"
                title="Log In Portal"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Log In</span>
              </button>

              <a
                href="#watch-and-reserve"
                onClick={() => {
                  if (currentTab !== 'marketing') setCurrentTab('marketing');
                }}
                className="bg-white text-black hover:bg-black hover:text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
              >
                Reserve Desk Drop
              </a>
            </div>

          </div>

          {/* Mobile Navigation Row */}
          <div className="flex md:hidden items-center justify-between py-2.5 border-t border-white/15 text-xs font-semibold">
            <div className="flex space-x-3">
              <a href="#watch-and-reserve" onClick={() => setCurrentTab('marketing')} className="text-white">Reserve</a>
              <a href="#how-it-works" onClick={() => setCurrentTab('marketing')} className="text-white/90">How It Works</a>
              <a href="#menu" onClick={() => setCurrentTab('marketing')} className="text-white/90">Menu</a>
              <a href="#pricing" onClick={() => setCurrentTab('marketing')} className="text-white/90">Build Plan</a>
              <a href="#faq" onClick={() => setCurrentTab('marketing')} className="text-white/90">FAQ</a>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
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
          <div className="relative w-full max-w-lg bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-[#FAF7F2]">
              <div className="flex items-center space-x-3">
                <img
                  src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                  alt="11 to 12"
                  className="h-8 w-auto object-contain"
                />
                <div>
                  <h3 className="text-lg font-bold text-black">11 to 12 Portal Access</h3>
                  <p className="text-xs text-zinc-500">Subscribers & Kitchen Operations</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-2 rounded-full hover:bg-zinc-200 transition text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-7 space-y-6">
              
              {/* SECTION 1: Customer & Subscriber Lunch Dashboard Access */}
              <div className="p-5 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#FF4C00]" />
                    <span className="text-xs font-bold text-black">Customer & Subscriber Login</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Access your personal Lunch Control Center: manage scheduled days, today's desk delivery, credits wallet, and meal swaps.
                </p>
                <div className="p-3 rounded-xl bg-white border border-orange-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-black block">Subscriber Desk Drop Portal</span>
                    <span className="text-[10px] text-zinc-500">Manage lunches, meal swaps & credit wallet</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Subscriber
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setCurrentTab('subscriber');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Enter Lunch Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* SECTION 2: Admin Operations Access (Straight to Admin Dashboard) */}
              <div className="p-5 rounded-2xl bg-black text-white border border-zinc-800 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#FF4C00]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Chef Justice Kitchen & Admin OS
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    Admin Active
                  </span>
                </div>

                <p className="text-xs text-zinc-400">
                  Access the operating system behind 11 to 12: today's production, live orders, route deliveries, and financials.
                </p>

                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">Admin Email</span>
                    <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-200">
                      <Lock className="w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="bg-transparent w-full text-white font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">Password</span>
                    <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-200">
                      <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="bg-transparent w-full text-white font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Direct Admin Button: Takes user straight to admin dashboard */}
                <button
                  type="button"
                  onClick={handleEnterAdmin}
                  className="w-full py-3.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Enter Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
};
