import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';

interface LocationVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPlan: () => void;
}

const ISLAND_LOCATIONS = [
  'Epe',
  'Eleko',
  'Ibeju-Lekki',
  'Sangotedo',
  'Ajah',
  'VGC',
  'Chevron',
  'Agungi',
  'Jakunde',
  'Maruwa',
  'Lekki Phase 1',
  'Civic Center',
  'Obalende',
  'CMS',
];

export const LocationVerificationModal: React.FC<LocationVerificationModalProps> = ({
  isOpen,
  onClose,
  onProceedToPlan,
}) => {
  const [step, setStep] = useState<'question' | 'outside-zone'>('question');

  if (!isOpen) return null;

  const handleYes = () => {
    onProceedToPlan();
  };

  const handleNo = () => {
    setStep('outside-zone');
  };

  const handleIgnore = () => {
    onProceedToPlan();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-['Poppins'] animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200/80 shadow-2xl p-6 sm:p-7 text-center overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'question' ? (
          <div className="space-y-5">
            {/* Location Icon */}
            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF4C00]">
              <MapPin className="w-6 h-6" />
            </div>

            {/* Question */}
            <h3
              id="location-modal-title"
              className="text-xl sm:text-2xl font-black text-black tracking-tight"
            >
              Do you stay or work in Lagos Island?
            </h3>

            {/* Continuous Left-to-Right Flowing Locations Ticker */}
            <div className="relative w-full py-2 overflow-hidden select-none">
              {/* Left/Right Fading Gradients */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

              <div className="animate-flow-left-to-right flex items-center gap-2">
                {/* Duplicated 3 times for completely seamless infinite loop */}
                {[...ISLAND_LOCATIONS, ...ISLAND_LOCATIONS, ...ISLAND_LOCATIONS].map((loc, idx) => (
                  <button
                    key={`${loc}-${idx}`}
                    type="button"
                    tabIndex={-1}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 whitespace-nowrap shadow-2xs transition-colors shrink-0"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Yes / No */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleYes}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={handleNo}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm uppercase tracking-wider border border-zinc-200/80 transition cursor-pointer active:scale-98"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Location Icon */}
            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF4C00]">
              <MapPin className="w-6 h-6" />
            </div>

            {/* Direct message requested by user */}
            <p className="text-base sm:text-lg font-bold text-black leading-snug px-2">
              We are currently only delivering to 9 to 5ers in Lagos Island.
            </p>

            {/* Action Buttons: Ignore / Back */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleIgnore}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
              >
                Ignore
              </button>
              <button
                type="button"
                onClick={() => setStep('question')}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm uppercase tracking-wider border border-zinc-200/80 transition cursor-pointer active:scale-98"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
