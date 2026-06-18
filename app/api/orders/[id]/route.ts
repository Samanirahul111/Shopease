import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { updateOrderStatusSchema } from "@/lib/validations/schemas";
import { createUserNotification, notifyRefundRequest } from "@/lib/notifications/notify";

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        ...(user.isAdmin ? {} : { userId: user.userId }),
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, thumbnail: true },
            },
            variant: true,
          },
        },
        address: true,
        payment: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!order) return apiError("Order not found", 404);
    return apiResponse(order);
  } catch (error) {
    console.error("[Orders/[id]/GET]", error);
    return apiError("Failed to fetch order", 500);
  }
}

// PUT /api/orders/[id] - Admin: Update order status
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!order) return apiError("Order not found", 404);

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
    };

    if (parsed.data.trackingNumber) updateData.trackingNumber = parsed.data.trackingNumber;
    if (parsed.data.trackingUrl) updateData.trackingUrl = parsed.data.trackingUrl;
    if (parsed.data.carrier) updateData.carrier = parsed.data.carrier;
    if (parsed.data.cancelReason) updateData.cancelReason = parsed.data.cancelReason;

    if (parsed.data.status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    if (parsed.data.status === "REFUNDED" && parsed.data.refundAmount) {
      updateData.refundAmount = parsed.data.refundAmount;
      updateData.refundReason = parsed.data.refundReason;
      updateData.refundedAt = new Date();
      updateData.paymentStatus = "REFUNDED";

      // Credit wallet
      const wallet = await prisma.wallet.findUnique({ where: { userId: order.userId } });
      if (wallet) {
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: order.userId },
            data: {
              balance: { increment: parsed.data.refundAmount },
              totalCredits: { increment: parsed.data.refundAmount },
            },
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "CREDIT",
              source: "ORDER_REFUND",
              amount: parsed.data.refundAmount,
              balance: Number(wallet.balance) + parsed.data.refundAmount,
              description: `Refund for order #${order.orderNumber}`,
              referenceId: order.id,
            },
          }),
        ]);
      }
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });

    // Notify customer
    const statusMessages: Record<string, string> = {
      CONFIRMED: "Your order has been confirmed!",
      PROCESSING: "Your order is being processed.",
      SHIPPED: `Your order is on its way! ${parsed.data.trackingNumber ? `Tracking: ${parsed.data.trackingNumber}` : ""}`,
      OUT_FOR_DELIVERY: "Your order is out for delivery!",
      DELIVERED: "Your order has been delivered!",
      CANCELLED: `Your order has been cancelled. ${parsed.data.cancelReason || ""}`,
      REFUNDED: `Refund of ₹${parsed.data.refundAmount} credited to your wallet.`,
    };

    if (statusMessages[parsed.data.status]) {
      createUserNotification({
        userId: order.userId,
        title: `Order #${order.orderNumber} Update`,
        message: statusMessages[parsed.data.status],
        type: "ORDER",
        link: `/dashboard/orders/${order.id}`,
      }).catch(console.error);
    }

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.userId,
        action: "UPDATE_ORDER_STATUS",
        entity: "ORDER",
        entityId: order.id,
        changes: { status: parsed.data.status, previous: order.status },
      },
    });

    return apiResponse(updated, "Order status updated");
  } catch (error) {
    console.error("[Orders/[id]/PUT]", error);
    return apiError("Failed to update order", 500);
  }
}
