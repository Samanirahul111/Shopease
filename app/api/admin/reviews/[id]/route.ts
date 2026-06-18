import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const { status } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return apiError("Invalid status", 400);
    }

    const review = await prisma.review.update({
      where: { id: params.id },
      data: { status },
    });

    // Update product rating if approved
    if (status === "APPROVED") {
      const stats = await prisma.review.aggregate({
        where: { productId: review.productId, status: "APPROVED" },
        _avg: { rating: true },
        _count: true,
      });

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          avgRating: stats._avg.rating || 0,
          totalReviews: stats._count,
        },
      });
    }

    return apiResponse(review);
  } catch {
    return apiError("Failed to update review", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    await prisma.review.delete({ where: { id: params.id } });
    return apiResponse({ message: "Review deleted" });
  } catch {
    return apiError("Failed to delete review", 500);
  }
}
