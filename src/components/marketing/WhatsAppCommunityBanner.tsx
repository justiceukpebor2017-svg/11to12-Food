import React, { useState } from 'react';

interface WhatsAppCommunityBannerProps {
  className?: string;
}

export const WhatsAppCommunityBanner: React.FC<WhatsAppCommunityBannerProps> = ({ className = '' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const communityLink = 'https://chat.whatsapp.com/ENbclPhCLu0DD9qG0BMBmW';
  const primaryImage = 'https://i.ibb.co/Q73ksgTf/whatapppcomunity.png';
  const fallbackImage = 'https://i.ibb.co/gbLds2f3/whatapppcomunity.png';

  return (
    <section
      aria-label="Join 11 to 12 WhatsApp Community"
      className={`w-full overflow-hidden bg-[#FAF7F2] ${className}`}
    >
      <div className="w-full">
        <a
          href={communityLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group block w-full relative overflow-hidden transition-all duration-300 hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 cursor-pointer"
          title="Join 11 to 12 WhatsApp Community"
        >
          {/* Full bleed responsive banner that contains and adjusts seamlessly on desktop, tablet, and mobile */}
          <div className="w-full relative flex items-center justify-center bg-black/5">
            <img
              src={primaryImage}
              alt="Join 11 to 12 WhatsApp Community"
              width={1920}
              height={1080}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== fallbackImage) {
                  target.src = fallbackImage;
                }
              }}
              className={`w-full h-auto max-h-[90vh] object-contain transition-all duration-500 ease-out ${
                imageLoaded ? 'opacity-100' : 'opacity-90'
              } group-hover:scale-[1.008]`}
              loading="lazy"
            />
          </div>
        </a>
      </div>
    </section>
  );
};
