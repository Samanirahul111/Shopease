import { NextRequest } from "next/server";
import { totp } from "otplib";
import prisma from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/auth/middleware";
import { otpSendSchema } from "@/lib/validations/schemas";
import { sendOtpEmail } from "@/lib/email/mailer";

// Configure TOTP
totp.options = { step: 600, window: 1 };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = otpSendSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const { email, phone, purpose } = parsed.data;

    if (!email && !phone) {
      return apiError("Email or phone is required", 400);
    }

    let user = null;
    let recipient = email || phone;

    if (email) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (purpose === "FORGOT_PASSWORD" && !user) {
        return apiError("No account found with this email", 404);
      }
    }

    // Generate 6-digit OTP
    const secret = `${recipient}-${purpose}-${process.env.JWT_SECRET}`;
    const otp = totp.generate(secret);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous OTPs
    await prisma.otpCode.updateMany({
      where: {
        OR: [{ email: email?.toLowerCase() }, { phone }],
        purpose,
        used: false,
      },
      data: { used: true },
    });

    // Save new OTP
    await prisma.otpCode.create({
      data: {
        userId: user?.id,
        email: email?.toLowerCase(),
        phone,
        code: otp,
        purpose,
        expiresAt,
      },
    });

    // Send OTP
    let emailSent = false;
    let emailError = null;

    if (email) {
      try {
        await sendOtpEmail(
          email,
          user?.name || "User",
          otp,
          purpose
        );
        emailSent = true;
      } catch (err: any) {
        console.error("[OTP/Send] SMTP transmission failed:", err.message);
        emailError = err.message;
      }
    }

    return apiResponse(
      { 
        sent: emailSent,
        ...(process.env.NODE_ENV === "development" ? { otp, emailError } : {})
      },
      emailSent
        ? `OTP sent to ${email ? email.replace(/(.{3}).*(@.*)/, "$1***$2") : "your device"}`
        : `OTP generated. (SMTP Warning: Mail delivery failed, check logs)`
    );
  } catch (error) {
    console.error("[OTP/Send]", error);
    return apiError("Failed to send OTP", 500);
  }
}
