import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/auth/middleware";
import { forgotPasswordSchema } from "@/lib/validations/schemas";
import { sendPasswordResetEmail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid email", 422);

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success to prevent user enumeration
    if (!user) {
      return apiResponse(null, "If this email exists, a reset link has been sent.");
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.otpCode.updateMany({
      where: { email: email.toLowerCase(), purpose: "FORGOT_PASSWORD", used: false },
      data: { used: true },
    });

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        email: email.toLowerCase(),
        code: token,
        purpose: "FORGOT_PASSWORD",
        expiresAt,
      },
    });

    let emailSent = false;
    let emailError = null;

    try {
      await sendPasswordResetEmail(email, user.name, token);
      emailSent = true;
    } catch (err: any) {
      console.error("[ForgotPassword] SMTP transmission failed:", err.message);
      emailError = err.message;
    }

    return apiResponse(
      process.env.NODE_ENV === "development" ? { token, emailError, emailSent } : null,
      "If this email exists, a reset link has been sent."
    );
  } catch (error) {
    console.error("[ForgotPassword]", error);
    return apiError("Internal server error", 500);
  }
}
