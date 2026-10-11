import React from 'react';

/**
 * HeroMapSection:
 * Full-width Hero Cover section featuring the official 11to12 animated hero banner.
 * Covers edge-to-edge on desktop without white borders, and maintains complete visibility
 * on mobile and tablet without aggressive cropping.
 */
export const HeroMapSection: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden bg-[#FAF7F2] flex items-center justify-center select-none"
    >
      <img
        src="/images/hero-banner.png"
        alt="11 to 12 Hero Cover"
        className="w-full h-auto min-w-full object-cover pointer-events-none block"
        loading="eager"
        decoding="sync"
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          if (!el.src.includes('XZjkrq3Q')) {
            el.src = 'https://i.ibb.co/XZjkrq3Q/Lagos-Coastal-Highway-Stop-Guide.png';
          } else if (!el.src.includes('kg56st97')) {
            el.src = 'https://i.ibb.co/kg56st97/Lagos-Coastal-Highway-Stop-Guide.png';
          }
        }}
      />
    </section>
  );
};
