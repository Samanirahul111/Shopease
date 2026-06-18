"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Heart, MapPin, Bell, Wallet,
  User, LogOut, ChevronRight, Menu, X,
} from "lucide-react";
import { useAuthStore } from "@/store";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "My Orders", icon: Package },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/addresses", label: "Addresses", icon: MapPin },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login?redirect=/dashboard");
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } finally {
      logout();
      router.push("/");
      toast.success("Logged out");
    }
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Profile */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-gray-900 to-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <span className="text-white text-lg font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-300 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="p-3">
                {navItems.map(({ href, label, icon: Icon, exact }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                      isActive(href, exact)
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                    {isActive(href, exact) && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full mt-2 border-t border-gray-100 pt-3"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
