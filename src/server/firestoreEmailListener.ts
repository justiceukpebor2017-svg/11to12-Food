import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { notifyAdminWaitlistJoined, notifyAdminPaymentOrder } from './emailNotifier';
import { WaitlistLead, OrderSubmission } from '../types';

// Lock set to prevent duplicate concurrent in-flight notifications
const inFlightIds = new Set<string>();
let pollTimer: NodeJS.Timeout | null = null;

/**
 * Marks an ID as already notified (e.g. if the REST endpoint handled it first)
 */
export async function markAsNotified(collectionName: 'waitlist' | 'orders', id: string): Promise<void> {
  if (!id) return;
  try {
    await updateDoc(doc(db, collectionName, id), {
      emailStatus: 'sent',
      emailSentAt: new Date().toISOString(),
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Checks for any waitlist leads in Firestore where emailStatus is not 'sent'
 */
async function checkPendingWaitlistLeads(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'waitlist'));
    for (const d of snap.docs) {
      const data = d.data();
      // If emailStatus is not explicitly 'sent', it needs notification!
      if (data.emailStatus !== 'sent' && !inFlightIds.has(d.id)) {
        inFlightIds.add(d.id);
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

        console.log(`[Firestore Email Poller] Found unnotified waitlist lead: ${lead.name} (${d.id})`);
        try {
          const res = await notifyAdminWaitlistJoined(lead);
          if (res.emailSent) {
            await updateDoc(doc(db, 'waitlist', d.id), {
              emailStatus: 'sent',
              emailSentAt: new Date().toISOString(),
            });
            console.log(`[Firestore Email Poller] Successfully sent email and marked waitlist doc ${d.id} as sent.`);
          }
        } catch (err: any) {
          console.error(`[Firestore Email Poller] Failed to send email for waitlist lead ${d.id}:`, err?.message || err);
        } finally {
          inFlightIds.delete(d.id);
        }
      }
    }
  } catch (err: any) {
    // Non-blocking notice
  }
}

/**
 * Checks for any order submissions in Firestore where emailStatus is not 'sent'
 */
async function checkPendingOrders(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    for (const d of snap.docs) {
      const data = d.data();
      if (data.emailStatus !== 'sent' && !inFlightIds.has(d.id)) {
        inFlightIds.add(d.id);
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

        console.log(`[Firestore Email Poller] Found unnotified order: ${order.fullName} (${d.id})`);
        try {
          const res = await notifyAdminPaymentOrder(order);
          if (res.emailSent) {
            await updateDoc(doc(db, 'orders', d.id), {
              emailStatus: 'sent',
              emailSentAt: new Date().toISOString(),
            });
            console.log(`[Firestore Email Poller] Successfully sent email and marked order doc ${d.id} as sent.`);
          }
        } catch (err: any) {
          console.error(`[Firestore Email Poller] Failed to send email for order ${d.id}:`, err?.message || err);
        } finally {
          inFlightIds.delete(d.id);
        }
      }
    }
  } catch (err: any) {
    // Non-blocking notice
  }
}

/**
 * Starts continuous background poller checking for unnotified Firestore documents every 4 seconds.
 * Guarantees that any form submission from GitHub Pages or any external browser triggers an email to admin@11to12.food.
 */
export function startFirestoreEmailListener(): void {
  console.log('[Firestore Email Poller] Active and monitoring pending submissions...');
  checkPendingWaitlistLeads();
  checkPendingOrders();

  if (!pollTimer) {
    pollTimer = setInterval(() => {
      checkPendingWaitlistLeads();
      checkPendingOrders();
    }, 4000); // Check every 4 seconds
  }
}
