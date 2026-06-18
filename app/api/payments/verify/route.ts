import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";
import { verifyRazorpaySignature } from "@/lib/payments/razorpay";
import { notifyPaymentSuccess, notifyPaymentFailed, createUserNotification } from "@/lib/notifications/notify";
import { sendOrderConfirmationEmail } from "@/lib/email/mailer";

// POST /api/payments/verify - Verify Razorpay payment
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return apiError("Missing payment verification data", 400);
    }

    // Verify signature
    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.userId },
      include: { user: true },
    });

    if (!order) return apiError("Order not found", 404);

    if (!isValid) {
      await prisma.payment.update({
        where: { orderId },
        data: { status: "FAILED", failureReason: "Signature verification failed" },
      });

      notifyPaymentFailed({
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.userId,
        amount: Number(order.total),
        reason: "Signature verification failed",
      }).catch(console.error);

      return apiError("Payment verification failed", 400);
    }

    // Update payment and order
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId },
        data: {
          status: "COMPLETED",
          gatewayPaymentId: razorpayPaymentId,
          gatewaySignature: razorpaySignature,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "COMPLETED", status: "CONFIRMED" },
      }),
    ]);

    // Notify
    notifyPaymentSuccess({
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: user.userId,
      amount: Number(order.total),
      method: "Razorpay",
    }).catch(console.error);

    createUserNotification({
      userId: user.userId,
      title: "Payment Successful!",
      message: `Payment of ₹${order.total} for order #${order.orderNumber} confirmed.`,
      type: "PAYMENT",
      link: `/dashboard/orders/${order.id}`,
    }).catch(console.error);

    // Send confirmation email
    if (order.user?.email) {
      const orderWithItems = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (orderWithItems) {
        sendOrderConfirmationEmail(order.user.email, order.user.name, {
          orderNumber: order.orderNumber,
          total: Number(order.total),
          items: orderWithItems.items.map((i) => ({
            name: i.productName,
            quantity: i.quantity,
            price: Number(i.price),
          })),
          paymentMethod: "Razorpay",
        }).catch(console.error);
      }
    }

    return apiResponse({ verified: true, orderId }, "Payment verified successfully");
  } catch (error) {
    console.error("[Payments/Verify]", error);
    return apiError("Payment verification failed", 500);
  }
}
