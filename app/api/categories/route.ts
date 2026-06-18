import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  image: z.string().url().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parentOnly = searchParams.get("parentOnly") === "true";
    const withCount = searchParams.get("withCount") === "true";

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        ...(parentOnly ? { parentId: null } : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        ...(withCount
          ? { _count: { select: { products: { where: { status: "ACTIVE" } } } } }
          : {}),
      },
    });

    return apiResponse(categories);
  } catch (error) {
    console.error("[Categories/GET]", error);
    return apiError("Failed to fetch categories", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const { name, ...rest } = parsed.data;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existingSlug = await prisma.category.findUnique({ where: { slug } });

    const category = await prisma.category.create({
      data: {
        name,
        slug: existingSlug ? `${slug}-${Date.now()}` : slug,
        ...rest,
      },
    });

    return apiResponse(category, "Category created", 201);
  } catch (error) {
    console.error("[Categories/POST]", error);
    return apiError("Failed to create category", 500);
  }
}
