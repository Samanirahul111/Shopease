import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { withdrawalSchema } from "@/lib/validations/schemas";
import { notifyWithdrawalRequest } from "@/lib/notifications/notify";

// GET /api/withdrawals
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where = user.isAdmin ? {} : { userId: user.userId };

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
    console.error("[Withdrawals/GET]", error);
    return apiError("Failed to fetch withdrawals", 500);
  }
}

// POST /api/withdrawals - Request withdrawal
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const parsed = withdrawalSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const { amount, method, accountDetails } = parsed.data;

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
    if (!wallet || Number(wallet.balance) < amount) {
      return apiError("Insufficient wallet balance", 400);
    }

    // Check for pending withdrawal
    const pendingWithdrawal = await prisma.withdrawal.findFirst({
      where: { userId: user.userId, status: { in: ["PENDING", "PROCESSING"] } },
    });
    if (pendingWithdrawal) {
      return apiError("You already have a pending withdrawal request", 400);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });

    // Deduct from wallet (hold the amount)
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: user.userId },
        data: {
          balance: { decrement: amount },
          totalDebits: { increment: amount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          source: "WITHDRAWAL",
          amount,
          balance: Number(wallet.balance) - amount,
          description: `Withdrawal request via ${method}`,
        },
      });
    });

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.userId,
        amount,
        method,
        accountDetails,
        status: "PENDING",
      },
    });

    notifyWithdrawalRequest({
      userId: user.userId,
      userName: dbUser?.name || "User",
      amount,
      method,
    }).catch(console.error);

    return apiResponse(withdrawal, "Withdrawal request submitted", 201);
  } catch (error) {
    console.error("[Withdrawals/POST]", error);
    return apiError("Failed to create withdrawal request", 500);
  }
}
