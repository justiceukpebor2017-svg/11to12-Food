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
  const floorSuite = order.floorSuite || "";
  const planName = order.planName || "Custom Workday Lunch Plan";
  const totalDays = order.totalDays || 0;
  const totalNGN = (order.finalTotalNGN || 0).toLocaleString();
  const subtotalNGN = (order.subtotalNGN || order.finalTotalNGN || 0).toLocaleString();
  const discountNGN = (order.discountNGN || 0).toLocaleString();
  const paymentStatus = order.paymentStatus || "Pending Verification";
  const memberCode = order.memberCode || "N/A";
  const formattedDate = new Date(order.submittedAt || Date.now()).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const mailOptions = {
    from: '"11 to 12 Desk Drop" <admin@11to12.food>',
    to: ADMIN_EMAIL,
    subject: `🧾 [Official Invoice #${orderId}] ₦${totalNGN} Paid by ${fullName} (${totalDays} Days)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #e5e5e5; border-radius: 12px; background: #faf7f2;">
        <div style="background: #ffffff; padding: 24px; border-radius: 10px; border: 1px solid #e8e8e8; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #FF4C00; padding-bottom: 16px; margin-bottom: 18px;">
            <div>
              <h1 style="color: #FF4C00; margin: 0; font-size: 24px; font-weight: 800;">11 to 12 Desk Drop</h1>
              <p style="color: #666; font-size: 13px; margin: 4px 0 0 0;">Lagos Corporate Lunch Remittance & Invoice</p>
            </div>
            <div style="text-align: right;">
              <span style="background: #e8f5e9; color: #2e7d32; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 20px;">PAYMENT REMITTED</span>
              <div style="margin-top: 8px; font-size: 13px; color: #555;">Invoice #: <strong style="font-family: monospace;">${orderId}</strong></div>
              <div style="font-size: 12px; color: #888;">Date: ${formattedDate}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 22px;">
            <div style="background: #fdfbf7; padding: 14px; border-radius: 8px; border: 1px solid #f0ece3;">
              <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: bold;">Billed To:</div>
              <div style="font-weight: bold; font-size: 15px; color: #111; margin-top: 4px;">${fullName}</div>
              <div style="font-size: 13px; color: #444;"><a href="mailto:${email}" style="color: #FF4C00;">${email}</a></div>
              <div style="font-size: 13px; color: #444;"><a href="tel:${phone}">${phone}</a></div>
              <div style="font-size: 12px; color: #777; margin-top: 4px;">Member Code: <strong style="color: #FF4C00;">${memberCode}</strong></div>
            </div>

            <div style="background: #fdfbf7; padding: 14px; border-radius: 8px; border: 1px solid #f0ece3;">
              <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: bold;">Delivery Location:</div>
              <div style="font-weight: bold; font-size: 14px; color: #111; margin-top: 4px;">${company}</div>
              <div style="font-size: 13px; color: #444;">${address}</div>
              ${floorSuite ? `<div style="font-size: 13px; color: #FF4C00;">Floor: ${floorSuite}</div>` : ""}
              <div style="font-size: 12px; color: #2e7d32; margin-top: 4px;">Desk Drop prompt before 12:00 PM</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
            <thead>
              <tr style="background: #111; color: #fff; font-size: 12px;">
                <th style="padding: 10px; text-align: left;">Description</th>
                <th style="padding: 10px; text-align: center;">Days</th>
                <th style="padding: 10px; text-align: right;">Amount (NGN)</th>
              </tr>
            </thead>
            <tbody style="font-size: 14px;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 10px;">
                  <strong>${planName}</strong>
                  <div style="font-size: 12px; color: #777;">Individual meal choices & daily workstation dispatch</div>
                </td>
                <td style="padding: 12px 10px; text-align: center;">${totalDays} Days</td>
                <td style="padding: 12px 10px; text-align: right;">₦${subtotalNGN}</td>
              </tr>
              ${order.discountNGN > 0 ? `
                <tr style="border-bottom: 1px solid #eee; background: #fff8f5;">
                  <td style="padding: 10px; color: #FF4C00;"><strong>20th Day Free Bonus Discount</strong></td>
                  <td style="padding: 10px; text-align: center; color: #FF4C00;">1 Day Free</td>
                  <td style="padding: 10px; text-align: right; color: #FF4C00; font-weight: bold;">- ₦${discountNGN}</td>
                </tr>
              ` : ""}
              <tr style="background: #fafafa; font-size: 16px;">
                <td colspan="2" style="padding: 14px 10px; text-align: right; font-weight: bold;">TOTAL PAID:</td>
                <td style="padding: 14px 10px; text-align: right; font-weight: 800; color: #2e7d32; font-size: 20px;">₦${totalNGN}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 25px; padding: 16px; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px;">
            <h4 style="margin: 0 0 6px 0; color: #2e7d32; font-size: 15px;">Admin Action Required:</h4>
            <p style="margin: 0; font-size: 13px; color: #333;">
              Open Admin Dashboard -> <strong>Customers</strong>, click <strong>"Sync & Onboard from Invoice"</strong> for ${fullName}, verify payment of ₦${totalNGN}, and issue login credentials.
            </p>
          </div>
        </div>

        <div style="text-align: center; font-size: 12px; color: #888;">
          11 to 12 Desk Drop • <a href="https://11to12.food" style="color: #FF4C00;">11to12.food</a>
        </div>
      </div>
    `,
    text: `Official Invoice #${orderId}: ₦${totalNGN} paid by ${fullName} for ${totalDays} days. Email: ${email}, Phone: ${phone}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Order alert email sent:", info.messageId);
  } catch (error) {
    console.error("Failed to send order email:", error);
  }
});
