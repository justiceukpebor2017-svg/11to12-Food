// Launch Configuration for 11 to 12 Desk Drop Food Subscription
// Central source of truth for deliveries launch, countdown, and calendar gating
import { LaunchSettings } from '../types';

export const DEFAULT_LAUNCH_DATE = '2026-11-02';

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function parseDateDetails(dateStr: string) {
  const parts = (dateStr || DEFAULT_LAUNCH_DATE).split('-');
  const y = parseInt(parts[0], 10) || 2026;
  const m = parseInt(parts[1], 10) || 11;
  const d = parseInt(parts[2], 10) || 2;
  const monthIndex = m - 1;
  const dateObj = new Date(y, monthIndex, d, 11, 0, 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dateObj.getDay()];
  const monthName = monthNames[monthIndex];

  return {
    year: y,
    monthIndex,
    day: d,
    hour: 11,
    minute: 0,
    dateString: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    displayDate: `${dayName}, ${monthName} ${d}, ${y}`,
    displayShort: `${dayName}, ${monthName} ${getOrdinal(d)}`,
  };
}

// Read initial from localStorage if available
function getInitialSettings(): LaunchSettings {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('11to12_launch_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.launchDate === 'string') {
          return {
            launchDate: parsed.launchDate,
            isEnabled: typeof parsed.isEnabled === 'boolean' ? parsed.isEnabled : true,
          };
        }
      }
    } catch {
      // ignore
    }
  }
  return {
    launchDate: DEFAULT_LAUNCH_DATE,
    isEnabled: true,
  };
}

let currentSettings: LaunchSettings = getInitialSettings();
let currentDetails = parseDateDetails(currentSettings.launchDate);

type Listener = (config: typeof LAUNCH_CONFIG) => void;
const listeners = new Set<Listener>();

// Reactive central configuration object
export const LAUNCH_CONFIG = {
  get year() {
    return currentDetails.year;
  },
  get monthIndex() {
    return currentDetails.monthIndex;
  },
  get day() {
    return currentDetails.day;
  },
  get hour() {
    return currentDetails.hour;
  },
  get minute() {
    return currentDetails.minute;
  },
  get dateString() {
    return currentDetails.dateString;
  },
  get displayDate() {
    return currentDetails.displayDate;
  },
  get displayShort() {
    return currentDetails.displayShort;
  },
  get isEnabled() {
    return currentSettings.isEnabled;
  },
};

export function getLaunchSettings(): LaunchSettings {
  return { ...currentSettings };
}

export function updateLaunchConfig(patch: Partial<LaunchSettings>): LaunchSettings {
  const newDate = patch.launchDate !== undefined ? patch.launchDate : currentSettings.launchDate;
  const newEnabled = patch.isEnabled !== undefined ? patch.isEnabled : currentSettings.isEnabled;

  currentSettings = {
    launchDate: newDate,
    isEnabled: newEnabled,
  };
  currentDetails = parseDateDetails(newDate);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('11to12_launch_settings', JSON.stringify(currentSettings));
      // Dispatch storage event for other windows/tabs
      window.dispatchEvent(new Event('launch-config-updated'));
    } catch {
      // ignore
    }
  }

  listeners.forEach((fn) => {
    try {
      fn(LAUNCH_CONFIG);
    } catch (err) {
      console.warn('[LaunchConfig] listener error:', err);
    }
  });

  return { ...currentSettings };
}

export function subscribeLaunchConfig(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Target timestamp in UTC/local milliseconds
export function getLaunchDate(): Date {
  return new Date(
    LAUNCH_CONFIG.year,
    LAUNCH_CONFIG.monthIndex,
    LAUNCH_CONFIG.day,
    LAUNCH_CONFIG.hour,
    LAUNCH_CONFIG.minute,
    0
  );
}

// Check if a given date is strictly before the launch date (ignores time)
// When launch date is removed/disabled (service officially launched), no future pre-launch block applies!
export function isDateBeforeLaunch(date: Date): boolean {
  if (!LAUNCH_CONFIG.isEnabled) {
    // Already launched!
    return false;
  }
  const targetMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const launchMidnight = new Date(
    LAUNCH_CONFIG.year,
    LAUNCH_CONFIG.monthIndex,
    LAUNCH_CONFIG.day
  ).getTime();
  return targetMidnight < launchMidnight;
}

// Calculate real-time countdown to launch date
export function getTimeUntilLaunch(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLaunched: boolean;
} {
  if (!LAUNCH_CONFIG.isEnabled) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLaunched: true };
  }

  const now = Date.now();
  const launchTime = getLaunchDate().getTime();
  const diff = launchTime - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLaunched: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isLaunched: false };
}
