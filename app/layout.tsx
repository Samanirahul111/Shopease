import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import QueryProvider from "@/components/providers/QueryProvider";
import SocketProvider from "@/components/providers/SocketProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ShopEase | Full-Stack Ecommerce Experience",
    template: "%s | ShopEase",
  },
  description:
    "A polished full-stack ecommerce platform with customer accounts, admin dashboards, cart flows, and secure payment integrations.",
  keywords: ["online shopping", "ecommerce", "next.js store", "full-stack commerce"],
  authors: [{ name: "ShopEase" }],
  creator: "ShopEase",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "ShopEase",
    title: "ShopEase | Full-Stack Ecommerce Experience",
    description: "A polished full-stack ecommerce platform with secure shopping and admin tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopEase | Full-Stack Ecommerce Experience",
    description: "A polished full-stack ecommerce platform with secure shopping and admin tools.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <SocketProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#18181b",
                  color: "#fff",
                  borderRadius: "10px",
                  fontSize: "14px",
                  padding: "12px 16px",
                },
                success: {
                  iconTheme: { primary: "#22c55e", secondary: "#fff" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#fff" },
                },
              }}
            />
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
