import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";
import { addToCartSchema } from "@/lib/validations/schemas";

// GET /api/cart - Get user's cart
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            thumbnail: true,
            stock: true,
            status: true,
            freeShipping: true,
            shippingCost: true,
          },
        },
        variant: true,
      },
      orderBy: { addedAt: "desc" },
    });

    // Calculate totals
    let subtotal = 0;
    let shippingCost = 0;
    const validItems = [];

    for (const item of cartItems) {
      if (item.product.status !== "ACTIVE") continue;

      const price = item.variant?.price
        ? Number(item.variant.price)
        : Number(item.product.price);

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      if (!item.product.freeShipping) {
        shippingCost = Math.max(shippingCost, Number(item.product.shippingCost));
      }

      validItems.push({
        ...item,
        price,
        itemTotal,
      });
    }

    return apiResponse({
      items: validItems,
      summary: {
        itemCount: validItems.reduce((sum, i) => sum + i.quantity, 0),
        subtotal,
        shippingCost: subtotal > 499 ? 0 : shippingCost, // Free shipping above ₹499
        total: subtotal + (subtotal > 499 ? 0 : shippingCost),
      },
    });
  } catch (error) {
    console.error("[Cart/GET]", error);
    return apiError("Failed to fetch cart", 500);
  }
}

// POST /api/cart - Add item to cart
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const parsed = addToCartSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const { productId, variantId, quantity } = parsed.data;

    // Verify product exists and is active
    const product = await prisma.product.findFirst({
      where: { id: productId, status: "ACTIVE" },
      include: { variants: { where: { isActive: true } } },
    });

    if (!product) return apiError("Product not found or unavailable", 404);

    if (product.variants.length > 0 && !variantId) {
      return apiError("Please select a size/variant", 400);
    }

    const selectedVariant = variantId
      ? product.variants.find((variant) => variant.id === variantId)
      : null;

    if (variantId && !selectedVariant) {
      return apiError("Selected variant is not available", 400);
    }

    const availableStock = variantId
      ? selectedVariant?.stock ?? 0
      : product.stock;

    if (availableStock < quantity) {
      return apiError(`Only ${availableStock} units available`, 400);
    }

    // Check if cart item already exists manually since Prisma upsert doesn't like null in unique constraints
    let cartItem = await prisma.cartItem.findFirst({
      where: {
        userId: user.userId,
        productId,
        variantId: variantId || null,
      },
      include: { product: true, variant: true },
    });

    if (cartItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: { increment: quantity } },
        include: { product: true, variant: true },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.userId,
          productId,
          variantId: variantId || null,
          quantity,
        },
        include: { product: true, variant: true },
      });
    }

    return apiResponse(cartItem, "Added to cart", 201);
  } catch (error) {
    console.error("[Cart/POST]", error);
    return apiError("Failed to add to cart", 500);
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    await prisma.cartItem.deleteMany({ where: { userId: user.userId } });
    return apiResponse(null, "Cart cleared");
  } catch (error) {
    console.error("[Cart/DELETE]", error);
    return apiError("Failed to clear cart", 500);
  }
}
