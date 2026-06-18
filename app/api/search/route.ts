import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!q || q.length < 2) return apiResponse({ products: [], suggestions: [] });

    const [products, categories] = await prisma.$transaction([
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
          ],
        },
        take: limit,
        select: {
          id: true, name: true, slug: true, price: true,
          thumbnail: true, avgRating: true, stock: true,
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: "insensitive" },
        },
        take: 5,
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return apiResponse({ products, categories, query: q });
  } catch (error) {
    return apiError("Search failed", 500);
  }
}
