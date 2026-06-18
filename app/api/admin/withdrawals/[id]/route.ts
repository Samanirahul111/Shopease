import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PROCESSING", "COMPLETED", "REJECTED", "ON_HOLD"]),
  adminNotes: z.string().optional(),
  transactionRef: z.string().optional(),
});

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

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: params.id },
    });

    if (!withdrawal) return apiError("Withdrawal not found", 404);

    // If rejecting, refund the wallet
    if (data.status === "REJECTED" && withdrawal.status !== "REJECTED") {
      await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId: withdrawal.userId },
        });
        if (!wallet) throw new Error("Wallet not found");

        const newBalance = Number(wallet.balance) + Number(withdrawal.amount);

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: newBalance,
            totalDebits: { decrement: withdrawal.amount },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            source: "WITHDRAWAL",
            amount: withdrawal.amount,
            balance: newBalance,
            description: `Withdrawal #${params.id} rejected - amount refunded`,
            referenceId: params.id,
          },
        });

        await tx.withdrawal.update({
          where: { id: params.id },
          data: {
            status: data.status,
            adminNotes: data.adminNotes,
            processedBy: admin.userId,
            processedAt: new Date(),
          },
        });
      });
    } else {
      await prisma.withdrawal.update({
        where: { id: params.id },
        data: {
          status: data.status,
          adminNotes: data.adminNotes,
          transactionRef: data.transactionRef,
          processedBy: admin.userId,
          processedAt: new Date(),
        },
      });
    }

    // Notify user
    await prisma.userNotification.create({
      data: {
        userId: withdrawal.userId,
        title: `Withdrawal ${data.status === "COMPLETED" ? "Processed" : data.status === "REJECTED" ? "Rejected" : "Updated"}`,
        message:
          data.status === "COMPLETED"
            ? `Your withdrawal of ₹${withdrawal.amount} has been processed successfully.`
            : data.status === "REJECTED"
            ? `Your withdrawal request of ₹${withdrawal.amount} was rejected. The amount has been refunded to your wallet.`
            : `Your withdrawal request status has been updated to ${data.status}.`,
        type: "WITHDRAWAL",
        link: "/dashboard/wallet",
      },
    });

    if (global.io) {
      global.io.to(`user-${withdrawal.userId}`).emit("user:notification", {
        title: "Withdrawal Update",
        message: `Withdrawal status: ${data.status}`,
      });
    }

    await prisma.adminLog.create({
      data: {
        adminId: admin.userId,
        action: `UPDATE_WITHDRAWAL_STATUS_${data.status}`,
        entity: "Withdrawal",
        entityId: params.id,
        changes: { status: data.status, adminNotes: data.adminNotes },
      },
    });

    return apiResponse({ message: "Withdrawal updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.errors[0].message, 400);
    return apiError("Failed to update withdrawal", 500);
  }
}
