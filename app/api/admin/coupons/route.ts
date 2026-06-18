import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { createCouponSchema } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};
    if (active !== null && active !== undefined) {
      where.isActive = active === "true";
    }

    const [coupons, total] = await prisma.$transaction([
      prisma.coupon.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.coupon.count({ where }),
    ]);

    return apiResponse({
      coupons,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError("Failed to fetch coupons", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const parsed = createCouponSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

    const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
    if (existing) return apiError("Coupon code already exists", 409);

    const { startDate, endDate, ...rest } = parsed.data;
    const coupon = await prisma.coupon.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });
    return apiResponse(coupon, "Coupon created", 201);
  } catch (error) {
    return apiError("Failed to create coupon", 500);
  }
}
