/**
 * Deletion & Inactive Account Purge Tracker
 * Tracks deleted record document IDs for Customers, Orders (Pending Invoices), and Companies
 * so deleted records never resurrect from stale client caches or logout snapshots,
 * while ensuring email addresses are NEVER permanently blacklisted from future registrations.
 */

const DELETED_CUSTOMER_IDS_KEY = '11to12_deleted_customer_ids_v2';
const DELETED_ORDER_IDS_KEY = '11to12_deleted_order_ids_v1';
const DELETED_CORPORATE_IDS_KEY = '11to12_deleted_corporate_ids_v1';
const DELETED_ACCOUNT_EVENT_KEY = '11to12_account_deleted_event';

function readIdSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.map((x) => String(x).trim()).filter(Boolean));
      if (parsed?.ids && Array.isArray(parsed.ids)) {
        return new Set(parsed.ids.map((x: any) => String(x).trim()).filter(Boolean));
      }
    }
  } catch {}
  return new Set();
}

function writeIdSet(key: string, set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
}

export function getDeletedCustomerMarkers(): { ids: Set<string>; emails: Set<string> } {
  return { ids: readIdSet(DELETED_CUSTOMER_IDS_KEY), emails: new Set() };
}

/**
 * Marks a specific deleted customer record ID so it never resurrects from caches,
 * and broadcasts a StorageEvent so any active session in another tab logs off immediately.
 * Emails are intentionally NOT stored as permanent blacklists so legitimate users
 * with fresh registrations or re-signups are never blocked from logging in.
 */
export function recordCustomerAsDeleted(id?: string, email?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = (id || '').trim();
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanId && !cleanEmail) return;

  try {
    if (cleanId) {
      const ids = readIdSet(DELETED_CUSTOMER_IDS_KEY);
      ids.add(cleanId);
      writeIdSet(DELETED_CUSTOMER_IDS_KEY, ids);
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
 */
export function isCustomerRecordedAsDeleted(id?: string, _email?: string): boolean {
  if (typeof window === 'undefined') return false;
  const cleanId = id ? String(id).trim() : '';
  if (!cleanId) return false;

  const ids = readIdSet(DELETED_CUSTOMER_IDS_KEY);
  return ids.has(cleanId);
}

/**
 * Unrecords a customer ID when saving/creating a fresh customer record.
 */
export function unrecordCustomerAsDeleted(id?: string, _email?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = id ? String(id).trim() : '';
  if (!cleanId) return;

  try {
    const ids = readIdSet(DELETED_CUSTOMER_IDS_KEY);
    ids.delete(cleanId);
    writeIdSet(DELETED_CUSTOMER_IDS_KEY, ids);
  } catch {}
}

// --------------------------------------------------------------------------
// Order / Pending Invoice Deletion Tombstones
// --------------------------------------------------------------------------

export function getDeletedOrderIds(): Set<string> {
  return readIdSet(DELETED_ORDER_IDS_KEY);
}

export function recordOrderAsDeleted(orderId?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = (orderId || '').trim();
  if (!cleanId) return;
  const ids = readIdSet(DELETED_ORDER_IDS_KEY);
  ids.add(cleanId);
  writeIdSet(DELETED_ORDER_IDS_KEY, ids);
}

export function isOrderRecordedAsDeleted(orderId?: string): boolean {
  if (typeof window === 'undefined') return false;
  const cleanId = (orderId || '').trim();
  if (!cleanId) return false;
  return readIdSet(DELETED_ORDER_IDS_KEY).has(cleanId);
}

export function unrecordOrderAsDeleted(orderId?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = (orderId || '').trim();
  if (!cleanId) return;
  const ids = readIdSet(DELETED_ORDER_IDS_KEY);
  ids.delete(cleanId);
  writeIdSet(DELETED_ORDER_IDS_KEY, ids);
}

// --------------------------------------------------------------------------
// Corporate Account Deletion Tombstones
// --------------------------------------------------------------------------

export function getDeletedCorporateIds(): Set<string> {
  return readIdSet(DELETED_CORPORATE_IDS_KEY);
}

export function recordCorporateAsDeleted(corpId?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = (corpId || '').trim();
  if (!cleanId) return;
  const ids = readIdSet(DELETED_CORPORATE_IDS_KEY);
  ids.add(cleanId);
  writeIdSet(DELETED_CORPORATE_IDS_KEY, ids);
}

export function isCorporateRecordedAsDeleted(corpId?: string): boolean {
  if (typeof window === 'undefined') return false;
  const cleanId = (corpId || '').trim();
  if (!cleanId) return false;
  return readIdSet(DELETED_CORPORATE_IDS_KEY).has(cleanId);
}

export function unrecordCorporateAsDeleted(corpId?: string): void {
  if (typeof window === 'undefined') return;
  const cleanId = (corpId || '').trim();
  if (!cleanId) return;
  const ids = readIdSet(DELETED_CORPORATE_IDS_KEY);
  ids.delete(cleanId);
  writeIdSet(DELETED_CORPORATE_IDS_KEY, ids);
}
