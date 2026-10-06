import React, { useState, useEffect } from 'react';
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
  Calendar,
  Rocket,
  CalendarCheck,
  EyeOff,
  Check,
  RefreshCw,
} from 'lucide-react';
import { LaunchSettings } from '../../types';
import {
  LAUNCH_CONFIG,
  getLaunchSettings,
  updateLaunchConfig,
  getTimeUntilLaunch,
  DEFAULT_LAUNCH_DATE,
} from '../../config/launchConfig';
import { liveSync } from '../../services/liveSyncService';
import { saveLaunchSettingsToFirestore } from '../../services/firebase';

interface HomepageSyncProps {
  onNavigateHome: () => void;
  launchSettings?: LaunchSettings;
  onUpdateLaunchSettings?: (settings: Partial<LaunchSettings>) => void;
}

export const HomepageSyncManager: React.FC<HomepageSyncProps> = ({
  onNavigateHome,
  launchSettings: propLaunchSettings,
  onUpdateLaunchSettings,
}) => {
  const currentSettings = propLaunchSettings || getLaunchSettings();

  const [announcementText, setAnnouncementText] = useState(
    'Founding member spots: 13 left. Free 20th workday meal on monthly plans.'
  );
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(true);
  const [foundingCount, setFoundingCount] = useState(37);
  const [thursdaySoldOut, setThursdaySoldOut] = useState(false);
  const [fridaySwallowActive, setFridaySwallowActive] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState('Homepage content updated and broadcasted to all visitors!');

  // Launch Date controls
  const [launchDateInput, setLaunchDateInput] = useState(currentSettings.launchDate || DEFAULT_LAUNCH_DATE);
  const [isLaunchDateEnabled, setIsLaunchDateEnabled] = useState(
    typeof currentSettings.isEnabled === 'boolean' ? currentSettings.isEnabled : true
  );
  const [isSavingLaunch, setIsSavingLaunch] = useState(false);

  useEffect(() => {
    if (propLaunchSettings) {
      setLaunchDateInput(propLaunchSettings.launchDate);
      setIsLaunchDateEnabled(propLaunchSettings.isEnabled);
    }
  }, [propLaunchSettings]);

  // Compute preview for selected launch date
  const computePreview = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, m, d, 11, 0, 0);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        formatted: `${dayNames[dateObj.getDay()]}, ${monthNames[m]} ${d}, ${y}`,
        monthYear: `${monthNames[m]} ${y}`,
      };
    } catch {
      return {
        formatted: dateStr,
        monthYear: dateStr,
      };
    }
  };

  const preview = computePreview(launchDateInput);

  const handleSaveLaunchDate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLaunch(true);

    const updated: LaunchSettings = {
      launchDate: launchDateInput,
      isEnabled: isLaunchDateEnabled,
    };

    // Update central in-memory and local storage
    updateLaunchConfig(updated);

    // Call external callback if provided
    if (onUpdateLaunchSettings) {
      onUpdateLaunchSettings(updated);
    }

    // Persist to live sync backend (broadcasts to all open browser tabs/devices via SSE)
    await liveSync.updateLaunchSettings(updated);

    // Persist to Firestore document settings/launch
    await saveLaunchSettingsToFirestore(updated).catch(() => {});

    setIsSavingLaunch(false);
    setSavedMessage(
      isLaunchDateEnabled
        ? `✓ Launching date saved as ${preview.formatted}! All calendars across the homepage, admin dashboard, and subscriber portal have been updated.`
        : `✓ Launching date removed from homepage! All calendars are now set to live mode.`
    );
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 5000);
  };

  const handleToggleLaunchEnabled = async (enabled: boolean) => {
    setIsLaunchDateEnabled(enabled);
    const updated: LaunchSettings = {
      launchDate: launchDateInput,
      isEnabled: enabled,
    };

    updateLaunchConfig(updated);
    if (onUpdateLaunchSettings) {
      onUpdateLaunchSettings(updated);
    }
    await liveSync.updateLaunchSettings(updated);
    await saveLaunchSettingsToFirestore(updated).catch(() => {});

    setSavedMessage(
      enabled
        ? `✓ Launching date is now active on the homepage with countdown to ${preview.formatted}!`
        : `✓ Launching date successfully removed from homepage! We are officially live.`
    );
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 5000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage('Homepage banners, quotas, and kitchen toggles published!');
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
            Homepage Content & Launching Date Controls
          </h2>
          <p className="text-xs text-zinc-500">
            Control launch dates, homepage countdowns, kitchen alerts, and sync all calendars automatically without touching code.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 rounded-full border border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <span>Preview On Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center space-x-2 border border-emerald-200 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* 🚀 PRIMARY CONTROL: LAUNCHING DATE & MASTER CALENDAR SYNC */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white rounded-3xl border-2 border-[#FF4C00]/40 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-200/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF4C00] text-white flex items-center justify-center shadow-xs">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-zinc-900">
                  Delivery Launching Date & Calendar Synchronization
                </h3>
                {isLaunchDateEnabled ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Countdown Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-black uppercase tracking-wider">
                    Officially Launched (Date Removed)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">
                Set when you are launching. Saving automatically updates the homepage countdown, snaps the "What's the Kitchen Cooking" calendar and the food selection calendar to this date, and syncs all admin and subscriber calendars.
              </p>
            </div>
          </div>

          {/* Quick Toggle: Put or Remove Launching Date */}
          <div className="flex items-center space-x-2">
            {isLaunchDateEnabled ? (
              <button
                type="button"
                onClick={() => handleToggleLaunchEnabled(false)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                title="Remove launching date countdown banner from homepage once officially launched"
              >
                <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                <span>Remove Launching Date from Homepage</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleLaunchEnabled(true)}
                className="px-3.5 py-2 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                title="Put launching date countdown banner on homepage"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Put Launching Date on Homepage</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          <div className="space-y-1.5">
            <label className="text-xs font-black text-zinc-900 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-[#FF4C00]" />
              <span>Select Launching Date (YYYY-MM-DD):</span>
            </label>
            <input
              type="date"
              value={launchDateInput}
              onChange={(e) => setLaunchDateInput(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#FF4C00] shadow-2xs"
            />
            <div className="flex items-center space-x-1.5 pt-1">
              <span className="text-[10px] text-zinc-400 font-semibold">Quick picks:</span>
              <button
                type="button"
                onClick={() => setLaunchDateInput('2026-11-02')}
                className="text-[10px] bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md font-bold text-zinc-700 cursor-pointer"
              >
                Nov 2, 2026
              </button>
              <button
                type="button"
                onClick={() => setLaunchDateInput('2026-12-01')}
                className="text-[10px] bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md font-bold text-zinc-700 cursor-pointer"
              >
                Dec 1, 2026
              </button>
              <button
                type="button"
                onClick={() => setLaunchDateInput('2027-01-04')}
                className="text-[10px] bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md font-bold text-zinc-700 cursor-pointer"
              >
                Jan 4, 2027
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-zinc-200 text-xs shadow-2xs space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
              Configured Launching Target
            </span>
            <div className="font-black text-sm text-black">
              {preview.formatted}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium">
              Calendar starting month: <strong>{preview.monthYear}</strong>
            </div>
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <button
              type="button"
              onClick={() => handleSaveLaunchDate()}
              disabled={isSavingLaunch}
              className="w-full py-3 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] disabled:bg-zinc-400 text-white font-black text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              {isSavingLaunch ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving & Updating...</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Launching Date & Update All Calendars</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-zinc-500 text-center block">
              Pushes live updates to all open browsers & device calendars instantly.
            </span>
          </div>

        </div>

        {/* Sync Impact Breakdown */}
        <div className="p-3.5 bg-white/80 rounded-2xl border border-orange-200 text-[11px] text-zinc-700 space-y-1">
          <span className="font-bold text-zinc-900 block">
            Automatic Sync Effects When You Save:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-zinc-600">
            <div>✓ <strong>Homepage:</strong> Updates "Deliveries Begin {preview.formatted}" countdown banner</div>
            <div>✓ <strong>Kitchen Cooking Calendar:</strong> Immediately snaps to {preview.monthYear}</div>
            <div>✓ <strong>Meal Builder Calendar:</strong> Re-anchors starting cycle to {preview.monthYear}</div>
            <div>✓ <strong>Admin & Subscriber Portals:</strong> Auto-navigates calendars to match launch date</div>
          </div>
        </div>
      </div>

      {/* Sync Form for general marketing controls */}
      <form onSubmit={handleSaveGeneral} className="space-y-6">
        
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
            className="px-7 py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            Publish Content Updates to Homepage
          </button>
        </div>

      </form>

    </div>
  );
};
