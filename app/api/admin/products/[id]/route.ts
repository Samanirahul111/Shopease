import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDesc: z.string().optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "OUT_OF_STOCK", "ARCHIVED"]).optional(),
  featured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  weight: z.number().optional(),
  freeShipping: z.boolean().optional(),
  shippingCost: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        sku: z.string().min(1),
        price: z.number().positive().optional(),
        stock: z.number().int().min(0),
        image: z.string().optional(),
        attributes: z.record(z.string(), z.string()),
        isActive: z.boolean().optional(),
      })
    )
    .optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        variants: true,
        _count: { select: { reviews: true, orderItems: true } },
      },
    });

    if (!product) return apiError("Product not found", 404);
    return apiResponse(product);
  } catch {
    return apiError("Failed to fetch product", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;
  const { user: admin } = authResult;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const { variants, ...productData } = data;

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: {
          ...productData,
          price: productData.price !== undefined ? productData.price : undefined,
          comparePrice: productData.comparePrice !== undefined ? productData.comparePrice : undefined,
          costPrice: productData.costPrice !== undefined ? productData.costPrice : undefined,
          shippingCost: productData.shippingCost !== undefined ? productData.shippingCost : undefined,
          taxRate: productData.taxRate !== undefined ? productData.taxRate : undefined,
          weight: productData.weight !== undefined ? productData.weight : undefined,
        },
      });

      if (variants) {
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: params.id },
          select: { id: true },
        });

        const incomingIds = new Set(variants.map((variant) => variant.id).filter(Boolean));
        const toDelete = existingVariants
          .map((variant) => variant.id)
          .filter((existingId) => !incomingIds.has(existingId));

        if (toDelete.length) {
          await tx.productVariant.deleteMany({ where: { id: { in: toDelete }, productId: params.id } });
        }

        for (const variant of variants) {
          if (variant.id) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                stock: variant.stock,
                image: variant.image,
                attributes: variant.attributes,
                isActive: variant.isActive ?? true,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: params.id,
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                stock: variant.stock,
                image: variant.image,
                attributes: variant.attributes,
                isActive: variant.isActive ?? true,
              },
            });
          }
        }
      }

      return updatedProduct;
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.userId,
        action: "UPDATE_PRODUCT",
        entity: "Product",
        entityId: product.id,
        changes: data,
      },
    });

    return apiResponse(product);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.errors[0].message, 400);
    return apiError("Failed to update product", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;
  const { user: admin } = authResult;

  try {
    await prisma.product.update({
      where: { id: params.id },
      data: { status: "ARCHIVED" },
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.userId,
        action: "ARCHIVE_PRODUCT",
        entity: "Product",
        entityId: params.id,
      },
    });

    return apiResponse({ message: "Product archived" });
  } catch {
    return apiError("Failed to archive product", 500);
  }
}
