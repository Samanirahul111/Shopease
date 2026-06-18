import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"]).optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
  name: z.string().min(1).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const customer = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        wallet: { include: { transactions: { take: 10, orderBy: { createdAt: "desc" } } } },
        orders: { take: 10, orderBy: { createdAt: "desc" }, include: { items: true } },
        addresses: true,
        _count: { select: { orders: true, reviews: true, wishlist: true } },
      },
    });

    if (!customer) return apiError("Customer not found", 404);

    const { password: _, ...safe } = customer as any;
    return apiResponse(safe);
  } catch {
    return apiError("Failed to fetch customer", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;
  const { user: admin } = authResult;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const customer = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.userId,
        action: "UPDATE_CUSTOMER",
        entity: "User",
        entityId: params.id,
        changes: data,
      },
    });

    const { password: _, ...safe } = customer as any;
    return apiResponse(safe);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.errors[0].message, 400);
    return apiError("Failed to update customer", 500);
  }
}
