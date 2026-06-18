import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";

// PUT /api/admin/notifications/[id] - Mark as read / Delete
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });
    return apiResponse(null, "Notification marked as read");
  } catch (error) {
    return apiError("Notification not found", 404);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    await prisma.notification.delete({ where: { id: params.id } });
    return apiResponse(null, "Notification deleted");
  } catch (error) {
    return apiError("Notification not found", 404);
  }
}
