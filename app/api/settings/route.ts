import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findMany();
    
    // Convert array to key-value pairs
    const settingsMap = settings.reduce((acc: Record<string, string>, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    return apiResponse(settingsMap, "Settings fetched successfully");
  } catch (error) {
    console.error("Error fetching settings:", error);
    return apiError("Failed to fetch settings", 500);
  }
}
