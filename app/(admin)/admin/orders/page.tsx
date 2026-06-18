"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, RefreshCw, ChevronDown, Eye, Package, Download } from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

interface Order {
  id: string; orderNumber: string; total: number; status: string;
  paymentStatus: string; paymentMethod: string; createdAt: string;
  user: { name: string; email: string };
  _count: { items: number };
  payment?: { method: string; status: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
  REFUND_REQUESTED: "bg-orange-100 text-orange-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-600",
  COMPLETED: "text-green-600",
  FAILED: "text-red-600",
  REFUNDED: "text-gray-600",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(), limit: "20",
        ...(search && { search }),
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      });
      const res = await axios.get(`/api/admin/orders?${params}`);
      setOrders(res.data.data?.orders || []);
      setTotal(res.data.data?.pagination?.total || 0);
      setTotalPages(res.data.data?.pagination?.pages || 1);
    } catch {}
    finally { setLoading(false); }
  }, [page, search, status, paymentStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{total} orders total</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search order#, customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          {[
            { value: status, setter: setStatus, options: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"], placeholder: "All Status" },
            { value: paymentStatus, setter: setPaymentStatus, options: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"], placeholder: "Payment Status" },
          ].map((filter, i) => (
            <div key={i} className="relative">
              <select
                value={filter.value}
                onChange={(e) => { filter.setter(e.target.value); setPage(1); }}
                className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white"
              >
                <option value="">{filter.placeholder}</option>
                {filter.options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          ))}
          <button onClick={fetchOrders} className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 shimmer-line rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500">Order</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Payment</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Items</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Total</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900 font-mono">#{order.orderNumber}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-sm font-medium text-gray-900">{order.user.name}</p>
                      <p className="text-xs text-gray-400">{order.user.email}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <p className={`text-xs font-semibold ${PAYMENT_STATUS_COLORS[order.paymentStatus] || "text-gray-600"}`}>
                        {order.paymentStatus}
                      </p>
                      <p className="text-xs text-gray-400">{order.paymentMethod}</p>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600">{order._count.items}</td>
                    <td className="px-3 py-4">
                      <p className="text-sm font-bold text-gray-900">₹{Number(order.total).toFixed(2)}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-medium"
                      >
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="py-16 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No orders found</p>
              </div>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} total</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">Previous</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
