import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPrivacyPolicy: () => void;
}

export const COOKIE_CONSENT_KEY = '11to12_cookie_consent';

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPrivacyPolicy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        // Show banner after brief delay
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  // Listen for custom trigger to re-open cookie preferences from footer
  useEffect(() => {
    const handleReopen = () => {
      setIsVisible(true);
    };
    window.addEventListener('11to12_reopen_cookie_banner', handleReopen);
    return () => window.removeEventListener('11to12_reopen_cookie_banner', handleReopen);
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    } catch {}
    setIsVisible(false);
  };

  const handleReject = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-0 inset-x-0 z-[80] p-3 sm:p-5 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300 font-['Poppins']"
    >
      <div className="max-w-4xl mx-auto bg-zinc-950/95 backdrop-blur-md text-white border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        
        {/* Left: Icon and Explanation */}
        <div className="flex items-start space-x-3.5 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-[#FF4C00]/15 text-[#FF4C00] flex items-center justify-center shrink-0 border border-[#FF4C00]/30 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                We Value Your Privacy & Lunch Experience
              </h4>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                NDPR Compliant
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              We use cookies and local storage to keep your lunch schedules active, remember your meal & swallow choices, and ensure prompt 11:00 AM – 12:00 PM workstation desk drops across Lagos. You can choose to accept all cookies or reject non-essential cookies.
            </p>
            <div className="pt-0.5">
              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="text-xs font-semibold text-[#FF4C00] hover:text-orange-400 underline underline-offset-2 transition cursor-pointer"
              >
                Read our Privacy Policy
              </button>
            </div>
          </div>
        </div>

        {/* Right: Reject or Accept Cookies Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end pt-1 md:pt-0 border-t md:border-t-0 border-zinc-800/80">
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-full border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer text-center"
          >
            Reject Cookies
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 md:flex-initial px-6 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-xs font-bold text-white transition shadow-md active:scale-95 cursor-pointer text-center"
          >
            Accept Cookies
          </button>
        </div>

      </div>
    </aside>
  );
};
