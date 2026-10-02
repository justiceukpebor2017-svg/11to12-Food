import React, { useState } from 'react';
import { MessageCircle, X, ChevronUp, Sparkles, Clock, ExternalLink } from 'lucide-react';

interface ConciergeFloatingWidgetProps {
  subscriberName?: string;
  deskLocation?: string;
}

export const ConciergeFloatingWidget: React.FC<ConciergeFloatingWidgetProps> = ({
  subscriberName = 'Subscriber',
  deskLocation = 'Landmark Towers, Floor 4',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappMessage = encodeURIComponent(
    `Hello 11 to 12 Concierge! I am ${subscriberName} (Desk: ${deskLocation}). I have a question regarding today's desk drop lunch.`
  );
  const whatsappUrl = `https://wa.me/2348031234567?text=${whatsappMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 font-['Poppins'] text-left">
      {isOpen ? (
        <div className="bg-white rounded-3xl border-2 border-black p-5 shadow-2xl w-80 sm:w-88 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                11:12
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  ● Online • Desk Concierge
                </span>
                <h4 className="text-sm font-black text-black">
                  11 to 12 Concierge
                </h4>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="my-3.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 space-y-1">
            <p className="font-bold text-black flex items-center space-x-1">
              <span>👋 Need anything?</span>
            </p>
            <p className="text-zinc-600 leading-relaxed">
              We help with desk address changes, dietary notes, skipped lunches, or rider updates. Usually replies within 2 minutes.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Chat on WhatsApp →</span>
          </a>

          <div className="mt-2 text-center">
            <span className="text-[10px] text-zinc-400">Direct link to Chef Justice Dispatch Team</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-3 bg-black hover:bg-zinc-900 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition cursor-pointer border border-zinc-700"
        >
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="text-left hidden sm:block">
            <span className="text-[10px] font-bold text-zinc-400 block leading-tight">Need anything?</span>
            <span className="text-xs font-black text-white block leading-tight">11 to 12 Concierge</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <MessageCircle className="w-4 h-4 fill-white" />
          </div>
        </button>
      )}
    </div>
  );
};
