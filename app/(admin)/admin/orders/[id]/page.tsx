"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard, Save, Truck } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const orderStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];
const statusColors: Record<string, string> = {
  PENDING: "text-yellow-600 bg-yellow-50", CONFIRMED: "text-blue-600 bg-blue-50",
  PROCESSING: "text-indigo-600 bg-indigo-50", SHIPPED: "text-cyan-600 bg-cyan-50",
  OUT_FOR_DELIVERY: "text-orange-600 bg-orange-50", DELIVERED: "text-green-600 bg-green-50",
  CANCELLED: "text-red-600 bg-red-50", REFUNDED: "text-purple-600 bg-purple-50",
};

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: "", trackingNumber: "", trackingUrl: "", carrier: "", cancelReason: "", refundAmount: "" });

  useEffect(() => {
    axios.get(`/api/orders/${id}`)
      .then((res) => {
        const o = res.data.data;
        setOrder(o);
        setStatusForm((f) => ({ ...f, status: o.status, trackingNumber: o.trackingNumber || "", trackingUrl: o.trackingUrl || "", carrier: o.carrier || "" }));
      })
      .catch(() => router.push("/admin/orders"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload: any = { status: statusForm.status };
      if (statusForm.trackingNumber) payload.trackingNumber = statusForm.trackingNumber;
      if (statusForm.trackingUrl) payload.trackingUrl = statusForm.trackingUrl;
      if (statusForm.carrier) payload.carrier = statusForm.carrier;
      if (statusForm.cancelReason) payload.cancelReason = statusForm.cancelReason;
      if (statusForm.refundAmount) payload.refundAmount = Number(statusForm.refundAmount);

      await axios.put(`/api/orders/${id}`, payload);
      toast.success("Order updated");
      // Refresh
      const res = await axios.get(`/api/orders/${id}`);
      setOrder(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update order");
    } finally { setUpdating(false); }
  };

  if (loading) return (
    <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 shimmer-line rounded-2xl" />)}</div>
  );
  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
        </div>
        <span className={`ml-auto text-sm font-medium px-3 py-1.5 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - Order Items + Status Update */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100">
              <Package className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Order Items ({order.items?.length || 0})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 p-4">
                  {item.image && <img src={item.image} alt={item.productName} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{item.productName}</p>
                    {item.attributes && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {Object.entries(item.attributes as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku} · Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">₹{Number(item.total).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">@ ₹{Number(item.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Update Status Form */}
          <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Update Order</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} className="input-field w-full">
                  {orderStatuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Carrier</label>
                <input type="text" value={statusForm.carrier} onChange={(e) => setStatusForm({ ...statusForm, carrier: e.target.value })}
                  placeholder="Delhivery, BlueDart..." className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tracking Number</label>
                <input type="text" value={statusForm.trackingNumber} onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                  className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tracking URL</label>
                <input type="url" value={statusForm.trackingUrl} onChange={(e) => setStatusForm({ ...statusForm, trackingUrl: e.target.value })}
                  className="input-field w-full" />
              </div>
              {["CANCELLED", "REFUNDED", "REFUND_REQUESTED"].includes(statusForm.status) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cancel Reason</label>
                    <input type="text" value={statusForm.cancelReason} onChange={(e) => setStatusForm({ ...statusForm, cancelReason: e.target.value })}
                      className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Refund Amount (₹)</label>
                    <input type="number" value={statusForm.refundAmount} onChange={(e) => setStatusForm({ ...statusForm, refundAmount: e.target.value })}
                      placeholder={`Max: ${Number(order.total).toFixed(2)}`} className="input-field w-full" min="0" max={Number(order.total)} />
                  </div>
                </>
              )}
            </div>
            <button type="submit" disabled={updating} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {updating ? "Updating..." : "Update Order"}
            </button>
          </form>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.user?.name}</p>
              <p>{order.user?.email}</p>
              {order.user?.phone && <p>{order.user.phone}</p>}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Price Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{Number(order.discount).toFixed(2)}</span></div>}
              {Number(order.couponDiscount) > 0 && <div className="flex justify-between text-green-600"><span>Coupon ({order.couponCode})</span><span>-₹{Number(order.couponDiscount).toFixed(2)}</span></div>}
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{Number(order.shippingCost) === 0 ? "Free" : `₹${Number(order.shippingCost).toFixed(2)}`}</span></div>
              {Number(order.tax) > 0 && <div className="flex justify-between text-gray-600"><span>Tax</span><span>₹{Number(order.tax).toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total</span><span>₹{Number(order.total).toFixed(2)}</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{order.paymentMethod?.replace("_", " ")}</span>
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${order.paymentStatus === "COMPLETED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          {order.address && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Shipping Address</h2>
              </div>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-900">{order.address.fullName}</p>
                <p>{order.address.addressLine1}</p>
                {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
                <p>{order.address.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
