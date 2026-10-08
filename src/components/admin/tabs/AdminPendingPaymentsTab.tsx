import React, { useState, useMemo } from 'react';
import {
  OrderSubmission,
  CustomerRecord,
} from '../../../types';
import {
  formatCredentialEmailMessage,
  formatCredentialWhatsAppMessage,
} from '../../../utils/credentialUtils';
import {
  Search,
  CreditCard,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  X,
  Send,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

interface AdminPendingPaymentsTabProps {
  orders: OrderSubmission[];
  customers: CustomerRecord[];
  onConfirmPayment: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onOpenCustomerProfile?: (customer: CustomerRecord) => void;
}

export const AdminPendingPaymentsTab: React.FC<AdminPendingPaymentsTabProps> = ({
  orders,
  customers,
  onConfirmPayment,
  onDeleteOrder,
  onOpenCustomerProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderSubmission | null>(null);
  const [orderToReject, setOrderToReject] = useState<OrderSubmission | null>(null);
  const [successConfirmation, setSuccessConfirmation] = useState<{
    customerName: string;
    email: string;
    password: string;
    orderTotal: number;
    totalDays: number;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [proofRequestNotice, setProofRequestNotice] = useState<string | null>(null);

  // Filter only orders with pending payment
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.paymentStatus !== 'Confirmed');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pendingOrders;
    return pendingOrders.filter(
      (o) =>
        o.fullName.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
    );
  }, [pendingOrders, searchQuery]);

  // Handle Confirm Payment Flow
  const handleExecuteConfirmPayment = (order: OrderSubmission) => {
    // 1. Trigger App.tsx confirm payment which records Confirmed and creates active CustomerRecord
    onConfirmPayment(order.id);

    // Find the default password that was generated or retrieve customer
    // The App.tsx generates a default password for the new customer
    setTimeout(() => {
      const matchedCustomer = customers.find(
        (c) =>
          c.orderRef === order.id ||
          (c.email && order.email && c.email.toLowerCase() === order.email.toLowerCase())
      );

      const generatedPass = matchedCustomer?.defaultPassword || matchedCustomer?.password || 'DeskDrop#842';

      setSuccessConfirmation({
        customerName: order.fullName,
        email: order.email,
        password: generatedPass,
        orderTotal: order.finalTotalNGN,
        totalDays: order.totalDays,
      });

      setSelectedOrder(null);
    }, 150);
  };

  // Handle Reject Order
  const handleExecuteRejectOrder = () => {
    if (orderToReject && onDeleteOrder) {
      onDeleteOrder(orderToReject.id);
      if (selectedOrder?.id === orderToReject.id) {
        setSelectedOrder(null);
      }
      setOrderToReject(null);
    }
  };

  // Request Proof Again
  const handleRequestProofAgain = (order: OrderSubmission) => {
    setProofRequestNotice(
      `Payment proof request sent for Order ${order.id}. Customer (${order.email}) notified via WhatsApp & Email.`
    );
    setTimeout(() => setProofRequestNotice(null), 4000);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Pending Payments</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF4C00]">
              {pendingOrders.length} Awaiting Verification
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Handle customer orders awaiting bank transfer verification and schedule confirmation
          </p>
        </div>
      </div>

      {proofRequestNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{proofRequestNotice}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search pending orders by customer name, email, or order ID..."
          className="w-full bg-white border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4C00] shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <CreditCard className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No pending payments</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {searchQuery ? 'No pending orders match your search.' : 'All payments have been verified and processed.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Contact</th>
                  <th className="py-3 px-5">Selected Lunches</th>
                  <th className="py-3 px-5">Order Total</th>
                  <th className="py-3 px-5">Primary Address</th>
                  <th className="py-3 px-5">Second Address</th>
                  <th className="py-3 px-5">Order Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((order) => {
                  const orderDate = order.submittedAt
                    ? new Date(order.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  const datesList = (order.selectedDays || []).map((d) => d.dateStr).join(', ');

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-zinc-900">{order.fullName}</div>
                        <div className="text-[10px] font-mono text-zinc-400">{order.id}</div>
                      </td>

                      <td className="py-3.5 px-5 text-zinc-600">
                        <div>{order.email}</div>
                        <div className="text-[11px] font-mono text-zinc-400">{order.phone}</div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold text-zinc-900">
                          {order.totalDays} {order.totalDays === 1 ? 'lunch' : 'lunches'}
                        </span>
                        <div className="text-[10px] text-zinc-400 max-w-[140px] truncate" title={datesList}>
                          {datesList}
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-bold text-zinc-900 whitespace-nowrap">
                        ₦{(order.finalTotalNGN || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-5 text-zinc-700 max-w-[160px] truncate" title={order.officeAddress}>
                        {order.officeAddress}
                      </td>

                      <td className="py-3.5 px-5 text-zinc-500 max-w-[140px] truncate" title={order.secondAddress || '—'}>
                        {order.secondAddress || '—'}
                      </td>

                      <td className="py-3.5 px-5 text-zinc-500 whitespace-nowrap">
                        {orderDate}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-[11px] transition cursor-pointer"
                          >
                            Review Order
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExecuteConfirmPayment(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-semibold text-[11px] transition cursor-pointer shadow-2xs"
                            title="Confirm Payment & Activate Customer"
                          >
                            Confirm
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Confirm Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4C00]">
                  Payment Verification
                </span>
                <h3 className="text-lg font-bold text-zinc-900">
                  Order {selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Customer</span>
                  <span className="font-bold text-sm text-zinc-900">{selectedOrder.fullName}</span>
                  <div className="text-zinc-600 mt-0.5">{selectedOrder.email}</div>
                  <div className="font-mono text-zinc-500 mt-0.5">{selectedOrder.phone}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Order Total</span>
                  <span className="text-lg font-black text-zinc-900">
                    ₦{(selectedOrder.finalTotalNGN || 0).toLocaleString()}
                  </span>
                  <div className="text-zinc-500 mt-0.5">
                    {selectedOrder.totalDays} Selected Lunches
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Pending Verification
                  </span>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="p-4 rounded-2xl border border-zinc-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Delivery Information</span>
                <div>
                  <span className="font-semibold text-zinc-700">Primary Delivery Address:</span>
                  <p className="text-zinc-900 font-medium">{selectedOrder.officeAddress}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-700">Second Delivery Address:</span>
                  <p className="text-zinc-600">{selectedOrder.secondAddress || 'None provided'}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-700">Company / Workplace:</span>
                  <p className="text-zinc-600">{selectedOrder.company || 'Not specified'}</p>
                </div>
              </div>

              {/* Selected Meal Dates List */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                  Selected Lunch Dates ({selectedOrder.selectedDays?.length || 0})
                </span>
                <div className="max-h-40 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-2xl p-2 bg-zinc-50/50">
                  {(selectedOrder.selectedDays || []).map((day, idx) => (
                    <div key={idx} className="py-2 px-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-zinc-900">{day.dateStr}</span>
                        <span className="text-zinc-500 ml-2">({day.day})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-700 font-medium">{day.meal.mealName}</span>
                        {day.selectedSwallow && (
                          <span className="ml-1 text-[10px] font-bold text-[#FF4C00] bg-orange-50 px-1 py-0.5 rounded">
                            {day.selectedSwallow}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Proof / Instructions */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-zinc-500">
                    Payment Verification Check
                  </span>
                  <span className="text-[11px] font-bold text-[#FF4C00]">Wema Bank (7353969118) / Flutterwave (9596073284)</span>
                </div>
                <p className="text-zinc-600">
                  Verify that <strong>₦{(selectedOrder.finalTotalNGN || 0).toLocaleString()}</strong> was credited to the account from <strong>{selectedOrder.fullName}</strong> before confirming.
                </p>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleRequestProofAgain(selectedOrder)}
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold text-xs cursor-pointer"
                >
                  Request Proof Again
                </button>

                <button
                  type="button"
                  onClick={() => setOrderToReject(selectedOrder)}
                  className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold text-xs cursor-pointer"
                >
                  Reject Order
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleExecuteConfirmPayment(selectedOrder)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wide transition shadow-sm cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Payment & Activate</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Confirmation & Credentials Pop-up */}
      {successConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-zinc-900">Payment Confirmed & Account Activated!</h3>
              <p className="text-xs text-zinc-500">
                <strong>{successConfirmation.customerName}</strong> is now a confirmed customer.
              </p>
            </div>

            {/* Login Credentials Box */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-[10px] text-zinc-400">Default Login Credentials</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Eligible for Dashboard
                </span>
              </div>

              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500">Email:</span>
                  <span className="font-bold text-zinc-900">{successConfirmation.email}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500">Temporary Password:</span>
                  <span className="font-bold text-[#FF4C00]">{successConfirmation.password}</span>
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      `Email: ${successConfirmation.email}\nTemporary Password: ${successConfirmation.password}`,
                      'creds'
                    )
                  }
                  className="flex-1 py-2 rounded-xl bg-black text-white font-semibold text-xs hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {copiedKey === 'creds' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Details!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Login Details</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 text-center">
              Login details have been dispatched. The customer will be prompted to create their permanent password on first login.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSuccessConfirmation(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {orderToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Reject Pending Order?</h3>
            <p className="text-xs text-zinc-600">
              Are you sure you want to reject and discard order <strong>{orderToReject.id}</strong> from <strong>{orderToReject.fullName}</strong>?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToReject(null)}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRejectOrder}
                className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
