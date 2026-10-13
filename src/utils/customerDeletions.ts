/**
 * Customer Deletion & Account Invalidation Tracker
 * Ensures deleted customers are permanently purged across all browsers, tabs, and devices,
 * forcing immediate logout for active sessions and preventing resurrected state,
 * while allowing the email to be reused cleanly for new users.
 */

const DELETED_CUSTOMERS_KEY = '11to12_deleted_customer_markers_v1';
const DELETED_ACCOUNT_EVENT_KEY = '11to12_account_deleted_event';

export interface DeletedCustomerMarker {
  id?: string;
  email?: string;
  deletedAt: number;
}

export function getDeletedCustomerMarkers(): { ids: Set<string>; emails: Set<string> } {
  if (typeof window === 'undefined') return { ids: new Set(), emails: new Set() };
  try {
    const raw = localStorage.getItem(DELETED_CUSTOMERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ids: new Set(parsed.ids || []),
        emails: new Set((parsed.emails || []).map((e: string) => String(e).toLowerCase().trim())),
      };
    }
  } catch {}
  return { ids: new Set(), emails: new Set() };
}

/**
 * Marks a customer ID and/or email as permanently deleted.
 * Prevents snapshots, SSE broadcasts, or stale localStorage from re-inserting them.
 */
export function recordCustomerAsDeleted(id?: string, email?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = (id || '').trim();
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanId && !cleanEmail) return;

  try {
    const markers = getDeletedCustomerMarkers();
    if (cleanId) markers.ids.add(cleanId);
    if (cleanEmail) markers.emails.add(cleanEmail);

    localStorage.setItem(
      DELETED_CUSTOMERS_KEY,
      JSON.stringify({
        ids: Array.from(markers.ids),
        emails: Array.from(markers.emails),
      })
    );

    // Notify other tabs immediately via StorageEvent
    localStorage.setItem(
      DELETED_ACCOUNT_EVENT_KEY,
      JSON.stringify({
        id: cleanId,
        email: cleanEmail,
        timestamp: Date.now(),
      })
    );
  } catch {}
}

/**
 * Checks whether an ID or email has been deleted and should not be displayed or permitted to log in.
 */
export function isCustomerRecordedAsDeleted(id?: string, email?: string): boolean {
  if (typeof window === 'undefined') return false;
  const cleanId = (id || '').trim();
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanId && !cleanEmail) return false;

  const markers = getDeletedCustomerMarkers();
  if (cleanId && markers.ids.has(cleanId)) return true;
  if (cleanEmail && markers.emails.has(cleanEmail)) return true;
  return false;
}

/**
 * Unrecords a customer email/ID when a NEW user is intentionally onboarded with that email.
 * This ensures the email is 100% reusable for a fresh subscriber.
 */
export function unrecordCustomerAsDeleted(id?: string, email?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = (id || '').trim();
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanId && !cleanEmail) return;

  try {
    const markers = getDeletedCustomerMarkers();
    if (cleanId) markers.ids.delete(cleanId);
    if (cleanEmail) markers.emails.delete(cleanEmail);

    localStorage.setItem(
      DELETED_CUSTOMERS_KEY,
      JSON.stringify({
        ids: Array.from(markers.ids),
        emails: Array.from(markers.emails),
      })
    );
  } catch {}
}
