import nodemailer from "nodemailer";
import { env, requireFeature } from "@/lib/config/env";

// Validate email configuration
requireFeature("email", "initialize email service");

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST!,
  port: env.SMTP_PORT!,
  secure: env.SMTP_SECURE!,
  auth: {
    user: env.SMTP_USER!,
    pass: env.SMTP_PASS!,
  },
  tls: { rejectUnauthorized: false },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: nodemailer.SendMailOptions["attachments"];
}

export async function sendEmail(options: EmailOptions) {
  try {
    const result = await transporter.sendMail({
      from: env.EMAIL_FROM || "ShopEase <noreply@shopease.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });
    console.log(`[Email] Sent to ${options.to}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    throw error;
  }
}

function baseEmailTemplate(content: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f9fafb; color: #111827; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
    .header { background: #111827; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header span { color: #22c55e; }
    .body { padding: 40px 32px; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 13px; margin: 4px 0; }
    .btn { display: inline-block; background: #111827; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .otp-box { background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #111827; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    p { line-height: 1.6; color: #374151; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .order-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .order-table th { text-align: left; padding: 10px; background: #f9fafb; font-weight: 600; color: #374151; font-size: 13px; }
    .order-table td { padding: 10px; border-top: 1px solid #e5e7eb; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Shop<span>Ease</span></h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ShopEase. All rights reserved.</p>
      <p>If you didn't request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Verify your ShopEase account",
    html: baseEmailTemplate(`
      <h2 style="margin-top:0">Welcome to ShopEase, ${name}! 👋</h2>
      <p>Thanks for signing up! Please verify your email address to get started.</p>
      <div style="text-align:center">
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      </div>
      <p style="color:#6b7280;font-size:13px">Or copy this link: ${verifyUrl}</p>
      <p style="color:#6b7280;font-size:13px">This link expires in 24 hours.</p>
    `, "Verify your email"),
  });
}

export async function sendOtpEmail(email: string, name: string, otp: string, purpose: string) {
  const purposeText: Record<string, string> = {
    VERIFY_EMAIL: "verify your email",
    FORGOT_PASSWORD: "reset your password",
    PHONE_LOGIN: "log in",
  };
  await sendEmail({
    to: email,
    subject: `Your ShopEase OTP: ${otp}`,
    html: baseEmailTemplate(`
      <h2 style="margin-top:0">Your One-Time Password</h2>
      <p>Hi ${name}, use the following OTP to ${purposeText[purpose] || "continue"}:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p style="color:#6b7280;font-size:13px;margin:8px 0 0">Valid for ${env.OTP_EXPIRY_MINUTES} minutes</p>
      </div>
      <p style="color:#6b7280;font-size:13px">Never share this OTP with anyone. ShopEase will never ask for it.</p>
    `, "Your OTP"),
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your ShopEase password",
    html: baseEmailTemplate(`
      <h2 style="margin-top:0">Reset Your Password</h2>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <div style="text-align:center">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <p style="color:#6b7280;font-size:13px">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    `, "Reset Password"),
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: {
    orderNumber: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    paymentMethod: string;
  }
) {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>₹${item.price.toFixed(2)}</td>
          <td>₹${(item.quantity * item.price).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  await sendEmail({
    to: email,
    subject: `Order Confirmed! #${order.orderNumber}`,
    html: baseEmailTemplate(`
      <h2 style="margin-top:0">Order Confirmed! 🎉</h2>
      <p>Hi ${name}, your order has been successfully placed.</p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px">
        <div>
          <p style="margin:0;font-size:13px;color:#6b7280">Order Number</p>
          <p style="margin:4px 0 0;font-weight:700;color:#111827">#${order.orderNumber}</p>
        </div>
        <div><span class="badge badge-green">Confirmed</span></div>
      </div>
      <table class="order-table">
        <thead>
          <tr>
            <th>Product</th><th>Qty</th><th>Price</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="font-weight:700;text-align:right;padding:12px 10px">Total:</td>
            <td style="font-weight:700">₹${order.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <div style="text-align:center;margin-top:24px">
        <a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/orders" class="btn">Track Your Order</a>
      </div>
    `, "Order Confirmed"),
  });
}

export async function sendAdminNotificationEmail(
  subject: string,
  content: string
) {
  const adminEmail = env.ADMIN_EMAIL;
  if (!adminEmail) return;

  await sendEmail({
    to: adminEmail,
    subject: `[Admin Alert] ${subject}`,
    html: baseEmailTemplate(`
      <h2 style="margin-top:0">Admin Notification</h2>
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:4px;margin:16px 0">
        ${content}
      </div>
      <p style="color:#6b7280;font-size:13px">This is an automated notification from ShopEase.</p>
      <a href="${env.NEXT_PUBLIC_APP_URL}/admin" class="btn">Go to Admin Dashboard</a>
    `, subject),
  });
}
