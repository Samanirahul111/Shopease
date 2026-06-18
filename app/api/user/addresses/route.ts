import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth, apiResponse, apiError } from "@/lib/auth/middleware";
import { addressSchema } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const addresses = await prisma.address.findMany({
      where: { userId: user.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return apiResponse(addresses);
  } catch (error) {
    return apiError("Failed to fetch addresses", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...parsed.data, userId: user.userId },
    });

    return apiResponse(address, "Address added", 201);
  } catch (error) {
    return apiError("Failed to add address", 500);
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return apiError("Address ID required", 400);

    const existing = await prisma.address.findFirst({ where: { id, userId: user.userId } });
    if (!existing) return apiError("Address not found", 404);

    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId: user.userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.update({ where: { id }, data });
    return apiResponse(address);
  } catch {
    return apiError("Failed to update address", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError("Address ID required", 400);

    const existing = await prisma.address.findFirst({ where: { id, userId: user.userId } });
    if (!existing) return apiError("Address not found", 404);

    await prisma.address.delete({ where: { id } });
    return apiResponse({ message: "Address deleted" });
  } catch {
    return apiError("Failed to delete address", 500);
  }
}
