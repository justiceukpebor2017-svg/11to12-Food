import React, { useState } from 'react';
import { Sparkles, Utensils, Check, X, ArrowRight, RefreshCw } from 'lucide-react';
import { SwallowType } from '../../types';

interface TomorrowLunchPreviewProps {
  dateFormatted?: string; // "Tue, Oct 6"
  dishTitle: string;
  emoji?: string;
  ingredients?: string[];
  isSwallow?: boolean;
  selectedSwallow?: SwallowType;
  onSelectSwallow?: (swallow: SwallowType) => void;
  onOpenMenu: () => void;
}

export const TomorrowLunchPreview: React.FC<TomorrowLunchPreviewProps> = ({
  dateFormatted = 'Tue, Oct 6',
  dishTitle = 'Honey Beans + Fried Plantain + Tilapia Fish',
  emoji = '🫘',
  ingredients = ['Stewed honey beans', 'Sweet fried plantain', 'Grilled seasoned tilapia', 'Pepper relish'],
  isSwallow = false,
  selectedSwallow,
  onSelectSwallow,
  onOpenMenu,
}) => {
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [tempSwallow, setTempSwallow] = useState<SwallowType>(selectedSwallow || 'Semo');

  return (
    <>
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 shadow-xs font-['Poppins'] text-left relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-1.5 text-[#FF4C00] mb-0.5">
              <span className="text-sm">👀</span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                Tomorrow's Lunch
              </span>
            </div>
            <span className="text-xs font-bold text-zinc-400 block">
              {dateFormatted}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsChangeModalOpen(true)}
            className="self-start sm:self-auto px-4 py-1.5 rounded-full border border-zinc-300 hover:border-black text-xs font-bold text-black transition cursor-pointer flex items-center space-x-1"
          >
            <span>[ Change ]</span>
          </button>
        </div>

        {/* Meal Preview */}
        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <span className="text-3xl group-hover:scale-110 transition-transform">
              {emoji}
            </span>
            <div>
              <h4 className="text-base font-black text-black">
                {dishTitle}
              </h4>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Lunch selected ✓</span>
                </span>
                {selectedSwallow && (
                  <span className="text-[11px] text-zinc-500 font-semibold">
                    • Swallow: <strong>{selectedSwallow}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 mt-3 font-medium">
          Fresh ingredients for tomorrow are being prepped today by Chef Justice.
        </p>
      </div>

      {/* Change Tomorrow Meal / Swallow Modal */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Poppins']">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsChangeModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold text-[#FF4C00] uppercase tracking-wider block mb-1">
              Customize Next Meal
            </span>
            <h3 className="text-xl font-black text-black">
              Tomorrow's Lunch Options
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{dateFormatted}</p>

            <div className="my-4 p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200">
              <span className="text-xs font-black text-black block mb-1">
                Scheduled Chef Dish:
              </span>
              <p className="text-sm font-bold text-zinc-800">
                {dishTitle}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-600 list-disc list-inside">
                {ingredients.slice(0, 3).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Swallow Selection if swallow meal */}
            {isSwallow && onSelectSwallow && (
              <div className="mb-4 space-y-2">
                <span className="text-xs font-bold text-black block">
                  Select Swallow Choice:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Semo', 'Eba', 'Fufu'] as SwallowType[]).map((swallow) => (
                    <button
                      key={swallow}
                      type="button"
                      onClick={() => {
                        setTempSwallow(swallow);
                        onSelectSwallow(swallow);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                        tempSwallow === swallow
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {swallow}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangeModalOpen(false);
                  onOpenMenu();
                }}
                className="w-full py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Explore Full 26-Day Rotating Menu</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangeModalOpen(false)}
                className="w-full py-3 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
              >
                Keep Tomorrow's Dish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
