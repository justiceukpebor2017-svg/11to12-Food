import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';

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

interface LagosIslandAddressCheckModalProps {
  isOpen: boolean;
  onConfirmYes: () => void;
  onIgnoreOutsideZone: () => void;
  onClose: () => void;
}

export const LagosIslandAddressCheckModal: React.FC<LagosIslandAddressCheckModalProps> = ({
  isOpen,
  onConfirmYes,
  onIgnoreOutsideZone,
  onClose,
}) => {
  const [step, setStep] = useState<'question' | 'outside-zone'>('question');

  useEffect(() => {
    if (isOpen) {
      setStep('question');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lagos-address-check-title"
      className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-zinc-900/65 backdrop-blur-xs font-['Poppins'] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200/80 shadow-2xl p-6 sm:p-7 text-left overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'question' ? (
          <div className="space-y-5 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF4C00]">
              <MapPin className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C00] block">
                Delivery Zone Confirmation
              </span>
              <h3
                id="lagos-address-check-title"
                className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight"
              >
                Do you stay or work in Lagos Island?
              </h3>
            </div>

            <div className="relative w-full py-2 overflow-hidden select-none">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

              <div className="animate-flow-left-to-right flex items-center gap-2">
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

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onConfirmYes}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setStep('outside-zone')}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm uppercase tracking-wider border border-zinc-200/80 transition cursor-pointer active:scale-98"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-2 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF4C00]">
              <MapPin className="w-6 h-6" />
            </div>

            <p className="text-base sm:text-lg font-bold text-zinc-900 leading-snug px-2">
              We are currently only delivering to 9 to 5ers in Lagos Island.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onIgnoreOutsideZone}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF4C00] to-[#FF6E24] hover:from-[#E04300] hover:to-[#FF4C00] text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
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
