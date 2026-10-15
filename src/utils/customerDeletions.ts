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
const DELETED_CUSTOMER_EMAILS_KEY = '11to12_deleted_customer_emails_v2';
const DELETED_ACCOUNT_EVENT_KEY = '11to12_account_deleted_event';

export function getDeletedCustomerMarkers(): { ids: Set<string>; emails: Set<string> } {
  if (typeof window === 'undefined') return { ids: new Set(), emails: new Set() };
  let ids = new Set<string>();
  let emails = new Set<string>();
  try {
    const rawIds = localStorage.getItem(DELETED_CUSTOMER_IDS_KEY);
    if (rawIds) {
      const parsed = JSON.parse(rawIds);
      if (Array.isArray(parsed)) ids = new Set(parsed);
      else if (parsed?.ids && Array.isArray(parsed.ids)) ids = new Set(parsed.ids);
    }
  } catch {}
  try {
    const rawEmails = localStorage.getItem(DELETED_CUSTOMER_EMAILS_KEY);
    if (rawEmails) {
      const parsed = JSON.parse(rawEmails);
      if (Array.isArray(parsed)) emails = new Set(parsed);
    }
  } catch {}
  return { ids, emails };
}

/**
 * Marks a specific deleted customer record ID and email so the deleted account is purged worldwide,
 * cannot log in on any device with saved credentials, and is purged from admin dashboards.
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

    if (cleanId) {
      localStorage.setItem(DELETED_CUSTOMER_IDS_KEY, JSON.stringify(Array.from(markers.ids)));
    }
    if (cleanEmail) {
      localStorage.setItem(DELETED_CUSTOMER_EMAILS_KEY, JSON.stringify(Array.from(markers.emails)));
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
 * Checks whether a specific customer record document ID or email was deleted.
 */
export function isCustomerRecordedAsDeleted(id?: string, email?: string): boolean {
  if (typeof window === 'undefined') return false;
  const cleanId = id ? String(id).trim() : '';
  const cleanEmail = email ? String(email).toLowerCase().trim() : '';
  if (!cleanId && !cleanEmail) return false;

  const markers = getDeletedCustomerMarkers();
  if (cleanId && markers.ids.has(cleanId)) return true;
  if (cleanEmail && markers.emails.has(cleanEmail)) return true;
  return false;
}

/**
 * Unrecords a customer ID/email when a fresh user registers with that email.
 * This ensures that a new registration is treated as a clean fresh user without copying old data.
 */
export function unrecordCustomerAsDeleted(id?: string, email?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = id ? String(id).trim() : '';
  const cleanEmail = email ? String(email).toLowerCase().trim() : '';
  if (!cleanId && !cleanEmail) return;

  try {
    const markers = getDeletedCustomerMarkers();
    if (cleanId) markers.ids.delete(cleanId);
    if (cleanEmail) markers.emails.delete(cleanEmail);

    localStorage.setItem(DELETED_CUSTOMER_IDS_KEY, JSON.stringify(Array.from(markers.ids)));
    localStorage.setItem(DELETED_CUSTOMER_EMAILS_KEY, JSON.stringify(Array.from(markers.emails)));
  } catch {}
}
