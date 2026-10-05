import React, { useState } from 'react';
import {
  Play,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Utensils,
  Calendar,
  RotateCcw,
  ShieldCheck,
  Building,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface DashboardVideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardVideoTutorialModal: React.FC<DashboardVideoTutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);

  if (!isOpen) return null;

  const chapters = [
    {
      title: '1. Daily Desk Drop Window (11 AM – 12 PM)',
      time: '0:45',
      desc: 'Meals arrive hot directly at your floor & suite before lunch rush.',
    },
    {
      title: '2. Skipping & Unskipping Meals (4 Skip Trials)',
      time: '1:30',
      desc: 'Skip any upcoming lunch with 1 click; your credit is preserved 100% in your wallet. Unskip anytime to restore.',
    },
    {
      title: '3. Friday Swallow Customization',
      time: '2:15',
      desc: 'Pick Semo, Eba, or Fufu for every Friday native soup day on your calendar.',
    },
    {
      title: '4. Extra Plates & Credit Rollover',
      time: '3:00',
      desc: 'Redeem stored credits for colleagues, guests, or rollover into your next month.',
    },
    {
      title: '5. Direct 11 to 12 WhatsApp Care',
      time: '3:40',
      desc: 'Need dietary changes or office desk relocation? Message kitchen care instantly.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm font-['Poppins']">
      <div className="relative w-full max-w-3xl bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FF4C00]/20 text-[#FF4C00] flex items-center justify-center">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                How to Use Your 11 to 12 Lunch Dashboard
              </h3>
              <p className="text-[11px] text-zinc-400">
                Official Video Guide & Quick Walkthrough (3:40 min)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Display */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden shrink-0">
          {/* Animated Background Preview */}
          <img
            src="https://i.ibb.co/rG6JFnyY/0904-ezgif-com-resize.gif"
            alt="Dashboard Tutorial Video"
            className="w-full h-full object-cover opacity-60"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 flex flex-col justify-between p-5">
            {/* Top Badges */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#FF4C00] text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Tutorial Playing</span>
              </span>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/60 hover:bg-black text-white text-xs backdrop-blur-sm cursor-pointer transition border border-white/10"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            {/* Middle Big Play/Pause Button */}
            <div className="flex items-center justify-center my-auto">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white flex items-center justify-center transition-transform hover:scale-110 shadow-2xl cursor-pointer"
              >
                <Play className="w-8 h-8 fill-current ml-1" />
              </button>
            </div>

            {/* Bottom Scrubber & Active Chapter Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span className="text-[#FF4C00] font-bold">
                  {chapters[activeChapter]?.title}
                </span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  {chapters[activeChapter]?.time} / 3:40
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF4C00] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((activeChapter + 1) / chapters.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Video Chapters List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
            Jump to Guide Chapters
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {chapters.map((ch, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveChapter(idx)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-2.5 ${
                  activeChapter === idx
                    ? 'bg-[#FF4C00]/15 border-[#FF4C00] text-white'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <span className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 text-[#FF4C00]">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{ch.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-2">{ch.time}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    {ch.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Available 24/7 on your dashboard for easy reference.</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition cursor-pointer self-end"
            >
              Close Video Guide
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
