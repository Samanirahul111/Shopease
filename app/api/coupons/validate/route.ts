import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { code, subtotal } = await req.json();
    if (!code) return apiError("Coupon code required", 400);

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
    });

    if (!coupon) return apiError("Invalid or expired coupon code", 400);

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return apiError("This coupon has reached its usage limit", 400);
    }

    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      return apiError(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`, 400);
    }

    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = (subtotal * Number(coupon.value)) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else if (coupon.type === "FIXED_AMOUNT") {
      discount = Math.min(Number(coupon.value), subtotal);
    } else if (coupon.type === "FREE_SHIPPING") {
      discount = 0; // handled separately
    }

    return apiResponse({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: Number(coupon.value),
        discount,
      },
    });
  } catch (error) {
    return apiError("Failed to validate coupon", 500);
  }
}
