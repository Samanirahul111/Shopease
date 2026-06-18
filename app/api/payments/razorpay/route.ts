import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";
import { createRazorpayOrder } from "@/lib/payments/razorpay";

// POST /api/payments/razorpay - Create Razorpay order
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { orderId } = await req.json();
    if (!orderId) return apiError("Order ID required", 400);

    const paymentSettings = await prisma.siteSettings.findMany({
      where: { key: { in: ["online_payments_available", "razorpay_enabled"] } },
    });
    const settingsMap = paymentSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
    const isRazorpayEnabled =
      settingsMap.online_payments_available !== "false" && settingsMap.razorpay_enabled !== "false";
    if (!isRazorpayEnabled) return apiError("Razorpay is currently disabled", 400);

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.userId },
    });

    if (!order) return apiError("Order not found", 404);
    if (order.paymentStatus === "COMPLETED") return apiError("Order already paid", 400);
    if (order.paymentMethod !== "RAZORPAY") return apiError("Invalid payment method", 400);

    const razorpayOrder = await createRazorpayOrder({
      amount: Number(order.total),
      currency: "INR",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        userId: user.userId,
        amount: order.total,
        currency: "INR",
        method: "RAZORPAY",
        status: "PENDING",
        gatewayOrderId: razorpayOrder.id,
      },
      update: {
        gatewayOrderId: razorpayOrder.id,
        status: "PENDING",
      },
    });

    return apiResponse({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[Payments/Razorpay]", error);
    return apiError("Failed to create payment order", 500);
  }
}
