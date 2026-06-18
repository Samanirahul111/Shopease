import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";
import { z } from "zod";

const updateCartSchema = z.object({ quantity: z.number().int().positive().max(100) });

// PUT /api/cart/[id] - Update cart item quantity
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const parsed = updateCartSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid quantity", 422);

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: params.id, userId: user.userId },
      include: { product: true, variant: true },
    });

    if (!cartItem) return apiError("Cart item not found", 404);

    const availableStock = cartItem.variant?.stock ?? cartItem.product.stock;
    if (parsed.data.quantity > availableStock) {
      return apiError(`Only ${availableStock} units available`, 400);
    }

    const updated = await prisma.cartItem.update({
      where: { id: params.id },
      data: { quantity: parsed.data.quantity },
      include: { product: true, variant: true },
    });

    return apiResponse(updated, "Cart updated");
  } catch (error) {
    console.error("[Cart/[id]/PUT]", error);
    return apiError("Failed to update cart", 500);
  }
}

// DELETE /api/cart/[id] - Remove cart item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const item = await prisma.cartItem.findFirst({
      where: { id: params.id, userId: user.userId },
    });

    if (!item) return apiError("Cart item not found", 404);

    await prisma.cartItem.delete({ where: { id: params.id } });
    return apiResponse(null, "Item removed from cart");
  } catch (error) {
    console.error("[Cart/[id]/DELETE]", error);
    return apiError("Failed to remove item", 500);
  }
}
