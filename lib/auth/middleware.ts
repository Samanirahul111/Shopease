import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest, JWTPayload } from "./jwt";
import prisma from "@/lib/db/prisma";

export type AuthenticatedRequest = NextRequest & {
  user?: JWTPayload;
};

export function apiResponse<T>(
  data: T,
  message: string = "Success",
  status: number = 200
) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function apiError(message: string, status: number = 400, errors?: unknown) {
  return NextResponse.json(
    { success: false, message, errors: errors || null },
    { status }
  );
}

export async function requireAuth(
  req: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const token = getTokenFromRequest(req);

  if (!token) {
    return apiError("Authentication required", 401);
  }

  try {
    const decoded = verifyToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, status: true, role: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return apiError("Account is inactive or suspended", 401);
    }

    return { user: decoded };
  } catch {
    return apiError("Invalid or expired token", 401);
  }
}

export async function requireAdmin(
  req: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) return authResult;

  if (!authResult.user.isAdmin) {
    return apiError("Admin access required", 403);
  }

  return authResult;
}

export function withAuth(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: unknown) => {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    return handler(req, authResult.user);
  };
}

export function withAdmin(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: unknown) => {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;
    return handler(req, authResult.user);
  };
}
