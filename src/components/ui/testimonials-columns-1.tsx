import React from "react";
import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";
import { TestimonialItem } from "../../types";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={`w-full max-w-sm ${props.className || ''}`}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 12,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map((item, i) => {
                // Get initials
                const initials = item.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    className="p-5 sm:p-7 rounded-3xl border border-zinc-200 bg-white shadow-md shadow-orange-500/5 max-w-full sm:max-w-sm w-full text-left transition hover:border-[#FF4C00]/40 flex flex-col justify-between overflow-hidden"
                    key={`${index}-${i}-${item.id}`}
                  >
                    <div className="min-w-0">
                      {/* Star Rating & Quote Accent */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1 text-[#FF4C00]">
                          {[...Array(item.rating || 5)].map((_, sIdx) => (
                            <Star key={sIdx} className="w-3.5 h-3.5 fill-[#FF4C00]" />
                          ))}
                        </div>
                        <Quote className="w-4 h-4 text-zinc-300 shrink-0" />
                      </div>

                      {/* Review Text */}
                      <p className="text-zinc-700 text-xs sm:text-sm leading-relaxed font-normal break-words">
                        "{item.text}"
                      </p>
                    </div>

                    {/* Author Details - NO IMAGES PER USER SPECIFICATION */}
                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-zinc-100 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-zinc-900 text-white font-black text-xs flex items-center justify-center tracking-wider shrink-0 border border-zinc-800">
                        {initials || '11'}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-zinc-900 tracking-tight leading-tight truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 tracking-tight truncate font-medium">
                          {item.role}{item.company ? ` • ${item.company}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

export const Testimonials = ({
  testimonials = [],
  title = "What Lagos Office Teams Say",
  subtitle = "Piping-hot Nigerian corporate lunches delivered directly to workstations between 11:00 AM and 12:00 PM.",
}: {
  testimonials?: TestimonialItem[];
  title?: string;
  subtitle?: string;
}) => {
  // If fewer than 9 testimonials, cycle through
  const list = testimonials.length > 0 ? testimonials : [
    {
      id: 't-1',
      name: 'Briana Patton',
      role: 'Operations Lead',
      company: 'Paystack, Victoria Island',
      text: '11 to 12 revolutionized lunch for our product team. Piping hot Nigerian meals arrive at our desks by 11:30 AM without interrupting meetings.',
      rating: 5,
    },
    {
      id: 't-2',
      name: 'Bilal Ahmed',
      role: 'Senior Software Engineer',
      company: 'Flutterwave, Ikoyi',
      text: 'Skipping days and swallow swaps make this the most flexible office meal setup in Lagos. Lunch is always ready when our sprint standup ends.',
      rating: 5,
    },
    {
      id: 't-3',
      name: 'Saman Malik',
      role: 'Finance Associate',
      company: 'KPMG Nigeria',
      text: 'The desk drop logistics are flawless. No more waiting downstairs in long delivery lines or dealing with dispatch rider calls.',
      rating: 5,
    },
    {
      id: 't-4',
      name: 'Omar Raza',
      role: 'Managing Director',
      company: 'Landmark Towers',
      text: 'Our entire floor switched to 11 to 12. Fresh ingredients, consistent quality every workday, and completely hassle-free.',
      rating: 5,
    },
    {
      id: 't-5',
      name: 'Zainab Hussain',
      role: 'Product Manager',
      company: 'Sterling Bank Marina',
      text: 'The calendar system makes planning meals effortless. The Jollof Rice with grilled chicken is restaurant-grade every single delivery.',
      rating: 5,
    },
    {
      id: 't-6',
      name: 'Aliza Khan',
      role: 'People Operations Lead',
      company: 'Mulliner Towers',
      text: 'Team productivity jumped noticeably when nobody had to leave their desk or wonder what to eat for lunch. Highly recommended.',
      rating: 5,
    },
    {
      id: 't-7',
      name: 'Farhan Siddiqui',
      role: 'Growth Director',
      company: 'Techstars Lagos',
      text: 'Exceptional service and packaging. The meals stay hot and fresh, and customer support via WhatsApp is immediate.',
      rating: 5,
    },
    {
      id: 't-8',
      name: 'Sana Sheikh',
      role: 'Legal Counsel',
      company: 'Churchgate Tower',
      text: 'The transparent pricing and wallet rollover when I have court appearances or off-site meetings give me complete peace of mind.',
      rating: 5,
    },
    {
      id: 't-9',
      name: 'Hassan Ali',
      role: 'Head of Operations',
      company: 'Eko Atlantic Hub',
      text: 'Best corporate lunch provider in Lagos. Every meal tastes like high-end home cooking, delivered like clockwork between 11 and 12.',
      rating: 5,
    },
  ];

  const col1 = list.slice(0, Math.ceil(list.length / 3));
  const col2 = list.slice(Math.ceil(list.length / 3), Math.ceil((list.length * 2) / 3));
  const col3 = list.slice(Math.ceil((list.length * 2) / 3));

  const firstColumn = col1.length > 0 ? col1 : list;
  const secondColumn = col2.length > 0 ? col2 : list;
  const thirdColumn = col3.length > 0 ? col3 : list;

  return (
    <section id="testimonials-section" className="bg-[#FAF7F2] py-20 relative overflow-hidden font-['Poppins']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-2xl mx-auto text-center mb-12"
        >
          <div className="flex justify-center">
            <span className="text-xs font-black uppercase tracking-widest text-[#FF4C00] bg-[#FF4C00]/10 border border-[#FF4C00]/20 py-1.5 px-4 rounded-full">
              Verified Subscriber Feedback
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 mt-4 leading-tight">
            {title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 font-medium">
            {subtitle}
          </p>
        </motion.div>

        {/* Animated 3-Column Testimonials Display with Top & Bottom Fade Mask */}
        <div className="flex justify-center gap-4 sm:gap-5 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[700px] overflow-hidden max-w-full">
          <TestimonialsColumn testimonials={firstColumn} duration={18} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={22} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={20} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
