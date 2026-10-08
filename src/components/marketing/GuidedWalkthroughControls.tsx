import React, { useEffect } from 'react';
import { ArrowRight, X, Sparkles, Check, ChevronRight } from 'lucide-react';

export type WalkthroughStep = 1 | 2 | 3;

interface GuidedWalkthroughProps {
  currentStep: WalkthroughStep;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

export const GuidedWalkthroughControls: React.FC<GuidedWalkthroughProps> = ({
  currentStep,
  onNext,
  onSkip,
  onFinish,
}) => {
  const stepMeta = [
    {
      step: 1,
      badge: 'Step 1 of 3',
      title: 'Reserve Your Desk',
      description: "Choose where you'd like your lunch delivered. This is where you tell us where your desk drop should be.",
      targetId: 'reserve-form',
      nextLabel: 'Next →',
    },
    {
      step: 2,
      badge: 'Step 2 of 3',
      title: "What's the Kitchen Cooking?",
      description: "Explore the meal calendar and see exactly what we're cooking on the days you could receive lunch.",
      targetId: 'menu',
      nextLabel: 'Next →',
    },
    {
      step: 3,
      badge: 'Step 3 of 3',
      title: 'Build Your Lunch Plan',
      description: 'Select your preferred delivery workdays, calculate your order, and complete your reservation.',
      targetId: 'pricing',
      nextLabel: 'Get Started →',
    },
  ];

  const currentMeta = stepMeta[currentStep - 1];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-lg font-['Poppins'] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-950/95 text-white border border-zinc-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
        
        {/* Top Bar: Badge, Dots, and Skip Button */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#FF4C00] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4C00]">
              Guided Tour • {currentMeta.badge}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Step Indicators */}
            <div className="flex items-center space-x-1.5">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === stepNum
                      ? 'w-6 bg-[#FF4C00]'
                      : currentStep > stepNum
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer px-2 py-0.5 rounded-lg hover:bg-zinc-800"
              title="Exit guided tour"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-3 space-y-1">
          <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
            {currentMeta.title}
          </h4>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            {currentMeta.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-zinc-400 hover:text-zinc-200 font-semibold cursor-pointer"
          >
            Skip walkthrough
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={onNext}
              className="px-5 py-2.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-orange-500/20 flex items-center space-x-1.5"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinish}
              className="px-6 py-2.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-orange-500/20 flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Started →</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
