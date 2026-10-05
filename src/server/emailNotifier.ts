import nodemailer from 'nodemailer';
import { WaitlistLead, OrderSubmission } from '../types';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface AdminNotificationLog {
  id: string;
  type: 'WAITLIST_JOINED' | 'PAYMENT_PENDING' | 'PAYMENT_CONFIRMED';
  title: string;
  message: string;
  data: any;
  createdAt: string;
  emailSent: boolean;
  error?: string;
}

// In-memory ring buffer of recent notifications for the admin dashboard
const recentNotifications: AdminNotificationLog[] = [];

export function getRecentNotifications(): AdminNotificationLog[] {
  return [...recentNotifications].slice(0, 50);
}

/**
 * Configure Nodemailer transport with Hostinger / standard SMTP
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || 'admin@11to12.food';
  const pass = process.env.SMTP_PASS || 'XGa4Z#j0;F';
  const secure = process.env.SMTP_SECURE === 'false' ? false : true;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Send an email notification and log it
 */
async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const transporter = getEmailTransporter();
  const fromAddress = process.env.SMTP_USER || 'admin@11to12.food';

  if (!transporter) {
    console.log('[Email Notifier] SMTP not yet configured in environment. Notification logged:');
    console.log(`To: ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    return { success: false, error: 'SMTP credentials (SMTP_USER, SMTP_PASS) not configured in .env' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"11 to 12 Desk Drop" <${fromAddress}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    console.log(`[Email Notifier] Email delivered to ${payload.to}, messageId: ${info.messageId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Email Notifier] Failed to send email via SMTP:', err?.message || err);
    return { success: false, error: err?.message || 'SMTP delivery failed' };
  }
}

/**
 * Trigger email notification when someone joins the waitlist
 */
export async function notifyAdminWaitlistJoined(lead: WaitlistLead): Promise<AdminNotificationLog> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@11to12.food';
  const subject = `🔔 [Waitlist] ${lead.name} joined the waitlist (${lead.memberCode})`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #faf7f2;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #FF4C00; margin: 0;">11 to 12 Desk Drop</h2>
        <p style="color: #666; font-size: 14px; margin-top: 4px;">New Waitlist Registration Alert</p>
      </div>

      <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
        <h3 style="margin-top: 0; color: #1a1a1a;">Prospective Subscriber Details:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #777; width: 140px;"><strong>Full Name:</strong></td>
            <td style="padding: 8px 0; color: #111;">${lead.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; color: #111;"><a href="mailto:${lead.email}">${lead.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0; color: #111;"><a href="tel:${lead.phone}">${lead.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Workplace:</strong></td>
            <td style="padding: 8px 0; color: #111;">${lead.workplace}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Office Floor / Desk:</strong></td>
            <td style="padding: 8px 0; color: #111;">${lead.addressFloor}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Member Code:</strong></td>
            <td style="padding: 8px 0; color: #FF4C00; font-weight: bold; font-family: monospace; font-size: 16px;">${lead.memberCode}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Registered At:</strong></td>
            <td style="padding: 8px 0; color: #111;">${new Date(lead.createdAt).toLocaleString()}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding: 12px; background: #fff3ed; border-left: 4px solid #FF4C00; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #b43500;">
            <strong>Admin Action Tip:</strong> Copy member code <strong>${lead.memberCode}</strong> and paste it directly into the <em>Customers Section -> Auto-Fill from Wishlist</em> to onboard them as a paying subscriber without retyping.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        Sent automatically by 11 to 12 Desk Drop System • <a href="https://11to12.food" style="color: #FF4C00;">11to12.food</a>
      </div>
    </div>
  `;

  const text = `
New Waitlist Lead Joined:
Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone}
Workplace: ${lead.workplace}
Office Address: ${lead.addressFloor}
Member Code: ${lead.memberCode}
Registered At: ${lead.createdAt}
  `;

  const result = await sendEmail({ to: adminEmail, subject, html, text });

  const log: AdminNotificationLog = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'WAITLIST_JOINED',
    title: `New Waitlist Lead: ${lead.name}`,
    message: `${lead.name} joined the waitlist (${lead.workplace}). Member Code: ${lead.memberCode}`,
    data: lead,
    createdAt: new Date().toISOString(),
    emailSent: result.success,
    error: result.error,
  };

  recentNotifications.unshift(log);
  if (recentNotifications.length > 50) recentNotifications.pop();

  return log;
}

/**
 * Trigger email notification with full itemized INVOICE when someone pays/submits an order
 */
export async function notifyAdminPaymentOrder(order: OrderSubmission): Promise<AdminNotificationLog> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@11to12.food';
  const totalNGN = (order.finalTotalNGN || 0).toLocaleString();
  const subtotalNGN = (order.subtotalNGN || order.finalTotalNGN || 0).toLocaleString();
  const discountNGN = (order.discountNGN || 0).toLocaleString();
  const formattedDate = new Date(order.submittedAt || Date.now()).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `🧾 [Official Invoice #${order.id}] ₦${totalNGN} Paid by ${order.fullName} (${order.totalDays} Days)`;

  // Generate preview of selected meal days if provided
  let selectedDaysHtml = '';
  if (Array.isArray(order.selectedDays) && order.selectedDays.length > 0) {
    const previewDays = order.selectedDays.slice(0, 10);
    const dayRows = previewDays.map((d: any, idx: number) => {
      const dayDate = d.dateStr || d.day || `Day ${idx + 1}`;
      const mealName = d.meal?.title || d.mealName || 'Chef Choice Lunch';
      const protein = d.meal?.protein ? `(${d.meal.protein})` : '';
      return `
        <tr style="border-bottom: 1px solid #f0f0f0; font-size: 13px;">
          <td style="padding: 6px 8px; color: #555;">${dayDate}</td>
          <td style="padding: 6px 8px; color: #111; font-weight: 500;">${mealName} <span style="color: #888; font-size: 12px;">${protein}</span></td>
          <td style="padding: 6px 8px; color: #2e7d32; text-align: right;">Scheduled</td>
        </tr>
      `;
    }).join('');

    const remainingCount = order.selectedDays.length - previewDays.length;
    const remainingNotice = remainingCount > 0 ? `
      <tr>
        <td colspan="3" style="padding: 6px 8px; font-size: 12px; color: #888; text-align: center; background: #fafafa;">
          + ${remainingCount} additional booked workdays included in this lunch plan
        </td>
      </tr>
    ` : '';

    selectedDaysHtml = `
      <div style="margin-top: 20px;">
        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Booked Meal Schedule:</h4>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #eee; border-radius: 6px; overflow: hidden;">
          <tr style="background: #f7f5f2; font-size: 12px; color: #777;">
            <th style="padding: 6px 8px; text-align: left;">Date</th>
            <th style="padding: 6px 8px; text-align: left;">Meal Selected</th>
            <th style="padding: 6px 8px; text-align: right;">Status</th>
          </tr>
          ${dayRows}
          ${remainingNotice}
        </table>
      </div>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #e5e5e5; border-radius: 12px; background: #faf7f2;">
      
      <!-- Brand & Invoice Header -->
      <div style="background: #ffffff; padding: 24px; border-radius: 10px; border: 1px solid #e8e8e8; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #FF4C00; padding-bottom: 16px; margin-bottom: 18px;">
          <div>
            <h1 style="color: #FF4C00; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">11 to 12 Desk Drop</h1>
            <p style="color: #666; font-size: 13px; margin: 4px 0 0 0;">Lagos Corporate Lunch Remittance & Invoice</p>
          </div>
          <div style="text-align: right;">
            <span style="background: #e8f5e9; color: #2e7d32; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 20px; border: 1px solid #c8e6c9;">PAYMENT REMITTED</span>
            <div style="margin-top: 8px; font-size: 13px; color: #555;">Invoice #: <strong style="font-family: monospace; color: #111;">${order.id}</strong></div>
            <div style="font-size: 12px; color: #888;">Date: ${formattedDate}</div>
          </div>
        </div>

        <!-- Customer & Delivery Floor Information -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 22px;">
          <div style="background: #fdfbf7; padding: 14px; border-radius: 8px; border: 1px solid #f0ece3;">
            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 6px;">Billed To Customer:</div>
            <div style="font-weight: bold; font-size: 15px; color: #111;">${order.fullName}</div>
            <div style="font-size: 13px; color: #444; margin-top: 3px;"><a href="mailto:${order.email}" style="color: #FF4C00; text-decoration: none;">${order.email}</a></div>
            <div style="font-size: 13px; color: #444; margin-top: 2px;"><a href="tel:${order.phone}" style="color: #333; text-decoration: none;">${order.phone}</a></div>
            ${order.memberCode ? `<div style="font-size: 12px; color: #777; margin-top: 4px;">Member Code: <strong style="font-family: monospace; color: #FF4C00;">${order.memberCode}</strong></div>` : ''}
          </div>

          <div style="background: #fdfbf7; padding: 14px; border-radius: 8px; border: 1px solid #f0ece3;">
            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 6px;">Desk Drop Delivery Location:</div>
            <div style="font-weight: bold; font-size: 14px; color: #111;">${order.company || 'Corporate Office'}</div>
            <div style="font-size: 13px; color: #444; margin-top: 3px;">${order.officeAddress}</div>
            ${order.floorSuite ? `<div style="font-size: 13px; color: #FF4C00; font-weight: 500; margin-top: 2px;">Floor / Station: ${order.floorSuite}</div>` : ''}
            <div style="font-size: 12px; color: #2e7d32; margin-top: 4px;">Deliveries prompt before 12:00 PM</div>
          </div>
        </div>

        <!-- Itemized Invoice Breakdown -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
          <thead>
            <tr style="background: #111; color: #fff; font-size: 12px;">
              <th style="padding: 10px; text-align: left; border-top-left-radius: 6px;">Description</th>
              <th style="padding: 10px; text-align: center;">Days</th>
              <th style="padding: 10px; text-align: right; border-top-right-radius: 6px;">Amount (NGN)</th>
            </tr>
          </thead>
          <tbody style="font-size: 14px;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 10px;">
                <strong>${order.planName || 'Custom Workday Lunch Plan'}</strong>
                <div style="font-size: 12px; color: #777;">Individual meal choices & daily workstation dispatch</div>
              </td>
              <td style="padding: 12px 10px; text-align: center; color: #555;">${order.totalDays} Days</td>
              <td style="padding: 12px 10px; text-align: right; font-weight: 500;">₦${subtotalNGN}</td>
            </tr>
            ${order.discountNGN && order.discountNGN > 0 ? `
              <tr style="border-bottom: 1px solid #eee; background: #fff8f5;">
                <td style="padding: 10px; color: #FF4C00;">
                  <strong>20th Day Free Bonus Discount</strong>
                </td>
                <td style="padding: 10px; text-align: center; color: #FF4C00;">1 Day Free</td>
                <td style="padding: 10px; text-align: right; color: #FF4C00; font-weight: bold;">- ₦${discountNGN}</td>
              </tr>
            ` : ''}
            <tr style="background: #fafafa; font-size: 16px;">
              <td colspan="2" style="padding: 14px 10px; text-align: right; font-weight: bold; color: #111;">
                TOTAL AMOUNT PAID:
              </td>
              <td style="padding: 14px 10px; text-align: right; font-weight: 800; color: #2e7d32; font-size: 20px;">
                ₦${totalNGN}
              </td>
            </tr>
          </tbody>
        </table>

        ${selectedDaysHtml}

        <!-- Admin Action Callout -->
        <div style="margin-top: 25px; padding: 16px; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px;">
          <h4 style="margin: 0 0 6px 0; color: #2e7d32; font-size: 15px;">Admin Action Required:</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #333; line-height: 1.6;">
            <li>Log in to the Admin Dashboard (<strong>Justice Dashboard -> Customers</strong>).</li>
            <li>Click <strong>"Sync & Onboard from Invoice"</strong> for <strong>${order.fullName}</strong>.</li>
            <li>Verify their bank remittance of <strong>₦${totalNGN}</strong> and issue login credentials so meals commence on their first scheduled workday.</li>
          </ol>
        </div>

      </div>

      <div style="text-align: center; font-size: 12px; color: #888;">
        11 to 12 Desk Drop • Lagos Corporate Food System • <a href="https://11to12.food" style="color: #FF4C00; text-decoration: none;">11to12.food</a>
      </div>
    </div>
  `;

  const text = `
=========================================
11 TO 12 DESK DROP - OFFICIAL INVOICE
=========================================
Invoice #: ${order.id}
Date: ${formattedDate}
Payment Status: ${order.paymentStatus}

CUSTOMER DETAILS:
Name: ${order.fullName}
Email: ${order.email}
Phone: ${order.phone}
Company: ${order.company}
Delivery Office: ${order.officeAddress} ${order.floorSuite ? `(${order.floorSuite})` : ''}
Member Code: ${order.memberCode || 'N/A'}

ORDER BREAKDOWN:
Plan: ${order.planName || 'Lunch Plan'} (${order.totalDays} Days)
Subtotal: ₦${subtotalNGN}
${order.discountNGN ? `Discount: -₦${discountNGN}\n` : ''}TOTAL AMOUNT PAID: ₦${totalNGN}

NEXT STEP:
Open Admin Dashboard -> Customers, click "Sync & Onboard from Invoice" to activate ${order.fullName}'s workstation delivery schedule.
=========================================
  `;

  const result = await sendEmail({ to: adminEmail, subject, html, text });

  const log: AdminNotificationLog = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'PAYMENT_PENDING',
    title: `Invoice #${order.id}: ₦${totalNGN} from ${order.fullName}`,
    message: `${order.fullName} paid ₦${totalNGN} for ${order.totalDays} meal days (${order.id}). Itemized invoice generated.`,
    data: order,
    createdAt: new Date().toISOString(),
    emailSent: result.success,
    error: result.error,
  };

  recentNotifications.unshift(log);
  if (recentNotifications.length > 50) recentNotifications.pop();

  return log;
}
