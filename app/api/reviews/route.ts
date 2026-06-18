import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";
import { createReviewSchema } from "@/lib/validations/schemas";
import { notifyReviewSubmitted } from "@/lib/notifications/notify";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

    const { productId, orderId, rating, title, content, images } = parsed.data;

    // Check if user bought this product
    let isVerified = false;
    if (orderId) {
      const orderItem = await prisma.orderItem.findFirst({
        where: {
          orderId,
          productId,
          order: { userId: user.userId, paymentStatus: "COMPLETED" },
        },
      });
      isVerified = !!orderItem;
    }

    // Check for existing review
    const existing = await prisma.review.findFirst({
      where: { productId, userId: user.userId, orderId: orderId || null },
    });
    if (existing) return apiError("You have already reviewed this product for this order", 409);

    const review = await prisma.review.create({
      data: {
        productId, userId: user.userId, orderId,
        rating, title, content, images,
        isVerified,
        status: isVerified ? "APPROVED" : "PENDING",
      },
    });

    // Update product rating
    if (review.status === "APPROVED") {
      const stats = await prisma.review.aggregate({
        where: { productId, status: "APPROVED" },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.product.update({
        where: { id: productId },
        data: {
          avgRating: stats._avg.rating || 0,
          totalReviews: stats._count,
        },
      });
    }

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });

    notifyReviewSubmitted({
      productId,
      productName: product?.name || "Unknown Product",
      userId: user.userId,
      userName: dbUser?.name || "User",
      rating,
    }).catch(console.error);

    return apiResponse(review, "Review submitted. Pending approval.", 201);
  } catch (error) {
    console.error("[Reviews/POST]", error);
    return apiError("Failed to submit review", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!productId) return apiError("Product ID required", 400);

    const [reviews, total, stats] = await prisma.$transaction([
      prisma.review.findMany({
        where: { productId, status: "APPROVED" },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.review.count({ where: { productId, status: "APPROVED" } }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId, status: "APPROVED" },
        _count: true,
        orderBy: { _count: { rating: "desc" } },
      }),
    ]);

    return apiResponse({
      reviews,
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError("Failed to fetch reviews", 500);
  }
}
