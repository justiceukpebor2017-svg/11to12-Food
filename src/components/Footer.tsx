import React, { useState } from 'react';
import { FooterInfoModals, FooterModalType } from './marketing/FooterInfoModals';

interface FooterProps {
  onNavigateToLanding?: () => void;
  onNavigateToSubscriber?: () => void;
  onNavigateToAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateToLanding,
}) => {
  const [activeModal, setActiveModal] = useState<FooterModalType>(null);

  return (
    <>
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

          {/* Links matching prompt with dedicated screens */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm font-medium text-zinc-400 text-center">
            <button
              onClick={() => setActiveModal('about')}
              className="hover:text-white transition cursor-pointer"
            >
              About Us
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              onClick={() => setActiveModal('contact')}
              className="hover:text-white transition cursor-pointer"
            >
              Contact
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              onClick={() => setActiveModal('terms')}
              className="hover:text-white transition cursor-pointer"
            >
              Terms of Service
            </button>
          </div>

          {/* Copyright Notice */}
          <div className="flex items-center justify-center text-xs text-zinc-500 font-normal text-center">
            <span>© {new Date().getFullYear()} 11 to 12 Inc. All rights reserved.</span>
          </div>

        </div>
      </footer>

      {/* Dedicated Screens for About Us, Contact, and Terms of Service */}
      <FooterInfoModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
};
