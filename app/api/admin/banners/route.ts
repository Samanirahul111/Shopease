import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { z } from "zod";

const bannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  image: z.string().url(),
  mobileImage: z.string().optional(),
  link: z.string().optional(),
  buttonText: z.string().optional(),
  position: z.string().default("HOME_HERO"),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const banners = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
    return apiResponse(banners);
  } catch {
    return apiError("Failed to fetch banners", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const data = bannerSchema.parse(body);
    const banner = await prisma.banner.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
    return apiResponse(banner, "Banner created successfully", 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.errors[0].message, 400);
    return apiError("Failed to create banner", 500);
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return apiError("Banner ID required", 400);

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
    return apiResponse(banner);
  } catch {
    return apiError("Failed to update banner", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError("Banner ID required", 400);

    await prisma.banner.delete({ where: { id } });
    return apiResponse({ message: "Banner deleted" });
  } catch {
    return apiError("Failed to delete banner", 500);
  }
}
