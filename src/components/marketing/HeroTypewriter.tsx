import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown } from 'lucide-react';

export const HeroTypewriter: React.FC = () => {
  const words = ['Actually good', 'Edible', 'On time', 'Firewood-smoky'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-[#FF4C00] text-white pt-10 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden font-['Poppins']">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
              Lunch that’s <br />
              <span className="relative inline-block text-black bg-white px-4 py-1 rounded-2xl font-serif-custom shadow-md transform -rotate-1 mt-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentIndex}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="inline-block"
                  >
                    {words[currentIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/95 max-w-xl font-normal leading-relaxed">
              Between back-to-back meetings, Lagos traffic, and late office hours, finding time for a proper meal feels impossible. That’s why 11 to 12 was created for 9 to 5ers.
            </p>

            <div className="pt-2 flex items-center space-x-4">
              <a
                href="#watch-and-reserve"
                className="bg-white text-black hover:bg-black hover:text-white px-8 py-4 rounded-full font-bold text-base transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center space-x-2"
              >
                <span>Feed Me</span>
              </a>

              <a
                href="#watch-and-reserve"
                className="text-sm font-semibold text-white/90 hover:text-white flex items-center space-x-1.5 px-4 py-3 rounded-full hover:bg-white/10 transition-colors"
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
