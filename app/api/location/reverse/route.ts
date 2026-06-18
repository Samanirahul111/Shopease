import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return apiError("Latitude and longitude are required", 400);
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      {
        headers: {
          "User-Agent": "ShopEase/1.0",
          "Accept": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return apiError("Failed to fetch location details", 502);
    }

    const data = await response.json();
    const address = data?.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      "";

    const state = address.state || address.county || "";
    const postalCode = address.postcode || "";
    const country = address.country || "India";
    const road = address.road || "";
    const houseNumber = address.house_number || "";

    return apiResponse({
      addressLine1: [houseNumber, road].filter(Boolean).join(" ").trim(),
      city,
      state,
      postalCode,
      country,
      displayName: data?.display_name || "",
    });
  } catch (error) {
    console.error("[Location/Reverse]", error);
    return apiError("Failed to reverse geocode location", 500);
  }
}
