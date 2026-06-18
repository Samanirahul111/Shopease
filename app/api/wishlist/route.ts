import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true,
            comparePrice: true, thumbnail: true, stock: true,
            avgRating: true, totalReviews: true, status: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });
    return apiResponse(items);
  } catch (error) {
    return apiError("Failed to fetch wishlist", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { productId } = await req.json();
    if (!productId) return apiError("Product ID required", 400);

    const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" } });
    if (!product) return apiError("Product not found", 404);

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.userId, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return apiResponse({ wishlisted: false }, "Removed from wishlist");
    }

    await prisma.wishlistItem.create({ data: { userId: user.userId, productId } });
    return apiResponse({ wishlisted: true }, "Added to wishlist", 201);
  } catch (error) {
    return apiError("Failed to update wishlist", 500);
  }
}
