import React from 'react';
import { SelectedLunchDay, OrderSubmission } from '../../types';
import { X, Printer, Copy, Check, MessageSquare, Download } from 'lucide-react';
import { downloadInvoiceDocument } from '../../utils/invoiceDownload';
import { CONTACT_CONFIG } from '../../config/contactConfig';

interface InvoiceSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderSubmission | {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    company: string;
    officeAddress: string;
    selectedDays: SelectedLunchDay[];
    totalDays: number;
    subtotalNGN: number;
    discountNGN: number;
    finalTotalNGN: number;
    submittedAt: string;
    paymentStatus?: string;
  };
}

export const InvoiceSlipModal: React.FC<InvoiceSlipModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [downloaded, setDownloaded] = React.useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      downloadInvoiceDocument(order);
    }
  };

  const handleDownload = () => {
    downloadInvoiceDocument(order);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const invoiceDate = new Date(order.submittedAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopyInvoice = () => {
    const text = `11 TO 12 OFFICIAL ORDER INVOICE
Invoice ID: ${order.id}
Customer: ${order.fullName} (${order.company})
Delivery Address: ${order.officeAddress}
WhatsApp/Phone: ${order.phone}
Total Days: ${order.totalDays} workdays
Total Amount Payable: ₦${order.finalTotalNGN.toLocaleString()}
Bank Details: Flutterwave MFB (Formerly OK MFB) | 9838242145 | 11 TO 12 FOODS LTD 11 TO 12 FOODS FLW`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto font-['Poppins'] print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 bg-[#FAF7F2] shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF4C00] bg-[#FF4C00]/10 px-2.5 py-1 rounded-full border border-[#FF4C00]/20">
              Official Order Slip
            </span>
            <span className="text-xs font-semibold text-zinc-500">Ref: {order.id}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyInvoice}
              className="p-2 rounded-full hover:bg-zinc-200 transition text-zinc-600 cursor-pointer flex items-center space-x-1 text-xs font-semibold"
              title="Copy Invoice Details"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-full bg-[#FF4C00] text-white hover:bg-[#E04300] transition text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Download Invoice File"
            >
              <Download className="w-4 h-4" />
              <span>{downloaded ? 'Downloaded!' : 'Download'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-full bg-black text-white hover:bg-zinc-800 transition text-xs font-bold hidden sm:flex items-center space-x-1 cursor-pointer"
              title="Print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-200 transition cursor-pointer text-zinc-500"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body - Scrollable */}
        <div className="p-6 sm:p-8 space-y-6 bg-white text-left overflow-y-auto flex-1" id="printable-invoice">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
            <div>
              <img
                src="https://i.ibb.co/FLX7ttjm/11to12logg.png"
                alt="11 to 12"
                className="h-10 w-auto object-contain mb-2"
              />
              <p className="text-xs font-bold text-zinc-800">11 to 12 Catering Services</p>
              <p className="text-[11px] text-zinc-500">Corporate Desk Drop & Workday Lunch Delivery</p>
              <p className="text-[11px] text-zinc-500">Lagos Island, Ikoyi, Victoria Island & Lekki Phase 1</p>
            </div>

            <div className="sm:text-right">
              <span className="text-2xl font-black text-black tracking-tight block">INVOICE</span>
              <span className="text-xs font-bold text-[#FF4C00] block mt-0.5">{order.id}</span>
              <span className="text-[11px] text-zinc-400 block mt-1">Date: {invoiceDate}</span>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                {order.paymentStatus || 'Awaiting Payment Proof'}
              </span>
            </div>
          </div>

          {/* Billed To & Bank Remittance Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-zinc-200 text-xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Billed To (Subscriber)
              </span>
              <p className="font-bold text-sm text-black">{order.fullName}</p>
              <p className="text-zinc-700 font-medium">{order.company}</p>
              <p className="text-zinc-600">{order.officeAddress}</p>
              <p className="text-zinc-500 pt-1">{order.phone} • {order.email}</p>
            </div>

            {/* Official Bank Account for Payment */}
            <div className="p-4 rounded-2xl bg-zinc-900 text-white border border-zinc-800 text-xs space-y-1">
              <span className="text-[10px] font-bold text-[#FF4C00] uppercase tracking-wider block mb-1">
                Remittance Account
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-zinc-400">Account Number:</span>
                <span className="text-base font-black text-white select-all">9838242145</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-zinc-400">Bank Name:</span>
                <span className="font-bold text-zinc-200">Flutterwave MFB (Formerly OK MFB)</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-zinc-800 text-[10px] text-zinc-400">
                <span>Account Name:</span>
                <span className="font-semibold text-zinc-300">11 TO 12 FOODS LTD 11 TO 12 FOODS FLW</span>
              </div>
            </div>

          </div>

          {/* Scheduled Lunch Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Scheduled Lunch Delivery Items ({order.totalDays} Days)
              </span>
              <span className="text-[11px] text-zinc-400">Time window: 11:00 AM - 12:00 PM</span>
            </div>

            <div className="border border-zinc-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F2] text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-200 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Date / Day</th>
                    <th className="py-2.5 px-3">Scheduled Meal</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {order.selectedDays.map((item, idx) => {
                    const dateObj = new Date(item.dateStr);
                    const formatted = dateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <tr key={item.dateStr} className="hover:bg-zinc-50/70">
                        <td className="py-2 px-3 font-semibold text-black whitespace-nowrap">
                          {formatted} ({item.meal.day})
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {item.meal.mealName}
                        </td>
                        <td className="py-2 px-3 text-zinc-500 whitespace-nowrap">
                          {item.meal.mealCategory}
                        </td>
                        <td className="py-2 px-3 text-right text-zinc-500 whitespace-nowrap">
                          {item.selectedSwallow ? `Swallow: ${item.selectedSwallow}` : 'Standard'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-200">
            <div className="text-xs text-zinc-500 space-y-1 max-w-xs">
              <p className="font-semibold text-black">Proof Instructions:</p>
              <p>
                Send this invoice slip + bank transfer receipt to WhatsApp <strong className="text-zinc-800">{CONTACT_CONFIG.whatsappDisplay}</strong> or email <strong className="text-zinc-800">{CONTACT_CONFIG.supportEmail}</strong>.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 bg-[#FAF7F2] p-4 rounded-2xl border border-zinc-200 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal ({order.totalDays} Days):</span>
                <span className="font-semibold text-black">₦{order.subtotalNGN.toLocaleString()}</span>
              </div>

              {order.discountNGN > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>20th Day Free Bonus:</span>
                  <span>-₦{order.discountNGN.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline">
                <span className="font-bold text-sm text-black">Total Payable:</span>
                <span className="text-xl font-black text-black">
                  ₦{order.finalTotalNGN.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom WhatsApp Confirmation CTA (Hidden in Print) */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-end print:hidden">
            <a
              href={`https://wa.me/${CONTACT_CONFIG.whatsappIntl}?text=${encodeURIComponent(
                `Hello 11 to 12! Here is my official order invoice (${order.id}) for ${order.totalDays} lunch days (₦${order.finalTotalNGN.toLocaleString()}). I have made the bank transfer. Attached is my payment proof:`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wide transition flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs uppercase tracking-wide transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>{downloaded ? 'Downloaded!' : 'Download Invoice Slip'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold text-xs uppercase tracking-wide transition flex items-center justify-center cursor-pointer"
            >
              <span>Close</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
