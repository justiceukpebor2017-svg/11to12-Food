import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface WatchBeforeYouReserveModalProps {
  isOpen: boolean;
  onWatched: () => void;
}

export const WatchBeforeYouReserveModal: React.FC<WatchBeforeYouReserveModalProps> = ({
  isOpen,
  onWatched,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbSrc, setThumbSrc] = useState('/play.png');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#141414] border border-zinc-800 text-white rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Top Header */}
        <div className="p-5 sm:p-7 pb-3 sm:pb-4 text-center space-y-2 border-b border-zinc-800/80 bg-gradient-to-b from-[#1F1F1F] to-[#141414]">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF4C00]/20 border border-[#FF4C00]/40 text-[#FF4C00] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Essential Overview</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Watch Before You Reserve
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-normal">
            See exactly how 11 to 12 delivers hot, chef-crafted corporate lunches straight to your Victoria Island & Ikoyi workstation between 11:00 AM and 12:00 PM.
          </p>
        </div>

        {/* Video Box */}
        <div className="p-4 sm:p-6 space-y-5">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-white group shadow-2xl border border-zinc-800">
            <img
              src={thumbSrc}
              onError={() => setThumbSrc('/play.svg')}
              alt="How to Subscribe on 11 to 12 Video Overview"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-all duration-700 ${
                isPlaying ? 'scale-105 opacity-90' : 'opacity-100 group-hover:scale-102'
              }`}
            />

            {/* Video overlay controls */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF4C00] hover:bg-white text-white hover:text-[#FF4C00] flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl cursor-pointer"
                aria-label={isPlaying ? 'Pause Overview' : 'Play Overview'}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>

              <div className="mt-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-xs border border-white/10 text-[11px] font-semibold text-white/90">
                {isPlaying ? 'Playing Desk Drop Overview' : 'Click to Play Video'}
              </div>
            </div>

            {/* Video lower bar */}
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between text-[11px] text-zinc-300">
              <span className="flex items-center space-x-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#FF4C00]" />
                <span>Runtime: 0:60</span>
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono">1080p HD</span>
            </div>
          </div>

          {/* Only Single Button: I Have Watched */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onWatched}
              className="w-full py-4 px-6 rounded-2xl bg-[#FF4C00] hover:bg-[#ff5d1a] active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-xl shadow-[#FF4C00]/25 transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>I Have Watched</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
