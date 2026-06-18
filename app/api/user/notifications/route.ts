import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const notifications = await prisma.userNotification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return apiResponse(notifications);
  } catch {
    return apiError("Failed to fetch notifications", 500);
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    if (body.markAllRead) {
      await prisma.userNotification.updateMany({
        where: { userId: user.userId, isRead: false },
        data: { isRead: true },
      });
      return apiResponse({ message: "All notifications marked as read" });
    }
    return apiError("Invalid request", 400);
  } catch {
    return apiError("Failed to update notifications", 500);
  }
}
