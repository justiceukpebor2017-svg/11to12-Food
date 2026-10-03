// Phone & Email Normalization Utilities for 11 to 12 Desk Drop

/**
 * Extracts a standardized 10-digit Nigerian mobile/phone key for duplicate detection.
 * Handles formats like:
 * - 08026180680
 * - +234 802 618 0680
 * - +2348026180680
 * - 2348026180680
 * - 080-2618-0680
 * - 8026180680
 */
export function getStandardPhoneKey(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // Nigerian international format: 2348026180680 (13 digits) -> 8026180680
  if (digits.startsWith('234') && digits.length >= 12) {
    return digits.slice(3);
  }
  // Nigerian local format with leading zero: 08026180680 (11 digits) -> 8026180680
  if (digits.startsWith('0') && digits.length >= 10) {
    return digits.slice(1);
  }
  // 10 digits without leading 0: 8026180680
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Standardizes email addresses (lowercased and trimmed).
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Formats a phone number for neat Nigerian display: 0802 618 0680
 */
export function formatNigerianPhoneDisplay(phone: string): string {
  const key = getStandardPhoneKey(phone);
  if (key.length === 10) {
    return `0${key.slice(0, 3)} ${key.slice(3, 6)} ${key.slice(6)}`;
  }
  return phone.trim();
}
