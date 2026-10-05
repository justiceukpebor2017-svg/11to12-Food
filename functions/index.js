const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const nodemailer = require("nodemailer");

// Hostinger SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "admin@11to12.food",
    pass: process.env.SMTP_PASS || "XGa4Z#j0;F",
  },
});

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@11to12.food";

/**
 * Cloud Function Trigger: New Waitlist Entry in Firestore
 * Triggers automatically whenever a document is added to the 'waitlist' collection.
 */
exports.onWaitlistCreated = onDocumentCreated("waitlist/{leadId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the waitlist event");
    return;
  }

  const lead = snapshot.data();
  const leadId = event.params.leadId;
  const name = lead.name || lead.fullName || "Prospective Subscriber";
  const email = lead.email || "";
  const phone = lead.phone || "";
  const workplace = lead.workplace || lead.company || "Corporate Office";
  const addressFloor = lead.addressFloor || lead.officeAddress || "Desk Drop Station";
  const memberCode = lead.memberCode || leadId;
  const registeredAt = lead.createdAt ? new Date(lead.createdAt).toLocaleString() : new Date().toLocaleString();

  const mailOptions = {
    from: '"11 to 12 Desk Drop" <admin@11to12.food>',
    to: ADMIN_EMAIL,
    subject: `🔔 [Waitlist] ${name} joined the waitlist (${memberCode})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #faf7f2;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #FF4C00; margin: 0;">11 to 12 Desk Drop</h2>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">New Waitlist Registration Alert (Cloud Function)</p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <h3 style="margin-top: 0; color: #1a1a1a;">Prospective Subscriber Details:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #777; width: 140px;"><strong>Full Name:</strong></td><td style="padding: 8px 0; color: #111;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #777;"><strong>Email:</strong></td><td style="padding: 8px 0; color: #111;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #777;"><strong>Phone:</strong></td><td style="padding: 8px 0; color: #111;"><a href="tel:${phone}">${phone}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #777;"><strong>Workplace:</strong></td><td style="padding: 8px 0; color: #111;">${workplace}</td></tr>
            <tr><td style="padding: 8px 0; color: #777;"><strong>Office Floor / Desk:</strong></td><td style="padding: 8px 0; color: #111;">${addressFloor}</td></tr>
            <tr><td style="padding: 8px 0; color: #777;"><strong>Member Code:</strong></td><td style="padding: 8px 0; color: #FF4C00; font-weight: bold; font-family: monospace; font-size: 16px;">${memberCode}</td></tr>
            <tr><td style="padding: 8px 0; color: #777;"><strong>Registered At:</strong></td><td style="padding: 8px 0; color: #111;">${registeredAt}</td></tr>
          </table>

          <div style="margin-top: 20px; padding: 12px; background: #fff3ed; border-left: 4px solid #FF4C00; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #b43500;">
              <strong>Admin Action Tip:</strong> Copy member code <strong>${memberCode}</strong> and paste it into Customers -> Auto-Fill from Wishlist to activate this user.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
          Sent automatically by 11 to 12 Desk Drop • <a href="https://11to12.food" style="color: #FF4C00;">11to12.food</a>
        </div>
      </div>
    `,
    text: `New Waitlist Lead: ${name} (${email}, ${phone}, ${workplace}, ${addressFloor}). Code: ${memberCode}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Waitlist alert email sent:", info.messageId);
  } catch (error) {
    console.error("Failed to send waitlist email:", error);
  }
});

/**
 * Cloud Function Trigger: New Order / Payment in Firestore
 * Triggers automatically whenever a document is added to the 'orders' collection.
 */
exports.onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the order event");
    return;
  }

  const order = snapshot.data();
  const orderId = event.params.orderId;
  const fullName = order.fullName || order.customerName || "Valued Customer";
  const email = order.email || "";
  const phone = order.phone || "";
  const company = order.company || "Corporate Office";
  const address = order.officeAddress || order.address || "Desk Drop Station";
  const planName = order.planName || "Lunch Plan";
  const totalDays = order.totalDays || 0;
  const totalNGN = (order.finalTotalNGN || 0).toLocaleString();
  const paymentStatus = order.paymentStatus || "Pending Verification";

  const mailOptions = {
    from: '"11 to 12 Desk Drop" <admin@11to12.food>',
    to: ADMIN_EMAIL,
    subject: `💳 [Payment Alert] ₦${totalNGN} received from ${fullName} (${totalDays} Days)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #faf7f2;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #FF4C00; margin: 0;">11 to 12 Desk Drop</h2>
          <p style="color: #2e7d32; font-size: 15px; font-weight: bold; margin-top: 4px;">💳 New Customer Payment Pending Verification</p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 12px;">
            <div>
              <span style="font-size: 12px; color: #888;">Order ID:</span>
              <div style="font-weight: bold; font-family: monospace; color: #111;">${orderId}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; color: #888;">Total Amount:</span>
              <div style="font-size: 18px; font-weight: bold; color: #2e7d32;">₦${totalNGN}</div>
            </div>
          </div>

          <h3 style="margin-top: 15px; color: #1a1a1a; font-size: 15px;">Customer Contact Information:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #777; width: 130px;"><strong>Customer:</strong></td><td style="padding: 6px 0; color: #111; font-weight: bold;">${fullName}</td></tr>
            <tr><td style="padding: 6px 0; color: #777;"><strong>Email:</strong></td><td style="padding: 6px 0; color: #111;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #777;"><strong>Phone:</strong></td><td style="padding: 6px 0; color: #111;"><a href="tel:${phone}">${phone}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #777;"><strong>Company:</strong></td><td style="padding: 6px 0; color: #111;">${company}</td></tr>
            <tr><td style="padding: 6px 0; color: #777;"><strong>Delivery Office:</strong></td><td style="padding: 6px 0; color: #111;">${address}</td></tr>
            <tr><td style="padding: 6px 0; color: #777;"><strong>Lunch Plan:</strong></td><td style="padding: 6px 0; color: #FF4C00; font-weight: bold;">${planName} (${totalDays} meal days)</td></tr>
            <tr><td style="padding: 6px 0; color: #777;"><strong>Payment Status:</strong></td><td style="padding: 6px 0;"><span style="background: #fff3e0; color: #e65100; font-weight: bold; padding: 3px 8px; border-radius: 4px;">${paymentStatus}</span></td></tr>
          </table>

          <div style="margin-top: 25px; padding: 15px; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #2e7d32;">Next Step: Onboard to Customer Dashboard</h4>
            <p style="margin: 0; font-size: 13px; color: #333;">
              Open Admin Dashboard -> <strong>Customers</strong>, click <strong>"Sync & Onboard from Invoice"</strong> for ${fullName}, and issue login credentials.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
          Sent automatically to admin@11to12.food • <a href="https://11to12.food" style="color: #FF4C00;">11to12.food</a>
        </div>
      </div>
    `,
    text: `New Payment Alert: ₦${totalNGN} from ${fullName} for ${totalDays} days. Email: ${email}, Phone: ${phone}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Order alert email sent:", info.messageId);
  } catch (error) {
    console.error("Failed to send order email:", error);
  }
});
