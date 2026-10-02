import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export const TestimonialsCloud: React.FC = () => {
  const testimonials = [
    {
      quote: "I used to survive on Gala and spite. Now I survive on Gala, spite, and this Jollof Rice. It's an improvement.",
      author: 'Chinedu Okafor',
      role: 'Financial Analyst, Marina',
      initials: 'CO',
    },
    {
      quote: 'My VLOOKUPs are sharper and my soul is less crushed since I started ordering. Coincidence? Probably not.',
      author: 'Amina Bello',
      role: 'Operations Lead, Victoria Island',
      initials: 'AB',
    },
    {
      quote: "Finally, a lunch that doesn't make me question all my life choices. Just most of them. Which is a win.",
      author: 'Femi Adeleke',
      role: 'Product Manager, Ikoyi',
      initials: 'FA',
    },
    {
      quote: "My team actually looks forward to 12 PM now. The swallow rotation and desk delivery have stopped our daily lunch debates.",
      author: 'Blessing Eze',
      role: 'Human Resources Lead, Lekki',
      initials: 'BE',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const current = testimonials[currentIndex];

  return (
    <section className="py-20 sm:py-24 bg-[#FAF7F2] text-[#1A1A1A] font-['Poppins']">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Headline & Short Supporting Line */}
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-black">
            People Tolerate Us
          </h2>
          <p className="text-zinc-600 text-base sm:text-lg font-normal">
            Look, some people don't hate our food.
          </p>
        </div>

        {/* Clean Testimonial Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-200/80 shadow-md space-y-8">
          
          <div className="flex space-x-1 text-[#FF4C00]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>

          <blockquote className="text-xl sm:text-2xl font-normal text-zinc-900 leading-relaxed italic">
            "{current.quote}"
          </blockquote>

          <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-full bg-orange-100 border border-orange-200 text-[#FF4C00] font-black text-sm flex items-center justify-center">
                {current.initials}
              </div>
              <div>
                <div className="text-base font-bold text-black">{current.author}</div>
                <div className="text-xs text-zinc-500 font-medium">{current.role}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={prevSlide}
                className="p-2.5 rounded-full hover:bg-zinc-100 text-zinc-700 transition cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2.5 rounded-full hover:bg-zinc-100 text-zinc-700 transition cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
