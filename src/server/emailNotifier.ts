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
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

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
 * Trigger email notification when someone pays/submits an order
 */
export async function notifyAdminPaymentOrder(order: OrderSubmission): Promise<AdminNotificationLog> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@11to12.food';
  const totalNGN = (order.finalTotalNGN || 0).toLocaleString();
  const subject = `💳 [Payment Alert] ₦${totalNGN} received from ${order.fullName} (${order.totalDays} Days)`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #faf7f2;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #FF4C00; margin: 0;">11 to 12 Desk Drop</h2>
        <p style="color: #2e7d32; font-size: 15px; font-weight: bold; margin-top: 4px;">💳 New Customer Payment Pending Verification</p>
      </div>

      <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 12px;">
          <div>
            <span style="font-size: 12px; color: #888;">Order ID:</span>
            <div style="font-weight: bold; font-family: monospace; color: #111;">${order.id}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 12px; color: #888;">Total Amount:</span>
            <div style="font-size: 18px; font-weight: bold; color: #2e7d32;">₦${totalNGN}</div>
          </div>
        </div>

        <h3 style="margin-top: 15px; color: #1a1a1a; font-size: 15px;">Customer Contact Information:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #777; width: 130px;"><strong>Customer:</strong></td>
            <td style="padding: 6px 0; color: #111; font-weight: bold;">${order.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #777;"><strong>Email:</strong></td>
            <td style="padding: 6px 0; color: #111;"><a href="mailto:${order.email}">${order.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #777;"><strong>Phone:</strong></td>
            <td style="padding: 6px 0; color: #111;"><a href="tel:${order.phone}">${order.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #777;"><strong>Company:</strong></td>
            <td style="padding: 6px 0; color: #111;">${order.company}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #777;"><strong>Delivery Office:</strong></td>
            <td style="padding: 6px 0; color: #111;">${order.officeAddress}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #777;"><strong>Lunch Plan:</strong></td>
            <td style="padding: 6px 0; color: #FF4C00; font-weight: bold;">${order.planName || `${order.totalDays} Days`} (${order.totalDays} selected meal days)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #777;"><strong>Payment Status:</strong></td>
            <td style="padding: 6px 0;"><span style="background: #fff3e0; color: #e65100; font-weight: bold; padding: 3px 8px; border-radius: 4px;">${order.paymentStatus}</span></td>
          </tr>
        </table>

        <div style="margin-top: 25px; padding: 15px; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; text-align: center;">
          <h4 style="margin: 0 0 8px 0; color: #2e7d32;">Next Step: Onboard to Customer Dashboard</h4>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #333;">
            1. Open the Admin Dashboard -> <strong>Customers</strong> section.<br/>
            2. Click <strong>"Sync & Onboard from Invoice"</strong> for ${order.fullName}.<br/>
            3. Confirm payment & issue default login credentials so the user can access their active meals.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        Sent automatically to admin@11to12.food • <a href="https://11to12.food" style="color: #FF4C00;">11to12.food</a>
      </div>
    </div>
  `;

  const text = `
New Payment Received:
Customer: ${order.fullName}
Amount: ₦${totalNGN}
Plan: ${order.planName} (${order.totalDays} days)
Email: ${order.email}
Phone: ${order.phone}
Company: ${order.company}
Address: ${order.officeAddress}
Order ID: ${order.id}

Log in to the Admin Dashboard (Customers Section) to confirm payment and activate this user's meal calendar.
  `;

  const result = await sendEmail({ to: adminEmail, subject, html, text });

  const log: AdminNotificationLog = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'PAYMENT_PENDING',
    title: `Payment: ₦${totalNGN} from ${order.fullName}`,
    message: `${order.fullName} paid ₦${totalNGN} for ${order.totalDays} meal days (${order.id}). Pending admin verification.`,
    data: order,
    createdAt: new Date().toISOString(),
    emailSent: result.success,
    error: result.error,
  };

  recentNotifications.unshift(log);
  if (recentNotifications.length > 50) recentNotifications.pop();

  return log;
}
