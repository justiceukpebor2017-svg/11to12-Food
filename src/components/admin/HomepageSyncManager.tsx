import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  Sparkles,
  Megaphone,
  Clock,
  Eye,
  Save,
  Truck,
  ExternalLink,
} from 'lucide-react';

interface HomepageSyncProps {
  onNavigateHome: () => void;
}

export const HomepageSyncManager: React.FC<HomepageSyncProps> = ({ onNavigateHome }) => {
  const [announcementText, setAnnouncementText] = useState('Founding member spots: 13 left. Free 20th workday meal on monthly plans.');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(true);
  const [foundingCount, setFoundingCount] = useState(37);
  const [thursdaySoldOut, setThursdaySoldOut] = useState(false);
  const [fridaySwallowActive, setFridaySwallowActive] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Live Website Controls
          </span>
          <h2 className="text-2xl font-black text-black mt-0.5">
            Homepage Content & Broadcast Controls
          </h2>
          <p className="text-xs text-zinc-500">
            11 to 12 controls live banners, sold out warnings, and founding member quotas without touching code.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 rounded-full border border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Preview On Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Homepage content updated and broadcasted to all visitors!</span>
        </div>
      )}

      {/* Sync Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Banner Announcement Control */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center space-x-2">
              <Megaphone className="w-4 h-4 text-[#FF4C00]" />
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">
                Top Announcement Ticker
              </h3>
            </div>
            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncementActive}
                onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                className="rounded text-[#FF4C00]"
              />
              <span>Banner Active</span>
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Broadcast Message
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium text-black focus:outline-none focus:border-[#FF4C00]"
            />
          </div>
        </div>

        {/* Founding Cohort Quota */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-100">
            <Sparkles className="w-4 h-4 text-[#FF4C00]" />
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Founding 50 Launch Quota
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Seats Claimed Display (out of 50)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={foundingCount}
                onChange={(e) => setFoundingCount(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#FAF7F2] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Calculates remaining spots automatically on the reserve widget ({50 - foundingCount} left).
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 text-xs text-zinc-600">
              <span className="font-bold text-black block mb-1">Homepage Visual Rule:</span>
              Once claimed spots reach 50, the reserve button on the homepage changes to <strong>"Join The Waiting List"</strong>.
            </div>
          </div>
        </div>

        {/* Operational Emergency Toggles */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-100">
            <Sliders className="w-4 h-4 text-[#FF4C00]" />
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Instant Kitchen Emergency Overrides
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-zinc-200">
              <div>
                <span className="font-bold text-black block">Thursday Kitchen Sold Out Status</span>
                <span className="text-zinc-500 text-[11px]">
                  Instantly flags Thursday lunch slot as sold out on the calendar builder.
                </span>
              </div>
              <input
                type="checkbox"
                checked={thursdaySoldOut}
                onChange={(e) => setThursdaySoldOut(e.target.checked)}
                className="rounded text-[#FF4C00] w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-zinc-200">
              <div>
                <span className="font-bold text-black block">Friday Swallow Selector Enabled</span>
                <span className="text-zinc-500 text-[11px]">
                  Enables Semo, Eba, and Fufu radio options for Friday swallow days.
                </span>
              </div>
              <input
                type="checkbox"
                checked={fridaySwallowActive}
                onChange={(e) => setFridaySwallowActive(e.target.checked)}
                className="rounded text-[#FF4C00] w-4 h-4 cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-7 py-3 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            Publish Changes to Live Homepage
          </button>
        </div>

      </form>

    </div>
  );
};
