"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronRight, Search } from "lucide-react";
import axios from "axios";

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  PENDING: { icon: Clock, color: "text-yellow-600 bg-yellow-50", label: "Pending" },
  CONFIRMED: { icon: CheckCircle, color: "text-blue-600 bg-blue-50", label: "Confirmed" },
  PROCESSING: { icon: Clock, color: "text-indigo-600 bg-indigo-50", label: "Processing" },
  SHIPPED: { icon: Truck, color: "text-cyan-600 bg-cyan-50", label: "Shipped" },
  OUT_FOR_DELIVERY: { icon: Truck, color: "text-orange-600 bg-orange-50", label: "Out for Delivery" },
  DELIVERED: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Delivered" },
  CANCELLED: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Cancelled" },
  REFUNDED: { icon: CheckCircle, color: "text-purple-600 bg-purple-50", label: "Refunded" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set("status", statusFilter);
    axios.get(`/api/orders?${params}`)
      .then((res) => {
        setOrders(res.data.data?.orders || []);
        setTotal(res.data.data?.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const filtered = search
    ? orders.filter((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage your orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-48"
        >
          <option value="">All Status</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 shimmer-line rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="font-semibold text-gray-600">No orders found</p>
            <p className="text-sm text-gray-400 mt-1">When you place orders, they'll appear here</p>
            <Link href="/shop" className="mt-4 inline-block btn-primary">Shop Now</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((order) => {
              const status = statusConfig[order.status] || statusConfig.PENDING;
              const StatusIcon = status.icon;
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl ${status.color} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {order._count?.items || 0} item(s) · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color} mt-1 inline-block`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">₹{Number(order.total).toFixed(2)}</p>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {filtered.length} of {total} orders</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
            >Previous</button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
