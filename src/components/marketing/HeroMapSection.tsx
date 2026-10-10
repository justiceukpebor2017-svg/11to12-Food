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
        src="https://i.ibb.co/DD2TKrTn/ezgif-25712c0b68377720.gif"
        alt="11 to 12 Hero Cover"
        className="w-full h-auto min-w-full object-cover md:object-cover pointer-events-none block"
        loading="eager"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = 'https://i.ibb.co/TB3dhWd5/ezgif-25712c0b68377720.gif';
        }}
      />
    </section>
  );
};
