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
 * Uses the exact same battle-tested HTML structure as notifyAdminWaitlistJoined for 100% mail delivery.
 */
export async function notifyAdminPaymentOrder(order: OrderSubmission): Promise<AdminNotificationLog> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@11to12.food';
  const totalNGN = (order.finalTotalNGN || 0).toLocaleString();
  const subtotalNGN = (order.subtotalNGN || order.finalTotalNGN || 0).toLocaleString();
  const discountNGN = (order.discountNGN || 0).toLocaleString();
  const formattedDate = new Date(order.submittedAt || Date.now()).toLocaleString();

  const adminSubject = `🔔 [Invoice] ${order.fullName} - ${order.id} (₦${totalNGN})`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #faf7f2;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #FF4C00; margin: 0;">11 to 12 Desk Drop</h2>
        <p style="color: #2e7d32; font-size: 14px; font-weight: bold; margin-top: 4px;">Official Invoice & Customer Payment Alert</p>
      </div>

      <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
        <h3 style="margin-top: 0; color: #1a1a1a;">Order Invoice & Payment Breakdown:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #777; width: 140px;"><strong>Invoice Number:</strong></td>
            <td style="padding: 8px 0; color: #111; font-family: monospace; font-weight: bold; font-size: 15px;">${order.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Customer Name:</strong></td>
            <td style="padding: 8px 0; color: #111; font-weight: bold;">${order.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Email Address:</strong></td>
            <td style="padding: 8px 0; color: #111;"><a href="mailto:${order.email}" style="color: #FF4C00;">${order.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Phone Number:</strong></td>
            <td style="padding: 8px 0; color: #111;"><a href="tel:${order.phone}" style="color: #111;">${order.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Company:</strong></td>
            <td style="padding: 8px 0; color: #111;">${order.company || 'Corporate Office'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Delivery Office:</strong></td>
            <td style="padding: 8px 0; color: #111;">${order.officeAddress} ${order.floorSuite ? `(${order.floorSuite})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Lunch Plan:</strong></td>
            <td style="padding: 8px 0; color: #FF4C00; font-weight: bold;">${order.planName || 'Workday Lunch Plan'} (${order.totalDays} Days)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Subtotal:</strong></td>
            <td style="padding: 8px 0; color: #444;">₦${subtotalNGN}</td>
          </tr>
          ${order.discountNGN > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Bonus Discount:</strong></td>
            <td style="padding: 8px 0; color: #FF4C00; font-weight: bold;">- ₦${discountNGN} (20th Day Free)</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 10px 0; color: #111; font-size: 16px;"><strong>TOTAL PAID:</strong></td>
            <td style="padding: 10px 0; color: #2e7d32; font-weight: 800; font-size: 20px;">₦${totalNGN}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Payment Status:</strong></td>
            <td style="padding: 8px 0;"><span style="background: #e8f5e9; color: #2e7d32; font-weight: bold; padding: 4px 8px; border-radius: 4px;">Paid / Remittance Confirmed</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Member Code:</strong></td>
            <td style="padding: 8px 0; color: #FF4C00; font-weight: bold; font-family: monospace;">${order.memberCode || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777;"><strong>Submitted At:</strong></td>
            <td style="padding: 8px 0; color: #111;">${formattedDate}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding: 12px; background: #e8f5e9; border-left: 4px solid #2e7d32; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #1b5e20;">
            <strong>Admin Action Tip:</strong> Open <strong>11 to 12 Admin Dashboard -> Customers</strong>, click <strong>"Sync & Onboard from Invoice"</strong> for ${order.fullName} to confirm and activate daily deliveries before 12:00 PM.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        Sent automatically by 11 to 12 Desk Drop System • <a href="https://11to12.food" style="color: #FF4C00;">11to12.food</a>
      </div>
    </div>
  `;

  const text = `
New Customer Payment & Order Invoice:
Invoice #: ${order.id}
Customer: ${order.fullName}
Email: ${order.email}
Phone: ${order.phone}
Company: ${order.company}
Address: ${order.officeAddress}
Plan: ${order.planName || 'Workday Lunch Plan'} (${order.totalDays} Days)
Subtotal: ₦${subtotalNGN}
${order.discountNGN ? `Discount: -₦${discountNGN}\n` : ''}TOTAL AMOUNT PAID: ₦${totalNGN}
Payment Status: ${order.paymentStatus}
Submitted At: ${formattedDate}

Admin Action: Open 11 to 12 Dashboard -> Customers, click "Sync & Onboard from Invoice" to activate this customer.
  `;

  // Deliver to Admin
  const adminResult = await sendEmail({ to: adminEmail, subject: adminSubject, html, text });

  // Deliver copy to customer if valid email provided
  if (order.email && order.email.includes('@') && order.email.toLowerCase() !== adminEmail.toLowerCase()) {
    const customerSubject = `🧾 [11 to 12 Invoice] Your Official Lunch Order Receipt (${order.id})`;
    sendEmail({ to: order.email, subject: customerSubject, html, text }).catch((err) => {
      console.warn('[Email Notifier] Notice sending customer receipt:', err?.message || err);
    });
  }

  const log: AdminNotificationLog = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'PAYMENT_PENDING',
    title: `Invoice #${order.id}: ₦${totalNGN} from ${order.fullName}`,
    message: `${order.fullName} paid ₦${totalNGN} for ${order.totalDays} meal days (${order.id}). Itemized invoice generated.`,
    data: order,
    createdAt: new Date().toISOString(),
    emailSent: adminResult.success,
    error: adminResult.error,
  };

  recentNotifications.unshift(log);
  if (recentNotifications.length > 50) recentNotifications.pop();

  return log;
}
