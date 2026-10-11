/**
 * Cutoff rules for 11 to 12 Desk Drop Lagos Operations (West Africa Time - UTC+1):
 * - Daily Window: 12:00 PM (12:00) to 5:00 PM (17:00) WAT.
 * - Outside 12:00 PM - 5:00 PM WAT, user cannot skip meals or add/use credits.
 * - Specifically at or after 5:00 PM WAT, skipping meals or adding/using credits is automatically locked.
 * - Before 12:00 PM WAT, the skip/credit action window is not open.
 */

export interface TimeCutoffStatus {
  isActionAllowed: boolean;
  currentWatHour: number;
  currentWatMinute: number;
  timeStringWat: string;
  reason: string;
}

export function checkWatCutoffStatus(): TimeCutoffStatus {
  // Get current time in West Africa Time (Africa/Lagos is UTC+1 with no DST)
  const now = new Date();
  
  // Format to Africa/Lagos
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === 'hour')?.value || '00';
  const minutePart = parts.find((p) => p.type === 'minute')?.value || '00';
  
  const currentWatHour = parseInt(hourPart, 10);
  const currentWatMinute = parseInt(minutePart, 10);
  const timeStringWat = `${hourPart}:${minutePart} WAT`;
  
  // Allowed window is strictly from 12:00 PM to 5:00 PM (17:00) WAT
  // At 17:00 or later, it is locked. Before 12:00, it is not yet open.
  const isAfter12Pm = currentWatHour >= 12;
  const isBefore5Pm = currentWatHour < 17; // 17:00 is 5:00 PM sharp cutoff
  
  const isActionAllowed = isAfter12Pm && isBefore5Pm;
  
  let reason = '';
  if (!isAfter12Pm) {
    reason = `Daily changes are locked before 12:00 PM WAT (Current Lagos time: ${timeStringWat}). The action window opens at 12:00 PM WAT.`;
  } else if (!isBefore5Pm) {
    reason = `Daily changes are locked after 5:00 PM WAT (Current Lagos time: ${timeStringWat}). Kitchen dispatch batches have closed for the day.`;
  }
  
  return {
    isActionAllowed,
    currentWatHour,
    currentWatMinute,
    timeStringWat,
    reason,
  };
}
