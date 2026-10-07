import React, { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';

export const HeroTypewriter: React.FC = () => {
  const words = ['Actually good', 'Edible', 'On time', 'Firewood-smoky'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsFading(false);
      }, 200);
    }, 2600);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative bg-[#FF4C00] text-white pt-10 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden font-['Poppins']">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 max-w-full">
            <h1 className="text-2xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.2] text-white break-words">
              Lunch that’s <br className="hidden sm:inline" />
              <span className="relative inline-block text-black bg-white px-3 sm:px-4 py-0.5 sm:py-1 rounded-2xl font-serif-custom shadow-md transform -rotate-1 mt-1 sm:mt-2 max-w-full">
                <span
                  className={`inline-block break-words text-xl sm:text-4xl lg:text-6xl transition-all duration-200 transform ${
                    isFading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                  }`}
                >
                  {words[currentIndex]}
                </span>
              </span>
            </h1>

            <p className="text-base sm:text-xl text-white/95 max-w-xl font-normal leading-relaxed break-words">
              Between back-to-back meetings, Lagos traffic, and late office hours, finding time for a proper meal feels impossible. That’s why 11 to 12 was created for 9 to 5ers.
            </p>

            <div className="pt-2 flex flex-wrap gap-3 items-center">
              <a
                href="#watch-and-reserve"
                className="bg-white text-black hover:bg-black hover:text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center space-x-2 shrink-0"
              >
                <span>Feed Me</span>
              </a>

              <a
                href="#watch-and-reserve"
                className="text-xs sm:text-sm font-semibold text-white/90 hover:text-white flex items-center space-x-1.5 px-4 py-3 rounded-full hover:bg-white/10 transition-colors shrink-0"
              >
                <span>Watch & Reserve</span>
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Column: Home page image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-black/20">
              <img
                src="https://i.ibb.co/rG6JFnyY/0904-ezgif-com-resize.gif"
                alt="11 to 12 Chef Lunch"
                className="w-full h-auto max-h-[500px] object-cover rounded-3xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=900';
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
