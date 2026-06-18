import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/db/prisma";
import { constructStripeEvent } from "@/lib/payments/stripe";
import {
  notifyPaymentSuccess,
  notifyPaymentFailed,
  createUserNotification,
} from "@/lib/notifications/notify";
import { sendOrderConfirmationEmail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
    }

    const event = await constructStripeEvent(body, signature);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as {
          id: string;
          metadata?: { orderId?: string; userId?: string };
        };

        const { orderId, userId } = paymentIntent.metadata || {};
        if (!orderId) break;

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) break;

        await prisma.$transaction([
          prisma.payment.update({
            where: { orderId },
            data: {
              status: "COMPLETED",
              gatewayPaymentId: paymentIntent.id,
              paidAt: new Date(),
            },
          }),
          prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: "COMPLETED", status: "CONFIRMED" },
          }),
        ]);

        if (userId) {
          notifyPaymentSuccess({
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId,
            amount: Number(order.total),
            method: "Stripe",
          }).catch(console.error);

          createUserNotification({
            userId,
            title: "Payment Successful!",
            message: `Payment of ₹${order.total} confirmed for order #${order.orderNumber}`,
            type: "PAYMENT",
            link: `/dashboard/orders/${order.id}`,
          }).catch(console.error);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as {
          id: string;
          last_payment_error?: { message?: string };
          metadata?: { orderId?: string; userId?: string };
        };

        const { orderId, userId } = paymentIntent.metadata || {};
        if (!orderId) break;

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) break;

        await prisma.payment.update({
          where: { orderId },
          data: {
            status: "FAILED",
            failureReason: paymentIntent.last_payment_error?.message,
          },
        });

        if (userId) {
          notifyPaymentFailed({
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId,
            amount: Number(order.total),
            reason: paymentIntent.last_payment_error?.message,
          }).catch(console.error);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as {
          payment_intent: string;
          amount_refunded: number;
        };

        const payment = await prisma.payment.findFirst({
          where: { gatewayPaymentId: charge.payment_intent },
          include: { order: true },
        });

        if (payment) {
          const refundAmount = charge.amount_refunded / 100;
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "REFUNDED",
              refundAmount,
              refundedAt: new Date(),
            },
          });
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook]", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
