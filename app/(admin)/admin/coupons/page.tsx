"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const emptyForm = {
  code: "", name: "", description: "", type: "PERCENTAGE", value: "",
  minOrderAmount: "", maxDiscount: "", usageLimit: "", perUserLimit: "1",
  startDate: "", endDate: "", isActive: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = () => {
    axios.get("/api/admin/coupons")
      .then((res) => setCoupons(res.data.data?.coupons || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/admin/coupons", {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        value: form.type === "FREE_SHIPPING" ? 0 : Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: Number(form.perUserLimit),
        isActive: form.isActive,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      });
      toast.success("Coupon created");
      setShowForm(false);
      setForm(emptyForm);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create coupon");
    } finally { setSubmitting(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.put(`/api/admin/coupons/${id}`, { isActive: !isActive });
      fetchCoupons();
    } catch { toast.error("Failed to update coupon"); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await axios.delete(`/api/admin/coupons/${id}`);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch { toast.error("Failed to delete coupon"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Manage discount codes and promotions</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">New Coupon</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="input-field w-full font-mono" placeholder="SAVE20" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field w-full" placeholder="Summer Sale" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field w-full">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value {form.type === "PERCENTAGE" ? "(%)" : form.type === "FREE_SHIPPING" ? "(N/A)" : "(₹)"} *
              </label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="input-field w-full" placeholder={form.type === "PERCENTAGE" ? "20" : "100"}
                disabled={form.type === "FREE_SHIPPING"} required={form.type !== "FREE_SHIPPING"} min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
              <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                className="input-field w-full" placeholder="Optional" min="0" />
            </div>
            {form.type === "PERCENTAGE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  className="input-field w-full" placeholder="Optional" min="0" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
              <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                className="input-field w-full" placeholder="Unlimited" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
              <input type="number" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                className="input-field w-full" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input-field w-full" />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 btn-primary">
                {submitting ? "Creating..." : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Code</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Discount</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Usage</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Expiry</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-8 shimmer-line rounded-lg" /></td></tr>
                ))
              ) : coupons.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">No coupons found</td></tr>
              ) : coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-mono font-bold text-sm text-gray-900">{coupon.code}</p>
                    <p className="text-xs text-gray-500">{coupon.name}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {coupon.type === "FREE_SHIPPING" ? "Free Shipping" :
                     coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `₹${coupon.value}`}
                    {coupon.minOrderAmount && <p className="text-xs text-gray-400">Min ₹{coupon.minOrderAmount}</p>}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${coupon.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(coupon.id, coupon.isActive)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                        {coupon.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                      </button>
                      <button onClick={() => deleteCoupon(coupon.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
