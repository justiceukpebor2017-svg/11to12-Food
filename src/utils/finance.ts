import { OrderSubmission, CustomerRecord } from '../types';

export interface FinancialSummary {
  revenueCollected: number; // Also known as Revenue Captured
  revenuePending: number;   // Pending manual verification
  totalVolume: number;      // Total billed (Collected + Pending)
  collectedPercent: string;
}

const CONFIRMED_ORDERS_STORAGE_KEY = '11to12_confirmed_order_ids';

/**
 * Returns set of permanently confirmed order IDs from local storage cache
 */
export function getConfirmedOrderIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(CONFIRMED_ORDERS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

/**
 * Permanently locks an order ID as confirmed so it can never revert to pending
 */
export function recordOrderAsConfirmed(orderId: string): void {
  if (typeof window === 'undefined' || !orderId) return;
  try {
    const set = getConfirmedOrderIds();
    set.add(orderId);
    localStorage.setItem(CONFIRMED_ORDERS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

/**
 * Evaluates whether an order is genuinely pending verification.
 * Prevents orders that have already been confirmed, whose initial signup was already
 * verified, or whose top-up meal days have already been merged into the customer's active schedule,
 * from ever showing up again as awaiting verification.
 */
export function isOrderPendingVerification(
  order: OrderSubmission,
  customers: CustomerRecord[] = []
): boolean {
  if (!order) return false;
  if (order.paymentStatus === 'Confirmed') return false;

  // Check persistent confirmed orders cache
  if (order.id && getConfirmedOrderIds().has(order.id)) return false;

  const orderEmail = (order.email || '').trim().toLowerCase();
  const orderMemberCode = (order.memberCode || '').trim().toUpperCase();

  // If this order is explicitly linked to a customer who has already been confirmed as Paid
  const isLinkedToConfirmedPaidCustomer = customers.some(
    (c) =>
      c.orderRef === order.id &&
      c.paymentStatus === 'Paid'
  );
  if (isLinkedToConfirmedPaidCustomer) return false;

  // If this is a top-up order, check whether the dates are already confirmed & merged into the customer's calendar AND customer is marked as Paid
  if (order.isTopUp && (orderEmail || orderMemberCode)) {
    const matchedCustomer = customers.find(
      (c) =>
        Boolean(orderEmail && (c.email || '').trim().toLowerCase() === orderEmail) ||
        Boolean(orderMemberCode && (c.memberCode || '').trim().toUpperCase() === orderMemberCode)
    );

    if (matchedCustomer && matchedCustomer.paymentStatus === 'Paid') {
      const orderDays = order.selectedDays || [];
      if (orderDays.length > 0) {
        const custDateSet = new Set((matchedCustomer.selectedDays || []).map((d) => d.dateStr));
        const allDaysAlreadyMerged = orderDays.every((d) => custDateSet.has(d.dateStr));
        if (allDaysAlreadyMerged) {
          // Already merged and active on customer's meal schedule
          return false;
        }
      }
    }
  }

  // If this was an initial subscriber registration (not a top-up) and the user is already confirmed as Paid
  if (!order.isTopUp && (orderEmail || orderMemberCode)) {
    const existingPaidCustomer = customers.some(
      (c) =>
        (Boolean(orderEmail && (c.email || '').trim().toLowerCase() === orderEmail) ||
         Boolean(orderMemberCode && (c.memberCode || '').trim().toUpperCase() === orderMemberCode)) &&
        c.paymentStatus === 'Paid'
    );
    if (existingPaidCustomer) return false;
  }

  return true;
}

export function computeFinancialLedger(
  submittedOrders: OrderSubmission[] = [],
  customers: CustomerRecord[] = []
): FinancialSummary {
  // Confirmed orders from online checkouts
  const confirmedOrders = submittedOrders.filter((o) => o.paymentStatus === 'Confirmed');
  const confirmedOrderIds = new Set(confirmedOrders.map((o) => o.id));

  const collectedFromOrders = confirmedOrders.reduce((acc, o) => acc + (o.finalTotalNGN || 0), 0);

  // Confirmed / Paid customers (excluding orders already counted above to prevent double counting)
  const collectedFromCustomers = customers.reduce((acc, c) => {
    const isPaid = c.paymentStatus === 'Paid' || (c.status === 'Active' && c.paymentStatus !== 'Pending Verification');
    const alreadyCountedInOrders = (c.orderRef && confirmedOrderIds.has(c.orderRef)) || confirmedOrderIds.has(c.id);
    if (isPaid && !alreadyCountedInOrders) {
      return acc + (c.finalTotalNGN || 0);
    }
    return acc;
  }, 0);

  const revenueCollected = collectedFromOrders + collectedFromCustomers;

  // Pending verification orders (strictly unverified orders only)
  const pendingOrders = submittedOrders.filter((o) => isOrderPendingVerification(o, customers));
  const pendingOrderIds = new Set(pendingOrders.map((o) => o.id));
  const pendingFromOrders = pendingOrders.reduce((acc, o) => acc + (o.finalTotalNGN || 0), 0);

  // Pending verification customers
  const pendingFromCustomers = customers.reduce((acc, c) => {
    const isPending = c.paymentStatus === 'Pending Verification';
    const alreadyInPendingOrders = (c.orderRef && pendingOrderIds.has(c.orderRef)) || pendingOrderIds.has(c.id);
    if (isPending && !alreadyInPendingOrders) {
      return acc + (c.finalTotalNGN || 0);
    }
    return acc;
  }, 0);

  const revenuePending = pendingFromOrders + pendingFromCustomers;
  const totalVolume = revenueCollected + revenuePending;
  const collectedPercent = totalVolume > 0 ? ((revenueCollected / totalVolume) * 100).toFixed(1) : '100';

  return {
    revenueCollected,
    revenuePending,
    totalVolume,
    collectedPercent,
  };
}
