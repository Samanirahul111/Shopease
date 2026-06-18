import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/auth/middleware";
import { resetPasswordSchema } from "@/lib/validations/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

    const { token, password } = parsed.data;

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        code: token,
        purpose: "FORGOT_PASSWORD",
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!otpRecord || !otpRecord.user) {
      return apiError("Invalid or expired reset token", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: otpRecord.userId! },
        data: { password: hashedPassword },
      }),
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
    ]);

    return apiResponse(null, "Password reset successfully. Please log in.");
  } catch (error) {
    console.error("[ResetPassword]", error);
    return apiError("Internal server error", 500);
  }
}
