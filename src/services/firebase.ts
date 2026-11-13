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
import {
  CustomerRecord,
  WaitlistLead,
  ActiveSessionRecord,
  CorporateAccount,
  CorporateEmployeeRecord,
  MenuShowcaseItem,
} from '../types';
import {
  recordCustomerAsDeleted,
  isCustomerRecordedAsDeleted,
  unrecordCustomerAsDeleted,
} from '../utils/customerDeletions';

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
    phone: data.phone.trim() || '+234 903 955 7219',
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

  // If Firebase user exists but customer document was deleted by admin, sign out Firebase auth user
  if (fbUser && !customer) {
    try {
      await fbSignOut(auth);
    } catch {}
  }

  const notFoundErr = new Error('No active subscriber account found with this email. This credential is no longer active.');
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
    await setDoc(custRef, sanitizeForFirestore(payload), { merge: true });
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
      phone: user.phoneNumber || '+234 903 955 7219',
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
  // If customer is being saved/created, clear any previous deletion markers for this id/email
  unrecordCustomerAsDeleted(customer.id, customer.email);

  try {
    const cleanCustomer = sanitizeForFirestore(customer);
    const custRef = doc(db, 'customers', customer.id);
    await setDoc(custRef, cleanCustomer, { merge: true });
    await deleteDoc(doc(db, 'deletedCustomerRecords', customer.id)).catch(() => {});
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `customers/${customer.id}`);
  }
}

/**
 * Delete Customer from Firestore (and purges any duplicate documents & active sessions for this account)
 */
export async function deleteCustomerFromFirestore(customerId: string, customerEmail?: string): Promise<void> {
  recordCustomerAsDeleted(customerId, customerEmail);

  try {
    const custRef = doc(db, 'customers', customerId);
    await deleteDoc(custRef);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `customers/${customerId}`);
  }

  // Also query and remove any customer docs, orders, and credit redemptions with this email
  if (customerEmail) {
    try {
      const cleanEmail = customerEmail.trim().toLowerCase();
      const q = query(collection(db, 'customers'), where('email', '==', cleanEmail));
      const snaps = await getDocs(q);
      for (const d of snaps.docs) {
        if (d.id !== customerId) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }

      // Purge orders for this email
      const qOrders = query(collection(db, 'orders'), where('email', '==', cleanEmail));
      const snapsOrders = await getDocs(qOrders);
      for (const d of snapsOrders.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }

      // Purge creditRedemptions for this email
      const qCredits = query(collection(db, 'creditRedemptions'), where('email', '==', cleanEmail));
      const snapsCredits = await getDocs(qCredits);
      for (const d of snapsCredits.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }

      // Purge waitlist entries for this email
      const qWaitlist = query(collection(db, 'waitlist'), where('email', '==', cleanEmail));
      const snapsWaitlist = await getDocs(qWaitlist);
      for (const d of snapsWaitlist.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    } catch (e) {
      console.warn('[Firebase] Delete customer related docs notice:', e);
    }
  }

  // Purge any active session documents in Firestore so user cannot resume
  try {
    await deleteDoc(doc(db, 'sessions', customerId)).catch(() => {});
    if (customerEmail) {
      await deleteDoc(doc(db, 'sessions', customerEmail.trim().toLowerCase())).catch(() => {});
    }
  } catch {}

  // Worldwide instant deletion tombstone marker in Firestore
  try {
    await setDoc(
      doc(db, 'deletedCustomerRecords', customerId),
      sanitizeForFirestore({
        id: customerId,
        email: customerEmail ? customerEmail.trim().toLowerCase() : '',
        deletedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.warn('[Firebase] Save deletion tombstone notice:', err);
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
 * Save Tiered Pricing Settings to Firestore
 */
export async function savePricingSettingsToFirestore(settings: any): Promise<void> {
  try {
    const settingsRef = doc(db, 'settings', 'pricing');
    await setDoc(settingsRef, sanitizeForFirestore(settings), { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, 'settings/pricing');
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
 * Subscribe to Pricing Settings from Firestore
 */
export function subscribeToPricingSettingsFirestore(
  callback: (settings: any) => void
): () => void {
  return onSnapshot(
    doc(db, 'settings', 'pricing'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.fiveDaysFlatTotal === 'number') {
          callback(data);
        }
      }
    },
    (err) => {
      console.warn('[Firebase onSnapshot pricing settings error]:', err);
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
 * Mark Order as Confirmed in Firestore so changes persist across all clients & reloads
 */
export async function confirmOrderInFirestore(orderId: string): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(
      orderRef,
      {
        paymentStatus: 'Confirmed',
        confirmedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log('[Firebase] Order payment confirmed in Firestore:', orderId);
  } catch (e) {
    console.error('[Firebase] Failed to confirm order in Firestore:', e);
    handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
  }
}

/**
 * Save Credit Redemption to Firestore
 */
export async function saveCreditRedemptionToFirestore(redemption: any): Promise<void> {
  try {
    const clean = sanitizeForFirestore(redemption);
    const redRef = doc(db, 'credit_redemptions', redemption.id);
    await setDoc(redRef, clean, { merge: true });
    console.log('[Firebase] Credit redemption persisted to Firestore:', redemption.id);
  } catch (e) {
    console.error('[Firebase] Failed to save credit redemption to Firestore:', e);
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
    // 1. Save each individual meal into the dedicated /meals/{dateStr} collection with full image preservation
    for (const [dateStr, meal] of Object.entries(overrides)) {
      if (meal && typeof meal === 'object') {
        await saveMealToFirestore(dateStr, meal);
      }
    }

    // 2. Also save an index in settings/menu for fast bulk loading
    const lightweightOverrides: Record<string, any> = {};
    for (const [k, meal] of Object.entries(overrides)) {
      if (!meal || typeof meal !== 'object') continue;
      const cleanMeal = { ...meal };
      // If image is a massive data URL (>100KB), keep lightweight in settings/menu doc, but it is already fully saved in /meals/{dateStr}
      if (typeof cleanMeal.imageUrl === 'string' && cleanMeal.imageUrl.startsWith('data:image/') && cleanMeal.imageUrl.length > 80000) {
        cleanMeal.imageUrl = cleanMeal.imageUrl.substring(0, 100) + '...';
      }
      lightweightOverrides[k] = cleanMeal;
    }

    const cleanOverrides = sanitizeForFirestore(lightweightOverrides);
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
 * Save an individual Meal to Firestore collection /meals/{dateStr}
 * Stores the full image data URL so every device on any network/domain receives the image in real time.
 */
export async function saveMealToFirestore(dateStr: string, meal: any): Promise<void> {
  if (!dateStr || !meal) return;
  try {
    const mealPayload = sanitizeForFirestore({
      id: meal.id || `meal-${dateStr}`,
      dateStr,
      day: meal.day || '',
      mealName: meal.mealName || '',
      mealCategory: meal.mealCategory || '',
      price: meal.price || 2900,
      imageUrl: meal.imageUrl || '',
      hasCustomImage: Boolean(meal.imageUrl),
      isHoliday: Boolean(meal.isHoliday),
      isNoDelivery: Boolean(meal.isNoDelivery),
      holidayName: meal.holidayName || '',
      hasDualOptions: Boolean(meal.hasDualOptions),
      mealOptions: meal.mealOptions || null,
      option1: meal.option1 || (meal.mealOptions?.[0]?.name ?? ''),
      option2: meal.option2 || (meal.mealOptions?.[1]?.name ?? ''),
      option1IsSwallow: Boolean(meal.option1IsSwallow),
      option2IsSwallow: Boolean(meal.option2IsSwallow),
      isSwallow: Boolean(meal.isSwallow),
      swallowOptions: meal.swallowOptions || null,
      ingredients: meal.ingredients || [],
      updatedAt: new Date().toISOString(),
    });

    const mealDocRef = doc(db, 'meals', dateStr);
    await setDoc(mealDocRef, mealPayload, { merge: true });
    console.log(`[Firebase] Meal ${dateStr} saved to /meals collection in real time with image:`, Boolean(meal.imageUrl));
  } catch (e) {
    console.error(`[Firebase] Failed to save meal ${dateStr} to Firestore:`, e);
    handleFirestoreError(e, OperationType.WRITE, `meals/${dateStr}`);
  }
}

/**
 * Real-time subscription to /meals collection via onSnapshot.
 * Triggers instantly across all devices whenever an admin updates any food name or image.
 */
export function subscribeToMeals(
  callback: (mealsMap: Record<string, any>) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    collection(db, 'meals'),
    (snapshot) => {
      const mealsMap: Record<string, any> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const dateStr = data.dateStr || docSnap.id;
        mealsMap[dateStr] = {
          ...data,
          dateStr,
        };
      });
      callback(mealsMap);
    },
    (err) => {
      console.warn('[Firebase onSnapshot meals collection error]:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch all meals from Firestore /meals collection on initial load
 */
export async function getAllMealsFromFirestore(): Promise<Record<string, any>> {
  const mealsMap: Record<string, any> = {};
  try {
    const snap = await getDocs(collection(db, 'meals'));
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const dateStr = data.dateStr || docSnap.id;
      mealsMap[dateStr] = {
        ...data,
        dateStr,
      };
    });
  } catch (err) {
    console.warn('[Firebase getAllMealsFromFirestore notice]:', err);
  }
  return mealsMap;
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

/**
 * Claim an active session in Firestore for single concurrent session enforcement
 */
export async function saveSessionToFirestore(session: ActiveSessionRecord): Promise<void> {
  try {
    const sessionRef = doc(db, 'sessions', session.userId);
    const clean = sanitizeForFirestore(session);
    await setDoc(sessionRef, clean, { merge: true });
  } catch (err) {
    console.warn('[Firebase saveSessionToFirestore notice]:', err);
  }
}

/**
 * Real-time listener for active session conflict detection
 */
export function subscribeToSessionInFirestore(
  userId: string,
  callback: (session: ActiveSessionRecord | null) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    doc(db, 'sessions', userId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ActiveSessionRecord;
        callback(data);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('[Firebase subscribeToSessionInFirestore notice]:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Release active session from Firestore upon intentional logout
 */
export async function releaseSessionInFirestore(userId: string, activeSessionId: string): Promise<void> {
  try {
    const sessionRef = doc(db, 'sessions', userId);
    const snap = await getDoc(sessionRef);
    if (snap.exists() && snap.data()?.activeSessionId === activeSessionId) {
      await deleteDoc(sessionRef);
    }
  } catch (err) {
    console.warn('[Firebase releaseSessionInFirestore notice]:', err);
  }
}

// --------------------------------------------------------------------------
// Corporate Meal Subscription ("Your Boss Will Pay") Firestore Operations
// --------------------------------------------------------------------------

const LOCAL_CORP_ACCOUNTS_KEY = '11to12_corporate_accounts_v1';
const LOCAL_CORP_EMPLOYEES_KEY = '11to12_corporate_employees_v1';

export function getLocalCorporateAccounts(): CorporateAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CORP_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLocalCorporateEmployees(): CorporateEmployeeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CORP_EMPLOYEES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function cacheCorporateAccountLocally(account: CorporateAccount) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalCorporateAccounts().filter((a) => a.id !== account.id);
    localStorage.setItem(LOCAL_CORP_ACCOUNTS_KEY, JSON.stringify([account, ...current]));
  } catch {}
}

function cacheCorporateEmployeeLocally(emp: CorporateEmployeeRecord) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalCorporateEmployees().filter((e) => e.id !== emp.id);
    localStorage.setItem(LOCAL_CORP_EMPLOYEES_KEY, JSON.stringify([emp, ...current]));
  } catch {}
}

export async function saveCorporateAccountToFirestore(account: CorporateAccount): Promise<void> {
  cacheCorporateAccountLocally(account);
  try {
    const clean = sanitizeForFirestore(account);
    await setDoc(doc(db, 'corporateAccounts', account.id), clean, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `corporateAccounts/${account.id}`);
  }
}

export async function getCorporateAccountByInviteCode(inviteCode: string): Promise<CorporateAccount | null> {
  const cleanCode = inviteCode.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const q = query(collection(db, 'corporateAccounts'), where('inviteCode', '==', cleanCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const account = snap.docs[0].data() as CorporateAccount;
      cacheCorporateAccountLocally(account);
      return account;
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'corporateAccounts');
  }

  return getLocalCorporateAccounts().find((a) => a.inviteCode.toUpperCase() === cleanCode) || null;
}

export async function getCorporateAccountByAccessCodeOrEmail(identifier: string): Promise<CorporateAccount | null> {
  const clean = identifier.trim();
  if (!clean) return null;
  const upper = clean.toUpperCase();
  const lower = clean.toLowerCase();

  try {
    const snap = await getDocs(collection(db, 'corporateAccounts'));
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as CorporateAccount;
      if (
        data.accessCode?.toUpperCase() === upper ||
        data.inviteCode?.toUpperCase() === upper ||
        data.adminEmail?.toLowerCase() === lower
      ) {
        cacheCorporateAccountLocally(data);
        return data;
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'corporateAccounts');
  }

  return (
    getLocalCorporateAccounts().find(
      (a) =>
        a.accessCode?.toUpperCase() === upper ||
        a.inviteCode?.toUpperCase() === upper ||
        a.adminEmail?.toLowerCase() === lower
    ) || null
  );
}

export function subscribeToCorporateAccount(
  corporateId: string,
  callback: (account: CorporateAccount | null) => void
): () => void {
  return onSnapshot(
    doc(db, 'corporateAccounts', corporateId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as CorporateAccount;
        cacheCorporateAccountLocally(data);
        callback(data);
      }
    },
    (err) => {
      console.warn('[Firebase subscribeToCorporateAccount notice]:', err);
    }
  );
}

export async function saveCorporateEmployeeToFirestore(employee: CorporateEmployeeRecord): Promise<void> {
  cacheCorporateEmployeeLocally(employee);
  try {
    const clean = sanitizeForFirestore(employee);
    await setDoc(doc(db, 'corporateEmployees', employee.id), clean, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `corporateEmployees/${employee.id}`);
  }
}

export function subscribeToCorporateEmployees(
  corporateId: string,
  callback: (employees: CorporateEmployeeRecord[]) => void
): () => void {
  const q = query(collection(db, 'corporateEmployees'), where('corporateId', '==', corporateId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CorporateEmployeeRecord[] = snapshot.docs.map((d) => ({
        ...(d.data() as CorporateEmployeeRecord),
        id: d.id,
      }));
      list.forEach(cacheCorporateEmployeeLocally);
      callback(list.sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || '')));
    },
    (err) => {
      console.warn('[Firebase subscribeToCorporateEmployees notice]:', err);
      const localList = getLocalCorporateEmployees().filter((e) => e.corporateId === corporateId);
      callback(localList);
    }
  );
}

export function subscribeToAllCorporateAccounts(
  callback: (accounts: CorporateAccount[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'corporateAccounts'),
    (snapshot) => {
      const list: CorporateAccount[] = snapshot.docs.map((d) => ({
        ...(d.data() as CorporateAccount),
        id: d.id,
      }));
      list.forEach(cacheCorporateAccountLocally);
      callback(list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    },
    (err) => {
      console.warn('[Firebase subscribeToAllCorporateAccounts notice]:', err);
      callback(getLocalCorporateAccounts());
    }
  );
}

export function subscribeToAllCorporateEmployees(
  callback: (employees: CorporateEmployeeRecord[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'corporateEmployees'),
    (snapshot) => {
      const list: CorporateEmployeeRecord[] = snapshot.docs.map((d) => ({
        ...(d.data() as CorporateEmployeeRecord),
        id: d.id,
      }));
      list.forEach(cacheCorporateEmployeeLocally);
      callback(list.sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || '')));
    },
    (err) => {
      console.warn('[Firebase subscribeToAllCorporateEmployees notice]:', err);
      callback(getLocalCorporateEmployees());
    }
  );
}

export async function confirmCorporateAccountAndOrder(account: CorporateAccount): Promise<CorporateAccount> {
  const confirmedAt = new Date().toISOString();
  const updatedAccount: CorporateAccount = {
    ...account,
    paymentStatus: 'Confirmed',
    confirmedAt,
  };
  await saveCorporateAccountToFirestore(updatedAccount);

  // Confirm any matching corporate order in /orders collection
  try {
    const q = query(collection(db, 'orders'), where('memberCode', '==', account.inviteCode));
    const snap = await getDocs(q);
    for (const orderDoc of snap.docs) {
      await setDoc(
        doc(db, 'orders', orderDoc.id),
        { paymentStatus: 'Confirmed', confirmedAt },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('[Firebase confirmCorporateAccountAndOrder orders notice]:', err);
  }

  return updatedAccount;
}

export async function claimCorporateEmployeeSlotAndSave(
  corporateAccount: CorporateAccount,
  employeeRecord: CorporateEmployeeRecord,
  customerRecord: CustomerRecord
): Promise<{ updatedAccount: CorporateAccount; usedSlots: number }> {
  let latestAccount = corporateAccount;
  let liveEmployeesCount = 0;

  try {
    const acctSnap = await getDoc(doc(db, 'corporateAccounts', corporateAccount.id));
    if (acctSnap.exists()) {
      latestAccount = { ...(acctSnap.data() as CorporateAccount), id: acctSnap.id };
    }

    const empSnap = await getDocs(
      query(collection(db, 'corporateEmployees'), where('corporateId', '==', corporateAccount.id))
    );
    liveEmployeesCount = empSnap.size;
  } catch (err) {
    console.warn('[Firebase claimCorporateEmployeeSlotAndSave check notice]:', err);
    liveEmployeesCount = getLocalCorporateEmployees().filter(
      (e) => e.corporateId === corporateAccount.id
    ).length;
  }

  if (latestAccount.paymentStatus !== 'Confirmed') {
    const err = new Error('CORP_PENDING_CONFIRMATION');
    throw err;
  }

  const effectiveUsedSlots = Math.max(latestAccount.usedSlots || 0, liveEmployeesCount);
  if (effectiveUsedSlots >= latestAccount.totalEmployees) {
    const err = new Error('CORP_SLOTS_FULL');
    throw err;
  }

  const nextUsedSlots = effectiveUsedSlots + 1;
  const nextUsedCredits = Math.min(
    latestAccount.totalMealCredits,
    (latestAccount.usedMealCredits || 0) + (employeeRecord.selectedDays?.length || 0)
  );

  await saveCorporateEmployeeToFirestore(employeeRecord);

  const updatedAccount: CorporateAccount = {
    ...latestAccount,
    usedSlots: nextUsedSlots,
    usedMealCredits: nextUsedCredits,
  };
  await saveCorporateAccountToFirestore(updatedAccount);
  await saveCustomerToFirestore(customerRecord);

  return { updatedAccount, usedSlots: nextUsedSlots };
}

/**
 * Checks Firestore across active customers, corporate employees, and optionally orders/waitlist
 * to strictly prevent registering an already-used email address.
 */
export async function isEmailAlreadyRegisteredInFirestore(
  email: string,
  options?: {
    excludeCustomerId?: string;
    includeWaitlist?: boolean;
    includeOrders?: boolean;
  }
): Promise<{ exists: boolean; source?: 'customers' | 'corporateEmployees' | 'orders' | 'waitlist'; reason?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return { exists: false };

  try {
    // 1. Check active customers
    const custSnap = await getDocs(query(collection(db, 'customers'), where('email', '==', cleanEmail)));
    for (const d of custSnap.docs) {
      const data = d.data() as CustomerRecord;
      if (options?.excludeCustomerId && d.id === options.excludeCustomerId) continue;
      if (isCustomerRecordedAsDeleted(d.id, cleanEmail)) continue;
      if ((data.email || '').trim().toLowerCase() === cleanEmail) {
        return {
          exists: true,
          source: 'customers',
          reason: `The email ${cleanEmail} is already registered as a customer account.`,
        };
      }
    }

    // 2. Check corporate employees
    const empSnap = await getDocs(query(collection(db, 'corporateEmployees'), where('email', '==', cleanEmail)));
    for (const d of empSnap.docs) {
      const data = d.data() as CorporateEmployeeRecord;
      if (options?.excludeCustomerId && d.id === options.excludeCustomerId) continue;
      if ((data.email || '').trim().toLowerCase() === cleanEmail) {
        return {
          exists: true,
          source: 'corporateEmployees',
          reason: `The email ${cleanEmail} is already registered under a company meal plan.`,
        };
      }
    }

    // 3. Check pending/active orders
    if (options?.includeOrders) {
      const ordSnap = await getDocs(query(collection(db, 'orders'), where('email', '==', cleanEmail)));
      for (const d of ordSnap.docs) {
        const data = d.data() as any;
        if ((data.email || '').trim().toLowerCase() === cleanEmail) {
          return {
            exists: true,
            source: 'orders',
            reason: `The email ${cleanEmail} already has a submitted order in our system.`,
          };
        }
      }
    }

    // 4. Check waitlist leads
    if (options?.includeWaitlist) {
      const wlSnap = await getDocs(query(collection(db, 'waitlist'), where('email', '==', cleanEmail)));
      for (const d of wlSnap.docs) {
        const data = d.data() as any;
        if ((data.email || '').trim().toLowerCase() === cleanEmail) {
          return {
            exists: true,
            source: 'waitlist',
            reason: `The email ${cleanEmail} is already registered on our Desk Drop list.`,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Firebase isEmailAlreadyRegisteredInFirestore notice]:', err);
  }

  return { exists: false };
}

/**
 * Deletes a corporate employee record from Firestore & local cache, recomputes the company's
 * usedSlots and usedMealCredits so the slot immediately becomes available again.
 */
export async function deleteCorporateEmployeeAndFreeSlot(
  account: CorporateAccount,
  employee: CorporateEmployeeRecord
): Promise<CorporateAccount> {
  // 1. Remove from local employees cache
  if (typeof window !== 'undefined') {
    try {
      const remainingLocal = getLocalCorporateEmployees().filter((e) => e.id !== employee.id);
      localStorage.setItem(LOCAL_CORP_EMPLOYEES_KEY, JSON.stringify(remainingLocal));
    } catch {}
  }

  // 2. Delete corporateEmployees document from Firestore
  try {
    await deleteDoc(doc(db, 'corporateEmployees', employee.id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `corporateEmployees/${employee.id}`);
  }

  // 3. Recompute live remaining slots & meal credits from Firestore
  let latestAccount = account;
  let remainingEmps: CorporateEmployeeRecord[] = [];
  try {
    const acctSnap = await getDoc(doc(db, 'corporateAccounts', account.id));
    if (acctSnap.exists()) {
      latestAccount = { ...(acctSnap.data() as CorporateAccount), id: acctSnap.id };
    }
    const empSnap = await getDocs(
      query(collection(db, 'corporateEmployees'), where('corporateId', '==', account.id))
    );
    remainingEmps = empSnap.docs
      .filter((d) => d.id !== employee.id)
      .map((d) => ({ ...(d.data() as CorporateEmployeeRecord), id: d.id }));
  } catch (err) {
    console.warn('[Firebase deleteCorporateEmployeeAndFreeSlot recompute notice]:', err);
    remainingEmps = getLocalCorporateEmployees().filter(
      (e) => e.corporateId === account.id && e.id !== employee.id
    );
  }

  const nextUsedSlots = remainingEmps.length;
  const nextUsedCredits = remainingEmps.reduce(
    (sum, emp) => sum + (emp.selectedDays?.length || 0),
    0
  );

  const updatedAccount: CorporateAccount = {
    ...latestAccount,
    usedSlots: nextUsedSlots,
    usedMealCredits: nextUsedCredits,
  };

  await saveCorporateAccountToFirestore(updatedAccount);
  return updatedAccount;
}

/**
 * Removes any corporateEmployees entries linked to a deleted customer (by email or corporateId)
 * and restores the company's slot count cleanly.
 */
export async function removeEmployeeFromCorporateByCustomer(
  customerId?: string,
  customerEmail?: string,
  corporateIdHint?: string
): Promise<void> {
  const cleanEmail = (customerEmail || '').trim().toLowerCase();
  if (!cleanEmail && !corporateIdHint) return;

  try {
    const matches: CorporateEmployeeRecord[] = [];
    if (cleanEmail) {
      const qByEmail = query(collection(db, 'corporateEmployees'), where('email', '==', cleanEmail));
      const snap = await getDocs(qByEmail);
      snap.docs.forEach((d) => {
        matches.push({ ...(d.data() as CorporateEmployeeRecord), id: d.id });
      });
    }

    // Also inspect local cache if Firestore missed any offline entries
    const localMatches = getLocalCorporateEmployees().filter(
      (e) =>
        (cleanEmail && (e.email || '').trim().toLowerCase() === cleanEmail) ||
        (customerId && e.id === customerId)
    );
    localMatches.forEach((lm) => {
      if (!matches.some((m) => m.id === lm.id)) {
        matches.push(lm);
      }
    });

    for (const emp of matches) {
      let parentAcct: CorporateAccount | null =
        getLocalCorporateAccounts().find((a) => a.id === emp.corporateId) || null;
      if (!parentAcct) {
        const acctSnap = await getDoc(doc(db, 'corporateAccounts', emp.corporateId));
        if (acctSnap.exists()) {
          parentAcct = { ...(acctSnap.data() as CorporateAccount), id: acctSnap.id };
        }
      }
      if (parentAcct) {
        await deleteCorporateEmployeeAndFreeSlot(parentAcct, emp);
      } else {
        await deleteDoc(doc(db, 'corporateEmployees', emp.id)).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[Firebase removeEmployeeFromCorporateByCustomer notice]:', err);
  }
}

// --------------------------------------------------------------------------
// Homepage Menu Showcase ("See what is on the menu") Firestore Operations
// --------------------------------------------------------------------------

const LOCAL_MENU_SHOWCASE_KEY = '11to12_menu_showcase_items_v1';

export function getLocalMenuShowcaseMap(): Record<string, MenuShowcaseItem> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_MENU_SHOWCASE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalMenuShowcaseMap(map: Record<string, MenuShowcaseItem>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_MENU_SHOWCASE_KEY, JSON.stringify(map));
  } catch {}
}

export async function saveMenuShowcaseItemToFirestore(item: MenuShowcaseItem): Promise<void> {
  const current = getLocalMenuShowcaseMap();
  const nextItem: MenuShowcaseItem = {
    ...item,
    updatedAt: new Date().toISOString(),
  };
  current[item.id] = nextItem;
  saveLocalMenuShowcaseMap(current);
  window.dispatchEvent(new CustomEvent('11to12_menu_showcase_updated'));

  try {
    const clean = sanitizeForFirestore(nextItem);
    await setDoc(doc(db, 'menuShowcase', item.id), clean, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `menuShowcase/${item.id}`);
  }
}

export async function deleteMenuShowcaseItemFromFirestore(itemId: string): Promise<void> {
  const current = getLocalMenuShowcaseMap();
  delete current[itemId];
  saveLocalMenuShowcaseMap(current);
  window.dispatchEvent(new CustomEvent('11to12_menu_showcase_updated'));

  try {
    await deleteDoc(doc(db, 'menuShowcase', itemId));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `menuShowcase/${itemId}`);
  }
}

export function subscribeToMenuShowcase(
  callback: (itemsMap: Record<string, MenuShowcaseItem>) => void
): () => void {
  const unsub = onSnapshot(
    collection(db, 'menuShowcase'),
    (snapshot) => {
      const remoteMap: Record<string, MenuShowcaseItem> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as MenuShowcaseItem;
        remoteMap[docSnap.id] = {
          ...data,
          id: docSnap.id,
        };
      });
      saveLocalMenuShowcaseMap(remoteMap);
      callback(remoteMap);
    },
    (err) => {
      console.warn('[Firebase subscribeToMenuShowcase notice]:', err);
      callback(getLocalMenuShowcaseMap());
    }
  );

  const handleLocalEvent = () => {
    callback(getLocalMenuShowcaseMap());
  };
  window.addEventListener('11to12_menu_showcase_updated', handleLocalEvent);

  return () => {
    unsub();
    window.removeEventListener('11to12_menu_showcase_updated', handleLocalEvent);
  };
}
