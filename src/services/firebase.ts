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
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CustomerRecord, WaitlistLead } from '../types';

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
 * Log in a subscriber via real Firebase Auth and retrieve profile from Firestore
 */
export async function loginSubscriberAccount(
  email: string,
  pass: string
): Promise<{ user: User; customer: CustomerRecord | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
  const user = userCredential.user;

  // Fetch customer record from Firestore
  let customer: CustomerRecord | null = null;
  try {
    const customerRef = doc(db, 'customers', user.uid);
    const snap = await getDoc(customerRef);
    if (snap.exists()) {
      customer = snap.data() as CustomerRecord;
    } else {
      // Check if document exists with email
      const q = query(collection(db, 'customers'), where('email', '==', cleanEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        customer = querySnap.docs[0].data() as CustomerRecord;
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `customers/${user.uid}`);
  }

  return { user, customer };
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
 * Add or update Waitlist Lead in Firestore
 */
export async function saveWaitlistLeadToFirestore(lead: WaitlistLead): Promise<void> {
  try {
    const leadRef = doc(db, 'waitlist', lead.id);
    await setDoc(leadRef, lead, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `waitlist/${lead.id}`);
  }
}

