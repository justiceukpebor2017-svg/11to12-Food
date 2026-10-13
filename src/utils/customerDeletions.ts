/**
 * Customer Deletion & Inactive Account Purge Tracker
 * Ensures specifically deleted customer record documents (by ID) are purged
 * so old deleted records do not resurrect from stale client caches,
 * and notifies active tabs to log off if their current session was removed.
 *
 * CRITICAL RULE: Emails are NEVER blacklisted!
 * Any email address can ALWAYS be used freely to register for new meal plans.
 */

const DELETED_CUSTOMER_IDS_KEY = '11to12_deleted_customer_ids_v2';
const DELETED_ACCOUNT_EVENT_KEY = '11to12_account_deleted_event';

export function getDeletedCustomerMarkers(): { ids: Set<string> } {
  if (typeof window === 'undefined') return { ids: new Set() };
  try {
    const raw = localStorage.getItem(DELETED_CUSTOMER_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { ids: new Set(parsed) };
      }
      if (parsed && Array.isArray(parsed.ids)) {
        return { ids: new Set(parsed.ids) };
      }
    }
  } catch {}
  return { ids: new Set() };
}

/**
 * Marks a specific deleted customer record ID so the deleted document is not re-inserted by stale caches.
 * Also emits an instant cross-tab notification so any active session on that account logs out.
 * Does NOT blacklist the email — the email can be used immediately to register again!
 */
export function recordCustomerAsDeleted(id?: string, email?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = (id || '').trim();
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanId && !cleanEmail) return;

  try {
    if (cleanId) {
      const markers = getDeletedCustomerMarkers();
      markers.ids.add(cleanId);
      localStorage.setItem(
        DELETED_CUSTOMER_IDS_KEY,
        JSON.stringify(Array.from(markers.ids))
      );
    }

    // Notify other tabs immediately via StorageEvent to terminate active session if currently open
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
 * Checks whether a specific customer record document ID was deleted.
 * Note: Only checks record ID to prevent resurrecting stale deleted records.
 * Emails are NEVER blacklisted — any email address can be used to register again!
 */
export function isCustomerRecordedAsDeleted(id?: string, _email?: string): boolean {
  if (typeof window === 'undefined' || !id) return false;
  const cleanId = String(id).trim();
  if (!cleanId) return false;

  const markers = getDeletedCustomerMarkers();
  return markers.ids.has(cleanId);
}

/**
 * Unrecords a customer ID if needed.
 */
export function unrecordCustomerAsDeleted(id?: string, _email?: string): void {
  if (typeof window === 'undefined' || !id) return;
  const cleanId = String(id).trim();
  if (!cleanId) return;

  try {
    const markers = getDeletedCustomerMarkers();
    markers.ids.delete(cleanId);
    localStorage.setItem(
      DELETED_CUSTOMER_IDS_KEY,
      JSON.stringify(Array.from(markers.ids))
    );
  } catch {}
}
