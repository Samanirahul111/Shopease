import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const notification = await prisma.userNotification.updateMany({
      where: { id: params.id, userId: user.userId },
      data: { isRead: body.isRead ?? true },
    });
    return apiResponse(notification);
  } catch {
    return apiError("Failed to update notification", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    await prisma.userNotification.deleteMany({
      where: { id: params.id, userId: user.userId },
    });
    return apiResponse({ message: "Notification deleted" });
  } catch {
    return apiError("Failed to delete notification", 500);
  }
}
