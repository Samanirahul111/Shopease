import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL("/api/auth/signin/google", req.url);
  return NextResponse.redirect(url);
}
