import React from 'react';
import { AdminAnnouncement } from '../../types';
import { Megaphone, AlertTriangle, Info, BellRing } from 'lucide-react';

interface AdminMegaphoneProps {
  announcements: AdminAnnouncement[];
}

export const AdminMegaphone: React.FC<AdminMegaphoneProps> = ({ announcements }) => {
  const activeAnnouncements = announcements.filter((a) => a.active);

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3">
      {activeAnnouncements.map((ann) => (
        <div
          key={ann.id}
          className={`p-4 border-3 border-black text-black shadow-[4px_4px_0px_#000] flex items-start space-x-3 transition-all ${
            ann.type === 'warning' || ann.type === 'delay'
              ? 'bg-[#FF4C00] text-white'
              : 'bg-[#FACC15] text-black'
          }`}
        >
          <div className="p-2 bg-black text-white border border-black flex-shrink-0 shadow-[2px_2px_0px_#000]">
            {ann.type === 'warning' || ann.type === 'delay' ? (
              <AlertTriangle className="w-5 h-5 text-[#FACC15] stroke-[3]" />
            ) : (
              <Megaphone className="w-5 h-5 text-[#22C55E] stroke-[3]" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider font-mono-custom flex items-center space-x-1 opacity-90">
                <BellRing className="w-3 h-3" />
                <span>ADMIN MEGAPHONE BROADCAST FROM 11 TO 12</span>
              </span>
              <span className="text-[10px] font-black font-mono-custom opacity-80">{ann.postedAt}</span>
            </div>
            <h4 className="text-base font-black uppercase font-heading">{ann.title}</h4>
            <p className="text-xs font-bold mt-1 leading-relaxed opacity-95">{ann.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

