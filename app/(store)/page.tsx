import type { Metadata } from "next";
import HomepageClient from "./HomepageClient";

export const metadata: Metadata = {
  title: "Modern Ecommerce Storefront",
  description:
    "Browse a modern ecommerce storefront with featured products, category navigation, and polished buyer journeys.",
};

export default function HomePage() {
  return <HomepageClient />;
}
