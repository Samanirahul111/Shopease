"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Heart, MapPin, Wallet, ArrowRight, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { useAuthStore } from "@/store";
import axios from "axios";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ orders: 0, wishlist: 0, addresses: 0, walletBalance: "0" });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("/api/orders?limit=5"),
      axios.get("/api/wallet"),
      axios.get("/api/wishlist"),
      axios.get("/api/user/addresses"),
    ]).then(([ordersRes, walletRes, wishlistRes, addrRes]) => {
      setRecentOrders(ordersRes.data.data?.orders || []);
      setStats({
        orders: ordersRes.data.data?.pagination?.total || 0,
        wishlist: wishlistRes.data.data?.length || 0,
        addresses: addrRes.data.data?.length || 0,
        walletBalance: Number(walletRes.data.data?.balance || 0).toFixed(2),
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { href: "/dashboard/orders", label: "My Orders", icon: Package, value: stats.orders, color: "bg-blue-50 text-blue-700" },
    { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart, value: stats.wishlist, color: "bg-pink-50 text-pink-700" },
    { href: "/dashboard/addresses", label: "Addresses", icon: MapPin, value: stats.addresses, color: "bg-purple-50 text-purple-700" },
    { href: "/dashboard/wallet", label: "Wallet Balance", icon: Wallet, value: `₹${stats.walletBalance}`, color: "bg-green-50 text-green-700" },
  ];

  const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
    PENDING: { icon: Clock, color: "text-yellow-600 bg-yellow-50", label: "Pending" },
    CONFIRMED: { icon: CheckCircle, color: "text-blue-600 bg-blue-50", label: "Confirmed" },
    PROCESSING: { icon: Clock, color: "text-indigo-600 bg-indigo-50", label: "Processing" },
    SHIPPED: { icon: Truck, color: "text-cyan-600 bg-cyan-50", label: "Shipped" },
    DELIVERED: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Delivered" },
    CANCELLED: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Cancelled" },
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-300 mt-1 text-sm">Here's what's happening with your account</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map(({ href, label, icon: Icon, value, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? "—" : value}</p>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              {label}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 shimmer-line rounded-xl" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No orders yet</p>
            <p className="text-sm text-gray-400 mt-1">Your orders will appear here</p>
            <Link href="/shop" className="mt-4 inline-block btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.PENDING;
              const StatusIcon = status.icon;
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl ${status.color} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order._count?.items || order.items?.length || 0} item(s) · {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-gray-900">₹{Number(order.total).toFixed(2)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
