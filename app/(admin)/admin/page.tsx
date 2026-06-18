"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, DollarSign, ShoppingCart, Users, AlertTriangle,
  Clock, CheckCircle, Package, ArrowUp, ArrowDown, ExternalLink,
  BarChart3, RefreshCw,
} from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  newCustomers: number;
  todayRevenue: number;
  todayOrders: number;
  pendingWithdrawals: number;
  avgOrderValue: string;
  ordersByStatus: Record<string, number>;
  revenueByDay: Array<{ date: string; orders: number; revenue: number }>;
  topProducts: Array<{ id: string; name: string; totalSold: number; revenue: number; price: number }>;
  recentOrders: Array<{
    id: string; orderNumber: string; total: number; status: string;
    createdAt: string; user: { name: string; email: string }; _count: { items: number };
  }>;
  lowStockProducts: Array<{ id: string; name: string; sku: string; stock: number; lowStockAlert: number; thumbnail?: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [paymentSettings, setPaymentSettings] = useState({
    online_payments_available: true,
    razorpay_enabled: true,
    stripe_enabled: true,
    cod_available: true,
    wallet_enabled: true,
  });
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/analytics?period=${period}`);
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await axios.get("/api/admin/settings");
      const ordersSettings = res.data?.data?.orders || [];

      const settingsMap = ordersSettings.reduce((acc: Record<string, string>, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      setPaymentSettings({
        online_payments_available: settingsMap.online_payments_available !== "false",
        razorpay_enabled: settingsMap.razorpay_enabled !== "false",
        stripe_enabled: settingsMap.stripe_enabled !== "false",
        cod_available: settingsMap.cod_available !== "false",
        wallet_enabled: settingsMap.wallet_enabled !== "false",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const savePaymentSettings = async () => {
    setSavingPaymentSettings(true);
    try {
      await axios.put("/api/admin/settings", {
        settings: [
          { key: "online_payments_available", value: String(paymentSettings.online_payments_available), type: "boolean", group: "orders" },
          { key: "razorpay_enabled", value: String(paymentSettings.razorpay_enabled), type: "boolean", group: "orders" },
          { key: "stripe_enabled", value: String(paymentSettings.stripe_enabled), type: "boolean", group: "orders" },
          { key: "cod_available", value: String(paymentSettings.cod_available), type: "boolean", group: "orders" },
          { key: "wallet_enabled", value: String(paymentSettings.wallet_enabled), type: "boolean", group: "orders" },
        ],
      });
      toast.success("Payment settings updated");
    } catch (error) {
      toast.error("Failed to update payment settings");
    } finally {
      setSavingPaymentSettings(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchPaymentSettings();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 shimmer-line rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 shimmer-line rounded-2xl" />
          <div className="h-64 shimmer-line rounded-2xl" />
        </div>
      </div>
    );
  }

  const { recentOrders = [], lowStockProducts = [], topProducts = [], ordersByStatus = {} } = analytics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            {["7d", "30d", "90d", "1y"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  period === p ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Revenue",
            value: `₹${(analytics?.totalRevenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            sub: `₹${(analytics?.todayRevenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} today`,
            icon: DollarSign,
            color: "bg-green-100 text-green-700",
            trend: "up",
          },
          {
            title: "Total Orders",
            value: (analytics?.totalOrders || 0).toLocaleString(),
            sub: `${analytics?.todayOrders || 0} today`,
            icon: ShoppingCart,
            color: "bg-blue-100 text-blue-700",
            trend: "up",
          },
          {
            title: "Total Customers",
            value: (analytics?.totalCustomers || 0).toLocaleString(),
            sub: `${analytics?.newCustomers || 0} new`,
            icon: Users,
            color: "bg-purple-100 text-purple-700",
            trend: "up",
          },
          {
            title: "Avg Order Value",
            value: `₹${parseFloat(analytics?.avgOrderValue || "0").toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            sub: `${analytics?.totalCustomers ? ((analytics.totalOrders / analytics.totalCustomers) * 100).toFixed(1) : "0"}% conversion`,
            icon: TrendingUp,
            color: "bg-amber-100 text-amber-700",
            trend: "neutral",
          },
        ].map(({ title, value, sub, icon: Icon, color, trend }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              {trend === "up" && <ArrowUp className="w-4 h-4 text-green-500" />}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{title}</p>
          </div>
        ))}
      </div>

      {/* Order Status Summary */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(ordersByStatus).slice(0, 6).map(([status, count]) => (
          <div key={status} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}>
              {status.replace(/_/g, " ")}
            </span>
            <span className="text-xl font-bold text-gray-900">{count}</span>
            <Link href={`/admin/orders?status=${status}`} className="ml-auto text-gray-400 hover:text-gray-900">
              <BarChart3 className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-gray-900">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.slice(0, 8).map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">#{order.orderNumber}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{order.user.name} · {order._count.items} items</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm text-gray-900">₹{Number(order.total).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-gray-900 text-sm">Low Stock</h3>
              </div>
              <Link href="/admin/products" className="text-xs text-gray-500 hover:text-gray-900">View all →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {lowStockProducts.slice(0, 5).map((p) => (
                <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400 m-auto mt-2.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">SKU: {p.sku}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    p.stock === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {p.stock} left
                  </span>
                </Link>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="text-center text-xs text-gray-500 py-6">All products are well stocked</p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Top Products</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {topProducts.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.totalSold} sold</p>
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    ₹{Number(p.revenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center text-xs text-gray-500 py-6">No sales data available</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">Payment Methods</h3>
              <button
                onClick={savePaymentSettings}
                disabled={savingPaymentSettings}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {savingPaymentSettings ? "Saving..." : "Save"}
              </button>
            </div>

            <div className="space-y-2">
              {[
                { key: "online_payments_available", label: "Online Payments" },
                { key: "razorpay_enabled", label: "Razorpay" },
                { key: "stripe_enabled", label: "Stripe" },
                { key: "cod_available", label: "Cash on Delivery" },
                { key: "wallet_enabled", label: "Wallet" },
              ].map((item) => {
                const disabled =
                  !paymentSettings.online_payments_available &&
                  (item.key === "razorpay_enabled" || item.key === "stripe_enabled");

                return (
                  <label key={item.key} className={`flex items-center justify-between text-sm ${disabled ? "opacity-50" : ""}`}>
                    <span className="text-gray-700">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={paymentSettings[item.key as keyof typeof paymentSettings]}
                      disabled={disabled}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-gray-900"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { href: "/admin/products/new", label: "Add New Product", icon: Package },
                { href: "/admin/orders", label: "Manage Orders", icon: ShoppingCart },
                { href: "/admin/coupons", label: "Create Coupon", icon: Clock },
                { href: "/admin/withdrawals", label: "Withdrawals", icon: DollarSign },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Withdrawals Alert */}
      {(analytics?.pendingWithdrawals || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">
                {analytics?.pendingWithdrawals} pending withdrawal request(s)
              </p>
              <p className="text-sm text-amber-700">Review and process withdrawal requests</p>
            </div>
          </div>
          <Link href="/admin/withdrawals" className="btn-primary bg-amber-600 hover:bg-amber-700 text-sm px-4 py-2">
            Review →
          </Link>
        </div>
      )}
    </div>
  );
}
