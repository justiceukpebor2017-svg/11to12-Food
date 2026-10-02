import React, { useState } from 'react';
import { HelpCircle, MessageCircle, Phone, Mail, Clock, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export const HelpSection: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is the cutoff time to skip today’s lunch and save my credit?',
      a: 'You can skip your lunch until 9:00 AM on the day of delivery directly from this dashboard. Once skipped before 9:00 AM, your lunch is not cooked and your credit is preserved 100% in your wallet.',
    },
    {
      q: 'When does my lunch arrive at my desk?',
      a: 'All 11 to 12 desk drops arrive strictly between 11:00 AM and 12:00 PM. We pack our lunches in custom heat-retaining thermal bowls so your food remains steaming hot even if your meeting runs until 1:30 PM.',
    },
    {
      q: 'How do I redeem my lunch credits for an extra plate?',
      a: 'Go to the Plan & Billing tab and click "Use 1 Credit for Extra Plate Tomorrow". The kitchen will prepare a second full portion dropped to your desk alongside your regular meal.',
    },
    {
      q: 'Can I change my delivery floor or office building?',
      a: 'Yes! Click "Delivery Addresses" under your profile or from Quick Actions. You can update your suite or select an alternative building in VI or Ikoyi.',
    },
  ];

  return (
    <div className="space-y-6 font-['Poppins'] text-left">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4C00] block">
            Subscriber Concierge
          </span>
          <h2 className="text-2xl font-black text-black">
            Help & Kitchen Support
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Direct line to Chef Justice and the desk drop dispatch team in Victoria Island.
          </p>
        </div>

        {/* WhatsApp Direct Concierge */}
        <a
          href="https://wa.me/2348031234567?text=Hello%2011to12%20Team%2C%20I%20have%20a%20question%20about%20my%20desk%20drop%20lunch"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition cursor-pointer shadow-md self-start md:self-auto"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>

      {/* Support Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF4C00]">
            <Phone className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-black text-black">Dispatch Hotline</h4>
          <p className="text-xs text-zinc-500">
            For urgent rider or desk drop access questions between 10:30 AM – 12:30 PM.
          </p>
          <span className="text-xs font-bold text-black block pt-1">+234 803 123 4567</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-[#FAF7F2] border border-zinc-200 flex items-center justify-center text-zinc-700">
            <Mail className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-black text-black">Email Concierge</h4>
          <p className="text-xs text-zinc-500">
            Billing questions, corporate invoice requests, and plan changes.
          </p>
          <span className="text-xs font-bold text-black block pt-1">hello@11to12.com</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Clock className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-black text-black">Delivery Promise</h4>
          <p className="text-xs text-zinc-500">
            Every lunch dropped to your desk before 12:00 PM or your next lunch is free.
          </p>
          <span className="text-xs font-bold text-emerald-700 block pt-1">Mon – Fri Workdays</span>
        </div>

      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs">
        <h3 className="text-base font-black text-black mb-4">
          Frequently Asked Questions
        </h3>

        <div className="divide-y divide-zinc-150">
          {faqs.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <div key={index} className="py-3.5">
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-black cursor-pointer hover:text-[#FF4C00] transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
