import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'So, what’s the deal here?',
      a: 'We deliver hot, chef-crafted lunches directly to your office desk in Victoria Island, Ikoyi, Marina, and Lekki Phase 1 between 11:00 AM and 12:00 PM.',
    },
    {
      q: 'What if I hate the meal of the day?',
      a: 'Every workday features an optional Sub Pack alternative (like hot meat pies, mini puff-puff, and chilled hibiscus zobo). Or simply tap Skip Day before 10:30 AM to receive a full Credit Star.',
    },
    {
      q: 'Does "skipping" mean I lose money?',
      a: 'Never. You receive a 1:1 Credit Star for every skipped day that never expires and can be redeemed for future meals.',
    },
    {
      q: 'Can I cancel or am I trapped forever?',
      a: 'Zero entrapment. You can pause, skip days, or cancel anytime with one tap.',
    },
    {
      q: 'Do you work on weekends?',
      a: 'Never. We are closed on Saturdays and Sundays so our kitchen and dispatch teams can recharge.',
    },
    {
      q: 'When do I know what I’m eating?',
      a: 'Our complete 26-week chef calendar is live above, so you always know what is coming.',
    },
    {
      q: 'Is delivery actually free?',
      a: 'Yes, 100% free. The price you see covers your meal delivered straight to your desk.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="py-20 sm:py-24 bg-white text-[#1A1A1A] font-['Poppins']">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-black">
            Your Burning Questions, Answered
          </h2>
          <p className="text-zinc-600 text-base sm:text-lg font-normal">
            All the things you're probably wondering about.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-zinc-200/80 rounded-2xl overflow-hidden transition-all bg-[#FAF7F2]/40"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between space-x-4 cursor-pointer"
                >
                  <span className="font-bold text-base sm:text-lg text-black">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform shrink-0 ${
                      isOpen ? 'bg-[#FF4C00] text-white rotate-180' : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-zinc-600 text-sm sm:text-base leading-relaxed border-t border-zinc-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
