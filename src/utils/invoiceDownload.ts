import { parseLocalDate } from '../types';

export interface InvoiceOrderData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  officeAddress: string;
  selectedDays: Array<{
    dateStr: string;
    meal: {
      day?: string;
      mealName: string;
      mealCategory?: string;
    };
    selectedSwallow?: string;
  }>;
  totalDays: number;
  subtotalNGN: number;
  discountNGN?: number;
  finalTotalNGN: number;
  submittedAt?: string;
  paymentStatus?: string;
}

export function generateInvoiceHTML(order: InvoiceOrderData): string {
  const formattedDate = new Date(order.submittedAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rows = order.selectedDays
    .map((item, idx) => {
      const d = parseLocalDate(item.dateStr);
      const dayFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `
        <tr style="border-bottom: 1px solid #f0ede6;">
          <td style="padding: 10px 12px; font-weight: 600; color: #111;">${idx + 1}. ${dayFormatted} (${item.meal.day || ''})</td>
          <td style="padding: 10px 12px; color: #222;">${item.meal.mealName}</td>
          <td style="padding: 10px 12px; color: #666;">${item.meal.mealCategory || 'Standard'}</td>
          <td style="padding: 10px 12px; text-align: right; color: #ff4c00; font-weight: 600;">${item.selectedSwallow ? `Swallow: ${item.selectedSwallow}` : 'Desk Drop'}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice #${order.id} - 11 to 12 Catering</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #faf7f2;
      color: #1a1a1a;
      margin: 0;
      padding: 24px 16px;
    }
    .container {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e5e0d8;
      overflow: hidden;
      padding: 36px 32px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f0ede6;
      padding-bottom: 24px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand h1 {
      margin: 0 0 4px 0;
      font-size: 26px;
      color: #111;
      font-weight: 900;
    }
    .brand p {
      margin: 0;
      color: #666;
      font-size: 12px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      margin: 0;
      font-size: 24px;
      color: #111;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .ref-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 4px 12px;
      background: #ff4c00;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      border-radius: 999px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .box {
      background: #faf7f2;
      border: 1px solid #ede8e0;
      border-radius: 14px;
      padding: 16px;
      font-size: 13px;
    }
    .box-dark {
      background: #111111;
      color: #ffffff;
      border: 1px solid #222;
    }
    .box-title {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #888;
      margin-bottom: 6px;
      display: block;
    }
    .box-dark .box-title {
      color: #ff4c00;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 24px;
    }
    th {
      background: #faf7f2;
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #777;
      border-bottom: 2px solid #e5e0d8;
    }
    .summary-card {
      background: #faf7f2;
      border-radius: 14px;
      padding: 16px 20px;
      margin-top: 16px;
      border: 1px solid #ede8e0;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 8px;
      color: #555;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: 900;
      color: #111;
      padding-top: 10px;
      border-top: 2px solid #e0dbd1;
    }
    .action-bar {
      margin-top: 24px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 13px;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: #111;
      color: #fff;
    }
    .btn-whatsapp {
      background: #25d366;
      color: #fff;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; }
      .action-bar { display: none !important; }
    }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
      .invoice-title { text-align: left; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <h1>11 to 12</h1>
        <p><strong>Catering & Office Lunch Delivery</strong></p>
        <p>Lagos Island, Ikoyi, Victoria Island & Lekki Phase 1</p>
        <p>WhatsApp / Call: +234 803 123 4567 • justiceukpebor2017@gmail.com</p>
      </div>
      <div class="invoice-title">
        <h2>OFFICIAL INVOICE</h2>
        <span class="ref-badge">Ref: ${order.id}</span>
        <div style="font-size: 11px; color: #888; margin-top: 6px;">Date: ${formattedDate}</div>
        <div style="font-size: 11px; font-weight: bold; color: #d97706; margin-top: 4px;">
          Status: ${order.paymentStatus || 'Pending Verification'}
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <span class="box-title">Billed To (Subscriber)</span>
        <div style="font-weight: 800; font-size: 15px; color: #111;">${order.fullName}</div>
        <div style="color: #444; margin-top: 2px;">${order.company}</div>
        <div style="color: #666; margin-top: 4px;">${order.officeAddress}</div>
        <div style="color: #888; margin-top: 6px;">${order.phone} • ${order.email}</div>
      </div>

      <div class="box box-dark">
        <span class="box-title">Remittance Bank Details</span>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #aaa;">Bank Name:</span>
          <strong style="color: #fff;">Flutterwave MFB (Formerly OK MFB)</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #aaa;">Account Number:</span>
          <strong style="font-size: 16px; color: #ff4c00; letter-spacing: 1px;">9838242145</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #333; padding-top: 4px;">
          <span style="color: #aaa;">Account Name:</span>
          <strong style="color: #eee;">11 TO 12 FOODS LTD 11 TO 12 FOODS FLW</strong>
        </div>
      </div>
    </div>

    <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: #555; margin-bottom: 8px;">
      Scheduled Lunch Deliveries (${order.totalDays} Workdays) • Delivery Window: 11:00 AM - 12:00 PM
    </div>

    <table>
      <thead>
        <tr>
          <th>Date / Day</th>
          <th>Meal Description</th>
          <th>Category</th>
          <th style="text-align: right;">Selection</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="summary-card">
      <div class="summary-row">
        <span>Subtotal (${order.totalDays} Days):</span>
        <strong style="color: #111;">₦${order.subtotalNGN.toLocaleString()}</strong>
      </div>
      ${
        order.discountNGN && order.discountNGN > 0
          ? `<div class="summary-row" style="color: #059669; font-weight: bold;">
               <span>20th Day Free Promotion:</span>
               <span>-₦${order.discountNGN.toLocaleString()}</span>
             </div>`
          : ''
      }
      <div class="total-row">
        <span>Total Payable:</span>
        <span style="color: #ff4c00;">₦${order.finalTotalNGN.toLocaleString()}</span>
      </div>
    </div>

    <div style="margin-top: 20px; font-size: 12px; color: #666; line-height: 1.5; background: #faf7f2; padding: 14px; border-radius: 12px; border: 1px solid #ede8e0;">
      <strong style="color: #111;">Payment Instructions:</strong><br />
      1. Make transfer of <strong>₦${order.finalTotalNGN.toLocaleString()}</strong> to Flutterwave MFB (Formerly OK MFB) (Acct: <strong>9838242145</strong>, 11 TO 12 FOODS LTD 11 TO 12 FOODS FLW).<br />
      2. Send your transfer receipt with this Invoice Reference <strong>${order.id}</strong> to WhatsApp: <strong>+234 803 123 4567</strong> or email: <strong>justiceukpebor2017@gmail.com</strong>.<br />
      3. Your desk-drop lunches will commence promptly at 11:00 AM on your scheduled dates!
    </div>

    <div class="action-bar">
      <button class="btn btn-primary" onclick="window.print()">Print / Save PDF</button>
      <a class="btn btn-whatsapp" href="https://wa.me/2348031234567?text=${encodeURIComponent(
        `Hello 11 to 12! Here is my official payment proof for invoice ${order.id} (₦${order.finalTotalNGN.toLocaleString()} for ${order.totalDays} lunch days).`
      )}" target="_blank">Send on WhatsApp</a>
    </div>
  </div>
</body>
</html>`;
}

export function downloadInvoiceDocument(order: InvoiceOrderData) {
  try {
    const htmlContent = generateInvoiceHTML(order);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `11to12-Invoice-${order.id}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    return true;
  } catch (err) {
    console.error('Invoice download failed:', err);
    return false;
  }
}
