import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";
import { createStripePaymentIntent } from "@/lib/payments/stripe";

// POST /api/payments/stripe - Create Stripe payment intent
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { orderId } = await req.json();
    if (!orderId) return apiError("Order ID required", 400);

    const paymentSettings = await prisma.siteSettings.findMany({
      where: { key: { in: ["online_payments_available", "stripe_enabled"] } },
    });
    const settingsMap = paymentSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
    const isStripeEnabled =
      settingsMap.online_payments_available !== "false" && settingsMap.stripe_enabled !== "false";
    if (!isStripeEnabled) return apiError("Stripe is currently disabled", 400);

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.userId },
    });

    if (!order) return apiError("Order not found", 404);
    if (order.paymentStatus === "COMPLETED") return apiError("Order already paid", 400);
    if (order.paymentMethod !== "STRIPE") return apiError("Invalid payment method", 400);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true, name: true },
    });

    const paymentIntent = await createStripePaymentIntent({
      amount: Number(order.total),
      currency: "inr",
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: dbUser!.email,
      metadata: { orderId: order.id, userId: user.userId },
    });

    // Create/update payment record
    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        userId: user.userId,
        amount: order.total,
        currency: "INR",
        method: "STRIPE",
        status: "PENDING",
        gatewayOrderId: paymentIntent.id,
      },
      update: {
        gatewayOrderId: paymentIntent.id,
        status: "PENDING",
      },
    });

    return apiResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: Number(order.total),
      currency: "inr",
    });
  } catch (error) {
    console.error("[Payments/Stripe]", error);
    return apiError("Failed to create payment intent", 500);
  }
}
