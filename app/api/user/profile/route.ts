import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, emailVerified: true, phoneVerified: true,
        createdAt: true, role: true, referralCode: true,
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (!profile) return apiError("User not found", 404);
    return apiResponse(profile);
  } catch (error) {
    return apiError("Failed to fetch profile", 500);
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();

    // Handle password change
    if (body.currentPassword) {
      const parsed = changePasswordSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
      if (!dbUser?.password) return apiError("Cannot change password for OAuth accounts", 400);

      const isValid = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
      if (!isValid) return apiError("Current password is incorrect", 400);

      const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
      await prisma.user.update({ where: { id: user.userId }, data: { password: hashed } });
      return apiResponse(null, "Password changed successfully");
    }

    // Handle profile update
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: parsed.data,
      select: { id: true, name: true, email: true, phone: true, avatar: true },
    });

    return apiResponse(updated, "Profile updated successfully");
  } catch (error) {
    return apiError("Failed to update profile", 500);
  }
}
