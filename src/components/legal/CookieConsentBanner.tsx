import React, { useState, useEffect } from 'react';
import { Cookie, X, Check } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPolicy: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPolicy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('11to12_cookie_consent_accepted');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('11to12_cookie_consent_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-70 font-['Poppins'] animate-in fade-in slide-in-from-bottom duration-300">
      <div className="bg-zinc-900/95 backdrop-blur-md text-white p-5 rounded-3xl border border-zinc-700/80 shadow-2xl text-left space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#FF4C00]/20 rounded-xl border border-[#FF4C00]/30 text-[#FF4C00]">
              <Cookie className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Cookie & Session Consent
            </h4>
          </div>
          <button
            type="button"
            onClick={handleAccept}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          We use strictly essential cookies and local storage to manage your desk drop orders, active lunch days, and login sessions. No third-party ad tracking.
        </p>

        <div className="flex items-center space-x-2.5 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-2 px-4 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Essential Cookies</span>
          </button>
          <button
            type="button"
            onClick={onOpenPolicy}
            className="py-2 px-3 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition cursor-pointer underline underline-offset-4"
          >
            View Policy
          </button>
        </div>
      </div>
    </div>
  );
};
