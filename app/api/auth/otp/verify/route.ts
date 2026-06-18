import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { apiResponse, apiError } from "@/lib/auth/middleware";
import { otpVerifySchema } from "@/lib/validations/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = otpVerifySchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const { email, phone, code, purpose } = parsed.data;

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        OR: [
          ...(email ? [{ email: email.toLowerCase() }] : []),
          ...(phone ? [{ phone }] : []),
        ],
        code,
        purpose,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return apiError("Invalid or expired OTP", 400);
    }

    // Mark OTP as used
    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });

    // Handle different purposes
    if (purpose === "VERIFY_EMAIL" && email) {
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { emailVerified: new Date() },
      });
      return apiResponse({ verified: true }, "Email verified successfully");
    }

    if (purpose === "PHONE_LOGIN" && phone) {
      let user = await prisma.user.findUnique({ where: { phone } });

      if (!user) {
        // Auto-create user for phone login
        user = await prisma.user.create({
          data: {
            name: `User_${phone.slice(-4)}`,
            email: `phone_${phone.replace(/\+/g, "")}@placeholder.com`,
            phone,
            phoneVerified: true,
          },
        });
        await prisma.wallet.create({ data: { userId: user.id } });
      }

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "ADMIN",
      };

      const accessToken = signAccessToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);

      const response = apiResponse({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      }, "Login successful");

      response.cookies.set("auth-token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    return apiResponse({ verified: true }, "OTP verified successfully");
  } catch (error) {
    console.error("[OTP/Verify]", error);
    return apiError("Internal server error", 500);
  }
}
