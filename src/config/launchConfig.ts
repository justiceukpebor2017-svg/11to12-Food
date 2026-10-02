// Launch Configuration for 11 to 12 Desk Drop Food Subscription
// Central source of truth for deliveries launch, countdown, and calendar gating

export const LAUNCH_CONFIG = {
  // Official Launch Date: Monday, November 2, 2026
  year: 2026,
  monthIndex: 10, // 0-indexed: 10 = November
  day: 2,
  hour: 11, // 11:00 AM WAT
  minute: 0,
  dateString: '2026-11-02',
  displayDate: 'Monday, November 2, 2026',
  displayShort: 'Monday, November 2nd',
};

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
export function isDateBeforeLaunch(date: Date): boolean {
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
