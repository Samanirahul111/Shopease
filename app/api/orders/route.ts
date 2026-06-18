import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";
import { createOrderSchema } from "@/lib/validations/schemas";
import {
  notifyNewOrder,
  notifyLowStock,
  createUserNotification,
} from "@/lib/notifications/notify";
import { sendOrderConfirmationEmail } from "@/lib/email/mailer";

function generateOrderNumber(): string {
  return `SE${Date.now().toString(36).toUpperCase()}${nanoid(4).toUpperCase()}`;
}

// GET /api/orders - Get user's orders
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: user.userId };
    if (status) where.status = status;

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, thumbnail: true, slug: true } },
            },
          },
          payment: { select: { id: true, status: true, method: true, paidAt: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return apiResponse({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Orders/GET]", error);
    return apiError("Failed to fetch orders", 500);
  }
}

// POST /api/orders - Create new order
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const { addressId, paymentMethod, couponCode, notes } = parsed.data;

    const paymentSettings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: [
            "online_payments_available",
            "razorpay_enabled",
            "stripe_enabled",
            "cod_available",
            "wallet_enabled",
          ],
        },
      },
    });
    const settingsMap = paymentSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    const onlineEnabled = settingsMap.online_payments_available !== "false";
    const razorpayEnabled = onlineEnabled && settingsMap.razorpay_enabled !== "false";
    const stripeEnabled = onlineEnabled && settingsMap.stripe_enabled !== "false";
    const codEnabled = settingsMap.cod_available !== "false";
    const walletEnabled = settingsMap.wallet_enabled !== "false";

    if (paymentMethod === "RAZORPAY" && !razorpayEnabled) {
      return apiError("Razorpay is currently disabled", 400);
    }
    if (paymentMethod === "STRIPE" && !stripeEnabled) {
      return apiError("Stripe is currently disabled", 400);
    }
    if (paymentMethod === "COD" && !codEnabled) {
      return apiError("Cash on Delivery is currently disabled", 400);
    }
    if (paymentMethod === "WALLET" && !walletEnabled) {
      return apiError("Wallet payment is currently disabled", 400);
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: user.userId },
    });
    if (!address) return apiError("Address not found", 404);

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.userId },
      include: { product: true, variant: true },
    });

    if (cartItems.length === 0) return apiError("Cart is empty", 400);

    // Validate stock and calculate prices
    let subtotal = 0;
    let shippingCost = 0;
    const orderItemsData: any[] = [];

    for (const item of cartItems) {
      if (item.product.status !== "ACTIVE") {
        return apiError(`"${item.product.name}" is no longer available`, 400);
      }

      const stock = item.variant?.stock ?? item.product.stock;
      if (stock < item.quantity) {
        return apiError(
          `Insufficient stock for "${item.product.name}". Available: ${stock}`,
          400
        );
      }

      const price = item.variant?.price
        ? Number(item.variant.price)
        : Number(item.product.price);

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      if (!item.product.freeShipping && item.product.shippingCost) {
        shippingCost = Math.max(shippingCost, Number(item.product.shippingCost));
      }

      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        sku: item.variant?.sku || item.product.sku,
        image: item.product.thumbnail,
        attributes: item.variant?.attributes,
        quantity: item.quantity,
        price,
        total: itemTotal,
      });
    }

    // Apply free shipping threshold
    if (subtotal > 499) shippingCost = 0;

    // Validate coupon
    let couponDiscount = 0;
    let validatedCoupon = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          AND: [
            { OR: [{ endDate: null }, { endDate: { gt: new Date() } }] },
            { OR: [{ startDate: null }, { startDate: { lte: new Date() } }] },
          ],
        },
      });

      if (!coupon) return apiError("Invalid or expired coupon", 400);
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return apiError("Coupon usage limit exceeded", 400);
      }
      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        return apiError(`Minimum order amount is ₹${coupon.minOrderAmount}`, 400);
      }

      if (coupon.type === "PERCENTAGE") {
        couponDiscount = (subtotal * Number(coupon.value)) / 100;
        if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, Number(coupon.maxDiscount));
      } else if (coupon.type === "FIXED_AMOUNT") {
        couponDiscount = Math.min(Number(coupon.value), subtotal);
      } else if (coupon.type === "FREE_SHIPPING") {
        couponDiscount = shippingCost;
        shippingCost = 0;
      }

      validatedCoupon = coupon;
    }

    // Calculate tax (18% GST example - configurable)
    const taxableAmount = subtotal - couponDiscount;
    const taxRate = 0; // Set based on product categories if needed
    const tax = taxableAmount * taxRate;

    const total = taxableAmount + shippingCost + tax;

    // Handle COD
    if (paymentMethod === "COD" && total > 50000) {
      return apiError("COD is not available for orders above ₹50,000", 400);
    }

    // Handle wallet payment
    if (paymentMethod === "WALLET") {
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
      if (!wallet || Number(wallet.balance) < total) {
        return apiError(
          `Insufficient wallet balance. Available: ₹${wallet ? Number(wallet.balance).toFixed(2) : "0"}`,
          400
        );
      }
    }

    const orderNumber = generateOrderNumber();

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.userId,
          addressId,
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
          status: "PENDING",
          subtotal,
          couponCode,
          couponDiscount,
          shippingCost,
          tax,
          total,
          notes,
          ipAddress: req.headers.get("x-forwarded-for") || undefined,
          items: { create: orderItemsData },
        },
        include: {
          items: { include: { product: true } },
          address: true,
        },
      });

      // Deduct stock
      for (const item of cartItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              totalSold: { increment: item.quantity },
            },
          });
        }
      }

      // Handle wallet payment
      if (paymentMethod === "WALLET") {
        const wallet = await tx.wallet.findUnique({ where: { userId: user.userId } });

        await tx.wallet.update({
          where: { userId: user.userId },
          data: {
            balance: { decrement: total },
            totalDebits: { increment: total },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            type: "DEBIT",
            source: "ORDER_REFUND",
            amount: total,
            balance: Number(wallet!.balance) - total,
            description: `Payment for order #${orderNumber}`,
            referenceId: newOrder.id,
          },
        });

        await tx.order.update({
          where: { id: newOrder.id },
          data: { paymentStatus: "COMPLETED", status: "CONFIRMED" },
        });

        // Create payment record
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            userId: user.userId,
            amount: total,
            method: "WALLET",
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
      }

      // Update coupon usage
      if (validatedCoupon) {
        await tx.coupon.update({
          where: { id: validatedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId: user.userId } });

      return newOrder;
    });

    // Get the user for email
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });

    // Send notifications (non-blocking)
    notifyNewOrder({
      orderId: order.id,
      orderNumber,
      userId: user.userId,
      userName: dbUser?.name || "Customer",
      total,
    }).catch(console.error);

    createUserNotification({
      userId: user.userId,
      title: "Order Placed Successfully!",
      message: `Your order #${orderNumber} has been placed. ${paymentMethod === "COD" ? "Pay on delivery." : "Proceed to payment."}`,
      type: "ORDER",
      link: `/dashboard/orders/${order.id}`,
    }).catch(console.error);

    if (dbUser?.email && (paymentMethod === "COD" || paymentMethod === "WALLET")) {
      sendOrderConfirmationEmail(dbUser.email, dbUser.name, {
        orderNumber,
        total,
        items: order.items.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          price: Number(i.price),
        })),
        paymentMethod,
      }).catch(console.error);
    }

    // Check for low stock after order
    for (const item of cartItems) {
      const updatedProduct = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (updatedProduct && updatedProduct.stock <= updatedProduct.lowStockAlert) {
        notifyLowStock({
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          stock: updatedProduct.stock,
          sku: updatedProduct.sku,
        }).catch(console.error);
      }
    }

    return apiResponse(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentMethod: order.paymentMethod,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      "Order created successfully",
      201
    );
  } catch (error) {
    console.error("[Orders/POST]", error);
    return apiError("Failed to create order", 500);
  }
}
