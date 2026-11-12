import React from 'react';
import { CalendarCheck, Truck, Utensils } from 'lucide-react';

export const ProcessGrid: React.FC = () => {
  const steps = [
    {
      title: 'Pick Your Plan',
      description: 'Choose the workdays you want food delivered.',
      icon: CalendarCheck,
      cardClass: 'bg-zinc-200 border-zinc-300 text-[#1A1A1A]',
      iconWrapClass: 'bg-white text-[#FF4C00] shadow-xs',
      numClass: 'text-[#FF4C00]',
      descClass: 'text-zinc-700',
    },
    {
      title: 'We Bring Food',
      description: 'Hot chef-crafted meals dropped directly to your desk.',
      icon: Truck,
      cardClass: 'bg-gradient-to-br from-[#FFF4ED] to-[#FFE6D4] border-orange-200 text-[#1A1A1A]',
      iconWrapClass: 'bg-gradient-to-br from-[#FF4C00] to-[#FF7A2F] text-white shadow-sm',
      numClass: 'text-[#FF4C00]',
      descClass: 'text-zinc-700',
    },
    {
      title: 'You Eat',
      description: 'Zero cooking, zero queues, pure satisfaction.',
      icon: Utensils,
      cardClass: 'bg-gradient-to-br from-[#FF4C00] via-[#FF5E14] to-[#FF8533] border-orange-500 text-white',
      iconWrapClass: 'bg-white/20 text-white backdrop-blur-xs',
      numClass: 'text-orange-100',
      descClass: 'text-orange-50',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-24 bg-zinc-100 text-[#1A1A1A] font-['Poppins']">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Headline & Short Supporting Line */}
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-black">
            How it works
          </h2>
          <p className="text-zinc-600 text-base sm:text-lg font-medium">
            Three simple steps.
          </p>
        </div>

        {/* 3 Clean Modern Steps across Gray, Light Orange, and Orange Gradient */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`rounded-3xl p-6 sm:p-8 border shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center space-y-3 sm:space-y-4 max-w-full overflow-hidden ${item.cardClass}`}
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 ${item.iconWrapClass}`}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <span className={`text-xs font-bold tracking-wide ${item.numClass}`}>
                  0{idx + 1}.
                </span>
                <h3 className="text-lg sm:text-xl font-bold break-words">
                  {item.title}
                </h3>
                <p className={`text-xs sm:text-sm font-normal leading-relaxed break-words ${item.descClass}`}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
