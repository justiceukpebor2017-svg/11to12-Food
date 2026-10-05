import { collection, onSnapshot, DocumentChange } from 'firebase/firestore';
import { db } from '../services/firebase';
import { notifyAdminWaitlistJoined, notifyAdminPaymentOrder } from './emailNotifier';
import { WaitlistLead, OrderSubmission } from '../types';

// Keep track of processed IDs in-memory to prevent duplicate emails
const processedDocIds = new Set<string>();
let isWaitlistInitialized = false;
let isOrdersInitialized = false;

/**
 * Marks an ID as already notified (e.g. if the REST endpoint handled it first)
 */
export function markAsNotified(id: string): void {
  if (id) {
    processedDocIds.add(id);
  }
}

/**
 * Starts real-time Firestore listeners for waitlist and orders collections.
 * Even when the frontend is hosted statically (e.g., GitHub Pages or custom domain),
 * any document written to Firestore immediately triggers an instant email to admin@11to12.food.
 */
export function startFirestoreEmailListener(): void {
  try {
    console.log('[Firestore Email Listener] Initializing real-time Firestore listeners...');

    // 1. Listen for new waitlist entries
    const waitlistCollection = collection(db, 'waitlist');
    onSnapshot(
      waitlistCollection,
      (snapshot) => {
        if (!isWaitlistInitialized) {
          // Record existing documents so we don't send emails for historical entries on startup
          snapshot.docs.forEach((docSnap) => processedDocIds.add(docSnap.id));
          isWaitlistInitialized = true;
          console.log(`[Firestore Email Listener] Waitlist initialized with ${snapshot.docs.length} existing records.`);
          return;
        }

        snapshot.docChanges().forEach((change: DocumentChange) => {
          if (change.type === 'added') {
            const docId = change.doc.id;
            if (processedDocIds.has(docId)) {
              return;
            }
            processedDocIds.add(docId);

            const data = change.doc.data();
            const lead: WaitlistLead = {
              id: docId,
              name: data.name || data.fullName || 'Waitlist Subscriber',
              email: data.email || 'subscriber@example.com',
              phone: data.phone || '',
              workplace: data.workplace || data.company || 'Corporate Office',
              addressFloor: data.addressFloor || data.officeAddress || 'Desk Drop',
              createdAt: data.createdAt || new Date().toISOString(),
              status: data.status || 'Waitlisted',
              memberCode: data.memberCode || docId,
              notes: data.notes || '',
            };

            console.log(`[Firestore Email Listener] Detected new waitlist entry in Firestore: ${lead.name} (${docId})`);
            notifyAdminWaitlistJoined(lead).catch((err) => {
              console.error('[Firestore Email Listener] Failed to notify waitlist signup:', err?.message || err);
            });
          }
        });
      },
      (err) => {
        console.warn('[Firestore Email Listener] Waitlist snapshot listener notice:', err?.message || err);
      }
    );

    // 2. Listen for new orders
    const ordersCollection = collection(db, 'orders');
    onSnapshot(
      ordersCollection,
      (snapshot) => {
        if (!isOrdersInitialized) {
          snapshot.docs.forEach((docSnap) => processedDocIds.add(docSnap.id));
          isOrdersInitialized = true;
          console.log(`[Firestore Email Listener] Orders initialized with ${snapshot.docs.length} existing records.`);
          return;
        }

        snapshot.docChanges().forEach((change: DocumentChange) => {
          if (change.type === 'added') {
            const docId = change.doc.id;
            if (processedDocIds.has(docId)) {
              return;
            }
            processedDocIds.add(docId);

            const data = change.doc.data();
            const order: OrderSubmission = {
              id: docId,
              fullName: data.fullName || data.customerName || 'Subscriber',
              email: data.email || '',
              phone: data.phone || '',
              company: data.company || 'Corporate Office',
              officeAddress: data.officeAddress || data.address || 'Desk Drop',
              planName: data.planName || 'Lunch Plan',
              totalDays: data.totalDays || 0,
              subtotalNGN: data.subtotalNGN || 0,
              discountNGN: data.discountNGN || 0,
              finalTotalNGN: data.finalTotalNGN || 0,
              submittedAt: data.submittedAt || data.createdAt || new Date().toISOString(),
              paymentStatus: data.paymentStatus || 'Pending Verification',
              selectedDays: data.selectedDays || [],
              memberCode: data.memberCode,
            };

            console.log(`[Firestore Email Listener] Detected new order in Firestore: ${order.fullName} (${docId})`);
            notifyAdminPaymentOrder(order).catch((err) => {
              console.error('[Firestore Email Listener] Failed to notify order payment:', err?.message || err);
            });
          }
        });
      },
      (err) => {
        console.warn('[Firestore Email Listener] Orders snapshot listener notice:', err?.message || err);
      }
    );
  } catch (error) {
    console.warn('[Firestore Email Listener] Error starting listeners:', error);
  }
}
