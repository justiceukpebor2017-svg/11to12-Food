import React from 'react';

/**
 * HeroMapSection:
 * Full-width hero section featuring the official 11to12 Lagos delivery route map illustration.
 * Preserves the exact original image asset without modification, overlays, or distortion.
 */
export const HeroMapSection: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative w-full h-[70vh] sm:h-[85vh] md:h-screen lg:h-screen min-h-[480px] overflow-hidden bg-[#FAF7F2] flex items-center justify-center select-none"
    >
      <img
        src="https://i.postimg.cc/bYHGffHs/Map.jpg"
        alt="11to12.food Lagos Delivery Route Map"
        className="w-full h-full object-cover object-center pointer-events-none"
        loading="eager"
        decoding="async"
      />
    </section>
  );
};
