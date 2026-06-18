"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, ShoppingBag, Users, DollarSign, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import axios from "axios";

const COLORS = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/analytics?period=${period}`)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !data) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 shimmer-line rounded-2xl" />)}
      </div>
      <div className="h-80 shimmer-line rounded-2xl" />
    </div>
  );

  const metrics = [
    { label: "Total Revenue", value: `₹${Number(data.totalRevenue || 0).toLocaleString("en-IN")}`, icon: DollarSign, change: data.revenueChange, color: "bg-green-50 text-green-700" },
    { label: "Total Orders", value: data.totalOrders || 0, icon: ShoppingBag, change: data.ordersChange, color: "bg-blue-50 text-blue-700" },
    { label: "New Customers", value: data.newCustomers || 0, icon: Users, change: data.customersChange, color: "bg-purple-50 text-purple-700" },
    { label: "Avg Order Value", value: `₹${Number(data.avgOrderValue || 0).toFixed(0)}`, icon: TrendingUp, change: null, color: "bg-orange-50 text-orange-700" },
  ];

  const orderStatusData = [
    { name: "Delivered", value: data.ordersByStatus?.DELIVERED || 0 },
    { name: "Pending", value: data.ordersByStatus?.PENDING || 0 },
    { name: "Cancelled", value: data.ordersByStatus?.CANCELLED || 0 },
    { name: "Processing", value: data.ordersByStatus?.PROCESSING || 0 },
    { name: "Shipped", value: data.ordersByStatus?.SHIPPED || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track your store performance</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[{ v: "7d", l: "7D" }, { v: "30d", l: "30D" }, { v: "90d", l: "90D" }, { v: "1y", l: "1Y" }].map(({ v, l }) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${period === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, change, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? "—" : value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            {change !== null && change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {Math.abs(change)}% vs prev period
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {data.revenueByDay?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Revenue Over Time</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.revenueByDay} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        {data.revenueByDay?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Orders Over Time</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.revenueByDay} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#111827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Order Status Pie */}
        {orderStatusData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Order Status Distribution</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="value" paddingAngle={3}>
                  {orderStatusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(value) => <span style={{ fontSize: 12, color: "#6B7280" }}>{value}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Products */}
      {data.topProducts?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Top Products</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.topProducts.map((product: any, i: number) => (
              <div key={product.id} className="flex items-center gap-4 p-4">
                <span className="w-8 text-center font-bold text-gray-400 text-sm">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{product.totalSold} units sold</p>
                </div>
                <p className="font-bold text-gray-900 text-sm">₹{Number(product.price).toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
