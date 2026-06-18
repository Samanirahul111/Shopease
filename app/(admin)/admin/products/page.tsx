"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Eye, Filter, Package, RefreshCw, ChevronDown, Image } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface Product {
  id: string; name: string; slug: string; sku: string; price: number;
  comparePrice?: number; stock: number; status: string; thumbnail?: string;
  totalSold: number; avgRating: number; featured: boolean;
  category: { name: string }; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DRAFT: "bg-gray-100 text-gray-700",
  INACTIVE: "bg-yellow-100 text-yellow-700",
  OUT_OF_STOCK: "bg-red-100 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(), limit: "20",
        ...(search && { search }),
        ...(status && { status }),
      });
      const res = await axios.get(`/api/admin/products?${params}`);
      setProducts(res.data.data?.products || []);
      setTotal(res.data.data?.pagination?.total || 0);
      setTotalPages(res.data.data?.pagination?.pages || 1);
    } catch {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"? It will no longer be visible in the store.`)) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success("Product archived");
      fetchProducts();
    } catch {
      toast.error("Failed to archive product");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await axios.put(`/api/products/${id}`, { status: newStatus });
      toast.success("Product status updated");
      fetchProducts();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{total} products total</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white"
            >
              <option value="">All Status</option>
              {["ACTIVE", "DRAFT", "INACTIVE", "OUT_OF_STOCK", "ARCHIVED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={fetchProducts} className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50">
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
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 w-10">
                    <input type="checkbox" className="rounded" onChange={(e) => setSelectedIds(e.target.checked ? products.map((p) => p.id) : [])} />
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500">Product</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">SKU</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Price</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Stock</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-gray-500">Sold</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs font-mono text-gray-600">{product.sku}</td>
                    <td className="px-3 py-4">
                      <p className="text-sm font-semibold text-gray-900">₹{Number(product.price).toFixed(2)}</p>
                      {product.comparePrice && (
                        <p className="text-xs text-gray-400 line-through">₹{Number(product.comparePrice).toFixed(2)}</p>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <span className={`text-sm font-semibold ${product.stock <= 5 ? "text-red-600" : product.stock <= 15 ? "text-orange-600" : "text-gray-900"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="relative">
                        <select
                          value={product.status}
                          onChange={(e) => handleStatusUpdate(product.id, e.target.value)}
                          className={`appearance-none text-xs font-medium px-3 py-1.5 rounded-xl border-0 focus:outline-none cursor-pointer pr-6 ${STATUS_COLORS[product.status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {["ACTIVE", "DRAFT", "INACTIVE", "OUT_OF_STOCK"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600">{product.totalSold}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/product/${product.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/products/${product.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Archive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="py-16 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No products found</p>
                <Link href="/admin/products/new" className="mt-3 inline-flex items-center gap-2 btn-primary text-sm">
                  <Plus className="w-4 h-4" /> Add First Product
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">
                Previous
              </button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
