import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [withdrawals, total] = await prisma.$transaction([
      prisma.withdrawal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    return apiResponse({
      withdrawals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError("Failed to fetch withdrawals", 500);
  }
}
