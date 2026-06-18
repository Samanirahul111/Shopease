import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const settings = await prisma.siteSettings.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
    const grouped = settings.reduce((acc: Record<string, any[]>, s) => {
      if (!acc[s.group]) acc[s.group] = [];
      acc[s.group].push(s);
      return acc;
    }, {});
    return apiResponse(grouped);
  } catch {
    return apiError("Failed to fetch settings", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const { key, value, type, group } = body;
    if (!key || value === undefined) return apiError("Key and value required", 400);

    const setting = await prisma.siteSettings.upsert({
      where: { key },
      create: { key, value: String(value), type: type || "string", group: group || "general" },
      update: { value: String(value) },
    });

    return apiResponse(setting);
  } catch {
    return apiError("Failed to save setting", 500);
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const { settings } = body;
    if (!Array.isArray(settings)) return apiError("Settings array required", 400);

    const updates = await Promise.all(
      settings.map(({ key, value, type, group }: any) =>
        prisma.siteSettings.upsert({
          where: { key },
          create: { key, value: String(value), type: type || "string", group: group || "general" },
          update: { value: String(value) },
        })
      )
    );

    return apiResponse({ updated: updates.length });
  } catch {
    return apiError("Failed to update settings", 500);
  }
}
