import React from 'react';

interface FooterProps {
  onNavigateToLanding?: () => void;
  onNavigateToSubscriber?: () => void;
  onNavigateToAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateToLanding,
  onNavigateToSubscriber,
  onNavigateToAdmin,
}) => {
  return (
    <footer className="bg-[#141414] text-white border-t border-zinc-800 py-12 px-4 sm:px-6 lg:px-8 font-['Poppins']">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Brand Logo */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={onNavigateToLanding}
        >
          <img
            src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
            alt="11 to 12 Logo"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://i.ibb.co/mV0z77Mb/11to12logg.png';
            }}
          />
        </div>

        {/* Links matching prompt */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm font-medium text-zinc-400 text-center">
          <a href="#how-it-works" className="hover:text-white transition">About Us</a>
          <span className="hidden sm:inline">•</span>
          <a href="#faq" className="hover:text-white transition">Contact</a>
          <span className="hidden sm:inline">•</span>
          <a href="#pricing" className="hover:text-white transition">Terms of Service</a>
        </div>

        {/* Discrete Portal access & Copyright */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-normal text-center">
          {onNavigateToSubscriber && (
            <button
              onClick={onNavigateToSubscriber}
              className="hover:text-zinc-300 transition cursor-pointer"
            >
              Subscriber
            </button>
          )}
          {onNavigateToAdmin && (
            <>
              <span>•</span>
              <button
                onClick={onNavigateToAdmin}
                className="hover:text-zinc-300 transition cursor-pointer"
              >
                Kitchen Admin
              </button>
            </>
          )}
          <span>•</span>
          <span>© {new Date().getFullYear()} 11 to 12 Inc.</span>
        </div>

      </div>
    </footer>
  );
};
