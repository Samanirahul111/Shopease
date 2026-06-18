"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Search, ChevronRight, Shield, Ban, CheckCircle, Mail } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  INACTIVE: "bg-gray-50 text-gray-600",
  SUSPENDED: "bg-yellow-50 text-yellow-700",
  BANNED: "bg-red-50 text-red-700",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 20;

  const fetchCustomers = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    axios.get(`/api/admin/customers?${params}`)
      .then((res) => {
        setCustomers(res.data.data?.customers || []);
        setTotal(res.data.data?.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchCustomers(); };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.put(`/api/admin/customers/${id}`, { status });
      fetchCustomers();
      toast.success("Customer status updated");
    } catch { toast.error("Failed to update status"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} total customers</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 w-full" />
        </form>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-full sm:w-40">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Phone</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Orders</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Joined</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-8 shimmer-line rounded-lg" /></td></tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">No customers found</td></tr>
              ) : customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {customer.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{customer.phone || "—"}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 font-medium">{customer._count?.orders || 0}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{new Date(customer.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[customer.status] || "bg-gray-50 text-gray-600"}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {customer.status === "ACTIVE" ? (
                        <button onClick={() => updateStatus(customer.id, "SUSPENDED")}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition" title="Suspend">
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => updateStatus(customer.id, "ACTIVE")}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Activate">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <a href={`mailto:${customer.email}`} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="Email">
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {customers.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
