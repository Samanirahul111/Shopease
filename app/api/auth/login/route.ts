import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { apiResponse, apiError } from "@/lib/auth/middleware";
import { loginSchema } from "@/lib/validations/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      return apiError("Invalid email or password", 401);
    }

    if (user.status === "SUSPENDED" || user.status === "BANNED") {
      return apiError("Your account has been suspended. Contact support.", 403);
    }

    if (user.status === "INACTIVE") {
      return apiError("Your account is inactive.", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return apiError("Invalid email or password", 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.headers.get("x-forwarded-for") || req.ip,
      },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "ADMIN",
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = apiResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    });

    response.cookies.set("auth-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login]", error);
    return apiError("Internal server error", 500);
  }
}
