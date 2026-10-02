import { OrderSubmission, CustomerRecord } from '../types';

export interface FinancialSummary {
  revenueCollected: number; // Also known as Revenue Captured
  revenuePending: number;   // Pending manual verification
  totalVolume: number;      // Total billed (Collected + Pending)
  collectedPercent: string;
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

  // Pending verification orders
  const pendingOrders = submittedOrders.filter((o) => o.paymentStatus === 'Pending Verification');
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
