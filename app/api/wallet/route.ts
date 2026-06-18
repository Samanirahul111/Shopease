import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";

// GET /api/wallet - Get user wallet
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: user.userId } });
    }

    return apiResponse(wallet);
  } catch (error) {
    console.error("[Wallet/GET]", error);
    return apiError("Failed to fetch wallet", 500);
  }
}
