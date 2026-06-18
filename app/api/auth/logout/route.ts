import { NextRequest, NextResponse } from "next/server";
import { apiResponse } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  const response = apiResponse(null, "Logged out successfully");

  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("refresh-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}
