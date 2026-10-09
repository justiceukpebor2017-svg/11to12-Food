import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocFromServer,
  Firestore,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CustomerRecord, WaitlistLead } from '../types';

// Set log level to error to avoid noisy debug logs
try {
  setLogLevel('error');
} catch {
  // Ignore in environments where setLogLevel is not supported
}

// Filter benign internal Firestore WebChannel idle stream cancellations
if (typeof console !== 'undefined' && console.error) {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : a?.message || '')).join(' ');
    if (
      msg.includes('Disconnecting idle stream') ||
      msg.includes('Timed out waiting for new targets') ||
      msg.includes("RPC 'Listen' stream")
    ) {
      // Benign keepalive/idle stream management in Firestore client - safely ignored
      return;
    }
    originalConsoleError(...args);
  };
}

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Connect directly to the provisioned database ID
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  fbSignOut as signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
};

export type { User };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.warn('[Firebase Error]:', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot per SKILL.md
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, 'system', 'ping');
    await getDocFromServer(testDocRef);
    return true;
  } catch (e: any) {
    if (e?.code === 'permission-denied' || e?.code === 'not-found') {
      return true;
    }
    console.warn('[Firebase] Connection ping test notice:', e?.message || e);
    return false;
  }
}

// --------------------------------------------------------------------------
// Real Backend Firebase Auth & Profile Synchronization Methods
// --------------------------------------------------------------------------

/**
 * Register a new subscriber using real Firebase Auth and store profile in Firestore
 */
export async function registerSubscriberAccount(data: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  company?: string;
  officeAddress?: string;
  floorSuite?: string;
}): Promise<CustomerRecord> {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanPass = data.password.trim();

  // 1. Create user in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
  const user = userCredential.user;

  // 2. Set Firebase displayName
  if (data.fullName.trim()) {
    try {
      await updateProfile(user, { displayName: data.fullName.trim() });
    } catch (e) {
      console.warn('Failed to update displayName on Firebase user:', e);
    }
  }

  // 3. Create canonical CustomerRecord
  const newCustomer: CustomerRecord = {
    id: user.uid,
    fullName: data.fullName.trim() || 'Office Subscriber',
    email: cleanEmail,
    phone: data.phone.trim() || '0802 618 0680',
    company: data.company?.trim() || 'Victoria Island Office',
    officeAddress: data.officeAddress?.trim() || 'Victoria Island / Ikoyi, Lagos',
    floorSuite: data.floorSuite?.trim() || 'Desk Drop Station',
    status: 'Active',
    paymentStatus: 'Pending Verification',
    planName: 'Standard Workday Lunch Plan',
    totalDays: 20,
    creditsBalance: 0,
    createdAt: new Date().toISOString(),
    isPasswordSet: true,
    selectedDays: [],
    subtotalNGN: 0,
    discountNGN: 0,
    finalTotalNGN: 0,
  };

  // 4. Save directly into Firestore 'customers' collection
  try {
    const customerRef = doc(db, 'customers', user.uid);
    await setDoc(customerRef, newCustomer, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `customers/${user.uid}`);
  }

  return newCustomer;
}

/**
 * Log in a subscriber via real Firebase Auth or verified Firestore/server customer record
 */
export async function loginSubscriberAccount(
  email: string,
  pass: string
): Promise<{ user: User | null; customer: CustomerRecord | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  let fbUser: User | null = null;
  let authFailed = false;

  // 1. Attempt standard Firebase Auth sign-in, safely absorbing auth/operation-not-allowed
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    fbUser = userCredential.user;
  } catch (err: any) {
    authFailed = true;
    console.warn('[Firebase Auth] signInWithEmailAndPassword notice (falling back to database credentials):', err?.code);
  }

  // 2. Fetch customer record from Firestore
  let customer: CustomerRecord | null = null;
  try {
    if (fbUser) {
      const customerRef = doc(db, 'customers', fbUser.uid);
      const snap = await getDoc(customerRef);
      if (snap.exists()) {
        customer = snap.data() as CustomerRecord;
      }
    }

    if (!customer) {
      const q = query(collection(db, 'customers'), where('email', '==', cleanEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        customer = querySnap.docs[0].data() as CustomerRecord;
      }
    }
  } catch (e) {
    console.warn('[Firebase] Firestore lookup notice:', e);
  }

  // 2b. If not found in Firestore yet, check server live database endpoint
  if (!customer) {
    try {
      const resp = await fetch('/api/customers');
      if (resp.ok) {
        const data = await resp.json();
        const list: CustomerRecord[] = data?.customers || [];
        const match = list.find((c) => c.email && c.email.trim().toLowerCase() === cleanEmail);
        if (match) {
          customer = match;
          // Synchronize back to Firestore so future lookups are instantaneous
          saveCustomerToFirestore(match).catch(() => {});
        }
      }
    } catch (apiErr) {
      console.warn('[Firebase] Server /api/customers lookup notice:', apiErr);
    }
  }

  // 3. Fallback verification: Check password if Firebase Auth failed (handles auth/operation-not-allowed)
  if (customer) {
    const isPasswordValid =
      (customer.password && cleanPass === customer.password.trim()) ||
      (customer.defaultPassword && cleanPass === customer.defaultPassword.trim());

    if (isPasswordValid) {
      return { user: fbUser, customer };
    } else {
      const err = new Error('Incorrect password entered. Please verify your credentials or contact 11 to 12 Support.');
      (err as any).code = 'auth/wrong-password';
      throw err;
    }
  }

  if (fbUser && customer) {
    return { user: fbUser, customer };
  }

  const notFoundErr = new Error('No subscriber account found with this email. Only registered subscribers with confirmed reservations can log in.');
  (notFoundErr as any).code = 'auth/user-not-found';
  throw notFoundErr;
}

/**
 * Update subscriber password in Firestore and server across all devices
 */
export async function updateCustomerPasswordInFirestore(customerId: string, newPass: string): Promise<void> {
  const clean = newPass.trim();
  const payload = {
    password: clean,
    defaultPassword: '',
    isDefaultPassword: false,
    mustChangePassword: false,
    isPasswordSet: true,
    passwordLastChangedAt: new Date().toISOString(),
    status: 'Active',
  };

  try {
    const custRef = doc(db, 'customers', customerId);
    await updateDoc(custRef, payload);
  } catch (e) {
    console.warn('[Firebase] updateCustomerPasswordInFirestore warning:', e);
  }

  try {
    await fetch(`/api/customers/${encodeURIComponent(customerId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (serverErr) {
    console.warn('[Firebase] Server sync password update notice:', serverErr);
  }
}

/**
 * Log in using Google Popup via real Firebase Auth
 */
export async function loginWithGoogleAccount(): Promise<{ user: User; customer: CustomerRecord }> {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;
  const googleEmail = (user.email || '').toLowerCase().trim();

  // Check Firestore for existing record
  let customer: CustomerRecord | null = null;
  try {
    const customerRef = doc(db, 'customers', user.uid);
    const snap = await getDoc(customerRef);
    if (snap.exists()) {
      customer = snap.data() as CustomerRecord;
    } else {
      const q = query(collection(db, 'customers'), where('email', '==', googleEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        customer = querySnap.docs[0].data() as CustomerRecord;
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `customers/${user.uid}`);
  }

  if (!customer) {
    // Create new customer record for this Google account
    customer = {
      id: user.uid,
      fullName: user.displayName || 'Google Workspace Subscriber',
      email: googleEmail,
      phone: user.phoneNumber || '0802 618 0680',
      company: 'Corporate Office',
      officeAddress: 'Victoria Island / Ikoyi, Lagos',
      floorSuite: 'Desk Drop',
      status: 'Active',
      paymentStatus: 'Paid',
      planName: 'Google Workspace Subscriber Plan',
      totalDays: 20,
      creditsBalance: 0,
      createdAt: new Date().toISOString(),
      isPasswordSet: true,
      selectedDays: [],
      subtotalNGN: 0,
      discountNGN: 0,
      finalTotalNGN: 0,
    };

    try {
      await setDoc(doc(db, 'customers', user.uid), customer, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `customers/${user.uid}`);
    }
  }

  return { user, customer };
}

/**
 * Send password reset email using Firebase Authentication
 */
export async function sendSubscriberPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  await sendPasswordResetEmail(auth, cleanEmail);
}

/**
 * Sign out of Firebase Authentication
 */
export async function logoutSubscriberAccount(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Recursively strips undefined fields from an object so Firestore setDoc never throws an invalid data error.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean as T;
}

/**
 * Add or update Waitlist Lead in Firestore
 */
export async function saveWaitlistLeadToFirestore(lead: WaitlistLead): Promise<void> {
  try {
    const cleanLead = sanitizeForFirestore({
      ...lead,
      emailStatus: (lead as any).emailStatus || 'pending',
    });
    const leadRef = doc(db, 'waitlist', lead.id);
    await setDoc(leadRef, cleanLead, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `waitlist/${lead.id}`);
  }
}

/**
 * Delete Waitlist Lead from Firestore
 */
export async function deleteWaitlistLeadFromFirestore(leadId: string): Promise<void> {
  try {
    const leadRef = doc(db, 'waitlist', leadId);
    await deleteDoc(leadRef);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `waitlist/${leadId}`);
  }
}

/**
 * Add or update Customer in Firestore (Cross-device and cross-browser persistence)
 */
export async function saveCustomerToFirestore(customer: CustomerRecord): Promise<void> {
  try {
    const cleanCustomer = sanitizeForFirestore(customer);
    const custRef = doc(db, 'customers', customer.id);
    await setDoc(custRef, cleanCustomer, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `customers/${customer.id}`);
  }
}

/**
 * Delete Customer from Firestore
 */
export async function deleteCustomerFromFirestore(customerId: string): Promise<void> {
  try {
    const custRef = doc(db, 'customers', customerId);
    await deleteDoc(custRef);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `customers/${customerId}`);
  }
}

/**
 * Delete Order from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);
    console.log('[Firebase] Order successfully deleted from Firestore:', orderId);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `orders/${orderId}`);
  }
}

/**
 * Save Launch Settings to Firestore
 */
export async function saveLaunchSettingsToFirestore(settings: { launchDate: string; isEnabled: boolean }): Promise<void> {
  try {
    const settingsRef = doc(db, 'settings', 'launch');
    await setDoc(settingsRef, sanitizeForFirestore(settings), { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, 'settings/launch');
  }
}

/**
 * Subscribe to Launch Settings from Firestore
 */
export function subscribeToLaunchSettings(
  callback: (settings: { launchDate: string; isEnabled: boolean }) => void
): () => void {
  return onSnapshot(
    doc(db, 'settings', 'launch'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.launchDate === 'string') {
          callback({
            launchDate: data.launchDate,
            isEnabled: typeof data.isEnabled === 'boolean' ? data.isEnabled : true,
          });
        }
      }
    },
    (err) => {
      console.warn('[Firebase onSnapshot launch settings error]:', err);
    }
  );
}

/**
 * Save Order to Firestore (Sanitizes undefined fields and sets pending emailStatus for instant admin notification)
 */
export async function saveOrderToFirestore(order: any): Promise<void> {
  try {
    const cleanOrder = sanitizeForFirestore({
      ...order,
      emailStatus: order.emailStatus || 'pending',
    });
    const orderRef = doc(db, 'orders', order.id);
    await setDoc(orderRef, cleanOrder, { merge: true });
    console.log('[Firebase] Order successfully persisted to Firestore with pending email status:', order.id);
  } catch (e) {
    console.error('[Firebase] Failed to save order to Firestore:', e);
    handleFirestoreError(e, OperationType.CREATE, `orders/${order.id}`);
  }
}

/**
 * Real-time subscription to Customers collection via onSnapshot.
 * Acts like a security camera: immediately gives current data and
 * automatically pushes any changes from any device directly to the screen.
 */
export function subscribeToCustomers(
  callback: (customers: CustomerRecord[]) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    collection(db, 'customers'),
    (snapshot) => {
      const customers: CustomerRecord[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as CustomerRecord),
        id: docSnap.id,
      }));
      callback(customers);
    },
    (err) => {
      console.warn('[Firebase onSnapshot customers error]:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time subscription to Waitlist collection via onSnapshot.
 */
export function subscribeToWaitlist(
  callback: (leads: WaitlistLead[]) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    collection(db, 'waitlist'),
    (snapshot) => {
      const leads: WaitlistLead[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || data.fullName || 'Office Member',
          email: data.email || '',
          phone: data.phone || '',
          workplace: data.workplace || data.company || 'Corporate Office',
          addressFloor: data.addressFloor || data.officeAddress || 'Desk Drop',
          createdAt: data.createdAt || data.joinedAt || new Date().toISOString(),
          status: data.status || 'Waitlisted',
          memberCode: data.memberCode || d.id,
          notes: data.notes || data.dietaryNotes || '',
        };
      });
      callback(leads);
    },
    (err) => {
      console.warn('[Firebase onSnapshot waitlist error]:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time subscription to Orders collection via onSnapshot.
 */
export function subscribeToOrders(
  callback: (orders: any[]) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    collection(db, 'orders'),
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      }));
      callback(orders);
    },
    (err) => {
      console.warn('[Firebase onSnapshot orders error]:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save Meal Overrides to Firestore (Synchronizes across all devices worldwide)
 */
export async function saveMenuOverridesToFirestore(
  overrides: Record<string, any>
): Promise<void> {
  try {
    const cleanOverrides = sanitizeForFirestore(overrides);
    const menuRef = doc(db, 'settings', 'menu');
    await setDoc(menuRef, {
      overrides: cleanOverrides,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('[Firebase] Menu overrides saved to Firestore successfully across devices');
  } catch (e) {
    console.error('[Firebase] Failed to save menu overrides to Firestore:', e);
  }
}

/**
 * Real-time subscription to Menu Overrides via onSnapshot.
 * Syncs menu updates in real-time across all devices worldwide.
 */
export function subscribeToMenuOverrides(
  callback: (overrides: Record<string, any>) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    doc(db, 'settings', 'menu'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.overrides && typeof data.overrides === 'object') {
          callback(data.overrides);
        }
      }
    },
    (err) => {
      console.warn('[Firebase onSnapshot menu overrides notice]:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Directly fetch latest Menu Overrides from Firestore on app load
 */
export async function getMenuOverridesFromFirestore(): Promise<Record<string, any> | null> {
  try {
    const menuRef = doc(db, 'settings', 'menu');
    const docSnap = await getDoc(menuRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.overrides && typeof data.overrides === 'object') {
        return data.overrides;
      }
    }
  } catch (err) {
    console.warn('[Firebase getMenuOverridesFromFirestore notice]:', err);
  }
  return null;
}



