import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory token bucket rate limiter for Edge
// Warning: In a multi-region deployment, use Upstash Redis instead.
// For a single server (like a standard VPS), this is sufficient.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.RATE_LIMIT_WINDOW_MS)
  : 60 * 1000; // Default 1 minute

const RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 100; // Default 100 requests / minute

function applyRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  // If the window has passed, reset the counter
  if (now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  // If within the window, check if out of tokens
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count += 1;
  return true;
}

export function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip =
      request.ip ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const allowed = applyRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too Many Requests",
          message: "You have exceeded the API rate limit. Please try again later.",
        },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply only for API routes, excluding static files and images
    "/api/:path*",
  ],
};
