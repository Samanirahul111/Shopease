import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/auth/middleware";

// Force dynamic rendering for this route since it uses searchParams
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return apiError("Verification token is required", 400);
    }

    // Find the token
    const verificationOtp = await prisma.otpCode.findFirst({
      where: {
        code: token,
        purpose: "VERIFY_EMAIL",
      },
    });

    if (!verificationOtp || !verificationOtp.userId) {
      return apiError("Invalid or expired verification link", 400);
    }

    if (verificationOtp.expiresAt < new Date()) {
      return apiError("Verification link has expired", 400);
    }

    // Verify user
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verificationOtp.userId as string },
        data: { emailVerified: new Date() },
      });

      // Delete the used token
      await tx.otpCode.delete({
        where: { id: verificationOtp.id },
      });
    });

    return apiResponse(undefined, "Email verified successfully");
  } catch (error) {
    console.error("[Verify Email]", error);
    return apiError("Internal server error", 500);
  }
}
