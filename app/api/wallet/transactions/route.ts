import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
    if (!wallet) return apiError("Wallet not found", 404);

    const [transactions, total] = await prisma.$transaction([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return apiResponse({
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Wallet/Transactions/GET]", error);
    return apiError("Failed to fetch transactions", 500);
  }
}
