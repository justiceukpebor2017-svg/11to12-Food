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
      className="relative w-full overflow-hidden bg-[#FAF7F2] flex items-center justify-center select-none"
    >
      <img
        src="https://i.ibb.co/twQTjf0N/Vector-illustration-of-road-corr-2-K-20261009131501.jpg"
        alt="11to12.food Lagos Delivery Route Map"
        className="w-full h-auto max-h-screen object-contain pointer-events-none block"
        loading="eager"
        decoding="async"
      />
    </section>
  );
};
