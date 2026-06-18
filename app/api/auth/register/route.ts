import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/db/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { apiResponse, apiError } from "@/lib/auth/middleware";
import { registerSchema } from "@/lib/validations/schemas";
import { sendVerificationEmail } from "@/lib/email/mailer";
import { notifyNewCustomer } from "@/lib/notifications/notify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const { name, email, password, phone } = parsed.data;

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return apiError("Email is already registered", 409);
      }
      return apiError("Phone number is already registered", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate referral code
    const referralCode = uuidv4().slice(0, 8).toUpperCase();

    // Generate email verification token
    const verificationToken = uuidv4();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with wallet
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone,
          referralCode,
        },
      });

      // Create wallet
      await tx.wallet.create({
        data: { userId: newUser.id },
      });

      // Create verification OTP
      await tx.otpCode.create({
        data: {
          userId: newUser.id,
          email: email.toLowerCase(),
          code: verificationToken,
          purpose: "VERIFY_EMAIL",
          expiresAt: tokenExpiry,
        },
      });

      return newUser;
    });

    // Send verification email (non-blocking)
    sendVerificationEmail(email, name, verificationToken).catch(console.error);

    // Notify admin (non-blocking)
    notifyNewCustomer({
      userId: user.id,
      userName: user.name,
      email: user.email,
    }).catch(console.error);

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "ADMIN",
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "ADMIN",
    });

    const response = apiResponse(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        accessToken,
        refreshToken,
        verifyUrl: `/verify-email?token=${verificationToken}`, // Fallback for dev mode without SMTP
      },
      "Registration successful. Please verify your email.",
      201
    );

    // Set HTTP-only cookie
    response.cookies.set("auth-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Register]", error);
    return apiError(error.message || "Internal server error", 500);
  }
}
