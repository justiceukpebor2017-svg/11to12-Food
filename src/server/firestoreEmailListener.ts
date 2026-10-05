import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { notifyAdminWaitlistJoined, notifyAdminPaymentOrder } from './emailNotifier';
import { WaitlistLead, OrderSubmission } from '../types';

// Keep track of processed IDs in-memory to prevent duplicate emails
const processedDocIds = new Set<string>();
let isWaitlistInitialized = false;
let isOrdersInitialized = false;
let pollTimer: NodeJS.Timeout | null = null;

/**
 * Marks an ID as already notified (e.g. if the REST endpoint handled it first)
 */
export function markAsNotified(id: string): void {
  if (id) {
    processedDocIds.add(id);
  }
}

async function checkWaitlist(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'waitlist'));
    if (!isWaitlistInitialized) {
      snap.docs.forEach((d) => processedDocIds.add(d.id));
      isWaitlistInitialized = true;
      console.log(`[Firestore Email Poller] Initialized waitlist with ${snap.docs.length} existing records.`);
      return;
    }

    for (const d of snap.docs) {
      if (!processedDocIds.has(d.id)) {
        processedDocIds.add(d.id);
        const data = d.data();
        const lead: WaitlistLead = {
          id: d.id,
          name: data.name || data.fullName || 'Waitlist Subscriber',
          email: data.email || 'subscriber@example.com',
          phone: data.phone || '',
          workplace: data.workplace || data.company || 'Corporate Office',
          addressFloor: data.addressFloor || data.officeAddress || 'Desk Drop',
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || 'Waitlisted',
          memberCode: data.memberCode || d.id,
          notes: data.notes || '',
        };

        console.log(`[Firestore Email Poller] Detected new waitlist lead in Firestore: ${lead.name} (${d.id})`);
        notifyAdminWaitlistJoined(lead).catch((err) => {
          console.error('[Firestore Email Poller] Failed to notify waitlist signup:', err?.message || err);
        });
      }
    }
  } catch (err: any) {
    // Non-blocking catch
  }
}

async function checkOrders(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    if (!isOrdersInitialized) {
      snap.docs.forEach((d) => processedDocIds.add(d.id));
      isOrdersInitialized = true;
      console.log(`[Firestore Email Poller] Initialized orders with ${snap.docs.length} existing records.`);
      return;
    }

    for (const d of snap.docs) {
      if (!processedDocIds.has(d.id)) {
        processedDocIds.add(d.id);
        const data = d.data();
        const order: OrderSubmission = {
          id: d.id,
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

        console.log(`[Firestore Email Poller] Detected new order in Firestore: ${order.fullName} (${d.id})`);
        notifyAdminPaymentOrder(order).catch((err) => {
          console.error('[Firestore Email Poller] Failed to notify order payment:', err?.message || err);
        });
      }
    }
  } catch (err: any) {
    // Non-blocking catch
  }
}

/**
 * Starts background sync check for Firestore waitlist and orders collections.
 * Uses periodic polling instead of persistent idle gRPC streams to completely eliminate
 * "1 CANCELLED: Disconnecting idle stream" timeouts in Node.js.
 */
export function startFirestoreEmailListener(): void {
  console.log('[Firestore Email Poller] Starting periodic Firestore sync check (no idle streams)...');
  checkWaitlist();
  checkOrders();

  if (!pollTimer) {
    pollTimer = setInterval(() => {
      checkWaitlist();
      checkOrders();
    }, 10000); // Check every 10 seconds cleanly
  }
}
