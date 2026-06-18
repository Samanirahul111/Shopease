import prisma from "@/lib/db/prisma";
import { NotificationType } from "@prisma/client";
import { sendAdminNotificationEmail } from "@/lib/email/mailer";

export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  orderId?: string;
  productId?: string;
  data?: any;
  sendEmail?: boolean;
}

export async function createAdminNotification(params: CreateNotificationParams) {
  try {
    // Save to database
    const notification = await prisma.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        userId: params.userId,
        orderId: params.orderId,
        productId: params.productId,
        data: params.data,
        isRead: false,
      },
    });

    // Emit via Socket.io to admin room
    if (global.io) {
      global.io.to("admin-room").emit("admin:notification", {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: params.data,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    // Send email notification if requested
    if (params.sendEmail) {
      sendAdminNotificationEmail(params.title, `<p>${params.message}</p>`).catch(
        (err) => console.error("[Notify] Email failed:", err)
      );
    }

    // Telegram notification (optional)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID) {
      sendTelegramNotification(params.title, params.message).catch((err) =>
        console.error("[Notify] Telegram failed:", err)
      );
    }

    return notification;
  } catch (error) {
    console.error("[Notify] Failed to create notification:", error);
    throw error;
  }
}

export async function createUserNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}) {
  try {
    const notification = await prisma.userNotification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
        isRead: false,
      },
    });

    // Emit to user's room
    if (global.io) {
      global.io.to(`user-${params.userId}`).emit("user:notification", {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    return notification;
  } catch (error) {
    console.error("[Notify] Failed to create user notification:", error);
    throw error;
  }
}

async function sendTelegramNotification(title: string, message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!botToken || !chatId) return;

  const text = `🔔 *${title}*\n\n${message}`;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

// ==================== NOTIFICATION TRIGGERS ====================

export async function notifyNewOrder(params: {
  orderId: string;
  orderNumber: string;
  userId: string;
  userName: string;
  total: number;
}) {
  return createAdminNotification({
    type: "NEW_ORDER",
    title: "New Order Placed",
    message: `${params.userName} placed order #${params.orderNumber} worth ₹${params.total.toFixed(2)}`,
    userId: params.userId,
    orderId: params.orderId,
    data: {
      orderNumber: params.orderNumber,
      total: params.total,
    },
    sendEmail: true,
  });
}

export async function notifyPaymentSuccess(params: {
  orderId: string;
  orderNumber: string;
  userId: string;
  amount: number;
  method: string;
}) {
  return createAdminNotification({
    type: "PAYMENT_SUCCESS",
    title: "Payment Successful",
    message: `Payment of ₹${params.amount.toFixed(2)} received via ${params.method} for order #${params.orderNumber}`,
    userId: params.userId,
    orderId: params.orderId,
    data: { amount: params.amount, method: params.method },
  });
}

export async function notifyPaymentFailed(params: {
  orderId: string;
  orderNumber: string;
  userId: string;
  amount: number;
  reason?: string;
}) {
  return createAdminNotification({
    type: "PAYMENT_FAILED",
    title: "Payment Failed",
    message: `Payment failed for order #${params.orderNumber} (₹${params.amount.toFixed(2)})${params.reason ? ": " + params.reason : ""}`,
    userId: params.userId,
    orderId: params.orderId,
    sendEmail: false,
  });
}

export async function notifyNewCustomer(params: {
  userId: string;
  userName: string;
  email: string;
}) {
  return createAdminNotification({
    type: "NEW_CUSTOMER",
    title: "New Customer Registered",
    message: `${params.userName} (${params.email}) just created an account`,
    userId: params.userId,
    data: { email: params.email },
  });
}

export async function notifyLowStock(params: {
  productId: string;
  productName: string;
  stock: number;
  sku: string;
}) {
  return createAdminNotification({
    type: "LOW_STOCK",
    title: "Low Stock Warning",
    message: `"${params.productName}" (SKU: ${params.sku}) has only ${params.stock} units left`,
    productId: params.productId,
    data: { stock: params.stock, sku: params.sku },
    sendEmail: true,
  });
}

export async function notifyRefundRequest(params: {
  orderId: string;
  orderNumber: string;
  userId: string;
  userName: string;
  amount: number;
  reason?: string;
}) {
  return createAdminNotification({
    type: "REFUND_REQUEST",
    title: "Refund Requested",
    message: `${params.userName} requested a refund of ₹${params.amount.toFixed(2)} for order #${params.orderNumber}${params.reason ? ": " + params.reason : ""}`,
    userId: params.userId,
    orderId: params.orderId,
    sendEmail: true,
  });
}

export async function notifyContactForm(params: {
  name: string;
  email: string;
  subject: string;
}) {
  return createAdminNotification({
    type: "CONTACT_FORM",
    title: "New Contact Form Submission",
    message: `${params.name} (${params.email}) submitted: "${params.subject}"`,
    sendEmail: false,
  });
}

export async function notifyReviewSubmitted(params: {
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
}) {
  return createAdminNotification({
    type: "REVIEW_SUBMITTED",
    title: "New Review Submitted",
    message: `${params.userName} left a ${params.rating}★ review for "${params.productName}"`,
    userId: params.userId,
    productId: params.productId,
    data: { rating: params.rating },
  });
}

export async function notifyWithdrawalRequest(params: {
  userId: string;
  userName: string;
  amount: number;
  method: string;
}) {
  return createAdminNotification({
    type: "WITHDRAWAL_REQUEST",
    title: "Withdrawal Requested",
    message: `${params.userName} requested a withdrawal of ₹${params.amount.toFixed(2)} via ${params.method}`,
    userId: params.userId,
    sendEmail: true,
  });
}
