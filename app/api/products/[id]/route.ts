import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { updateProductSchema } from "@/lib/validations/schemas";
import { notifyLowStock } from "@/lib/notifications/notify";

// GET /api/products/[id] - Get single product by id or slug
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: "ACTIVE",
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
        reviews: {
          where: { status: "APPROVED" },
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) return apiError("Product not found", 404);

    // Related products (same category, exclude current)
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: "ACTIVE",
      },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        comparePrice: true,
        thumbnail: true,
        avgRating: true,
        totalReviews: true,
        stock: true,
        _count: { select: { variants: true } },
      },
    });

    return apiResponse({ product, related });
  } catch (error) {
    console.error("[Products/[id]/GET]", error);
    return apiError("Failed to fetch product", 500);
  }
}

// PUT /api/products/[id] - Admin: Update product
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const { variants, ...updateData } = parsed.data;

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return apiError("Product not found", 404);

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: { category: true },
    });

    // Low stock check after update
    if (updated.stock <= updated.lowStockAlert && updated.stock > 0) {
      notifyLowStock({
        productId: updated.id,
        productName: updated.name,
        stock: updated.stock,
        sku: updated.sku,
      }).catch(console.error);
    }

    return apiResponse(updated, "Product updated successfully");
  } catch (error) {
    console.error("[Products/[id]/PUT]", error);
    return apiError("Failed to update product", 500);
  }
}

// DELETE /api/products/[id] - Admin: Delete product
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product) return apiError("Product not found", 404);

    // Soft delete - just archive it
    await prisma.product.update({
      where: { id: params.id },
      data: { status: "ARCHIVED" },
    });

    return apiResponse(null, "Product archived successfully");
  } catch (error) {
    console.error("[Products/[id]/DELETE]", error);
    return apiError("Failed to delete product", 500);
  }
}
