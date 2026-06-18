import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { createProductSchema } from "@/lib/validations/schemas";
import { notifyLowStock } from "@/lib/notifications/notify";

export const dynamic = "force-dynamic";

// GET /api/products - Public product listing with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "createdAt_desc";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");
    const featured = searchParams.get("featured") === "true";
    const isBestSeller = searchParams.get("bestSeller") === "true";
    const isNew = searchParams.get("new") === "true";
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const brand = searchParams.get("brand");

    const [sortField, sortDir] = sort.split("_");
    const orderBy: Record<string, string> = {};

    if (sortField === "price") orderBy.price = sortDir;
    else if (sortField === "name") orderBy.name = sortDir;
    else if (sortField === "rating") orderBy.avgRating = sortDir;
    else if (sortField === "sold") orderBy.totalSold = sortDir;
    else orderBy.createdAt = sortDir;

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      price: { gte: minPrice, lte: maxPrice },
    };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    if (featured) where.featured = true;
    if (isBestSeller) where.isBestSeller = true;
    if (isNew) where.isNew = true;
    if (brand) where.brand = { equals: brand, mode: "insensitive" };
    if (tags?.length) where.tags = { hasSome: tags };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          thumbnail: true,
          images: true,
          stock: true,
          featured: true,
          isBestSeller: true,
          isNew: true,
          avgRating: true,
          totalReviews: true,
          brand: true,
          tags: true,
          status: true,
          freeShipping: true,
          _count: { select: { variants: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return apiResponse({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("[Products/GET]", error);
    return apiError("Failed to fetch products", 500);
  }
}

// POST /api/products - Admin: Create product
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    const { variants, ...productData } = data;

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) return apiError("SKU already exists", 409);

    // Generate slug
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        price: productData.price,
        comparePrice: productData.comparePrice,
        costPrice: productData.costPrice,
        shippingCost: productData.shippingCost,
        taxRate: productData.taxRate,
        variants: variants?.length
          ? {
              create: variants.map((variant) => ({
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                stock: variant.stock,
                image: variant.image,
                attributes: variant.attributes,
                isActive: variant.isActive,
              })),
            }
          : undefined,
      },
      include: { category: true },
    });

    // Check low stock on creation
    if (product.stock <= product.lowStockAlert) {
      notifyLowStock({
        productId: product.id,
        productName: product.name,
        stock: product.stock,
        sku: product.sku,
      }).catch(console.error);
    }

    return apiResponse(product, "Product created successfully", 201);
  } catch (error) {
    console.error("[Products/POST]", error);
    return apiError("Failed to create product", 500);
  }
}
