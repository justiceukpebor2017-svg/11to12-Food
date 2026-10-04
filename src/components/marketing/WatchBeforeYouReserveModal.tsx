import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, ArrowRight, ShieldCheck, Utensils, Clock, Sparkles } from 'lucide-react';

interface WatchBeforeYouReserveModalProps {
  isOpen: boolean;
  onWatched: () => void;
  onSkipToWaitlist?: () => void;
}

export const WatchBeforeYouReserveModal: React.FC<WatchBeforeYouReserveModalProps> = ({
  isOpen,
  onWatched,
  onSkipToWaitlist,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-[#141414] border border-zinc-800 text-white rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Top Header Badge */}
        <div className="p-5 sm:p-7 pb-3 sm:pb-4 text-center space-y-2 border-b border-zinc-800/80 bg-gradient-to-b from-[#1F1F1F] to-[#141414]">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF4C00]/20 border border-[#FF4C00]/40 text-[#FF4C00] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Essential 60-Second Onboarding</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Watch Before You Reserve
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto font-normal">
            See exactly how 11 to 12 delivers hot, chef-crafted Nigerian corporate lunches straight to your Victoria Island & Ikoyi workstation between 11:00 AM and 12:00 PM.
          </p>
        </div>

        {/* Video Player Box */}
        <div className="p-4 sm:p-7 space-y-5">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black group shadow-2xl border border-zinc-800">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200"
              alt="11 to 12 Desk Drop Preview"
              className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? 'scale-105 opacity-90' : 'opacity-70 group-hover:scale-105'}`}
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
                {isPlaying ? 'Playing 60s Desk Drop Overview' : 'Click to Play 60-Second Video'}
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

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-start space-x-2.5">
              <Utensils className="w-4 h-4 text-[#FF4C00] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">Hot Desk Drop</span>
                <span className="text-[11px] text-zinc-400">Meals arrive at your exact floor before 12 PM.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">Skip & Roll Over</span>
                <span className="text-[11px] text-zinc-400">Out of office? Easily skip days with 1 click.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">No Vendor Hassles</span>
                <span className="text-[11px] text-zinc-400">Zero dispatch calls or lunchtime delays.</span>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons: "I Have Watched" */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onWatched}
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-[#FF4C00] hover:bg-[#ff5d1a] active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-xl shadow-[#FF4C00]/25 transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>I Have Watched — Pick Days</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onSkipToWaitlist && (
              <button
                type="button"
                onClick={onSkipToWaitlist}
                className="w-full sm:w-auto py-3.5 sm:py-4 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm transition cursor-pointer border border-zinc-700 flex items-center justify-center space-x-2"
              >
                <span>I Have Watched — Join Waitlist</span>
                <ArrowRight className="w-4 h-4 text-[#FF4C00]" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
