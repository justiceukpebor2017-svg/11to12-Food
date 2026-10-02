import React from 'react';
import { CalendarCheck, Truck, Utensils } from 'lucide-react';

export const ProcessGrid: React.FC = () => {
  const steps = [
    {
      title: 'Pick Your Plan',
      description: 'Choose the workdays you want food delivered.',
      icon: CalendarCheck,
    },
    {
      title: 'We Bring Food',
      description: 'Hot chef-crafted meals dropped directly to your desk.',
      icon: Truck,
    },
    {
      title: 'You Eat',
      description: 'Zero cooking, zero queues, pure satisfaction.',
      icon: Utensils,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-24 bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins']">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Headline & Short Supporting Line */}
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-black">
            Escape Your Lunch Rut
          </h2>
          <p className="text-zinc-600 text-base sm:text-lg font-normal">
            It’s not rocket science. It's just lunch.
          </p>
        </div>

        {/* 3 Clean Modern Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF4C00] flex items-center justify-center">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-black">
                  {item.title}
                </h3>
                <p className="text-zinc-500 text-sm font-normal leading-relaxed">
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
