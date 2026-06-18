"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, Truck, XCircle, Download } from "lucide-react";
import axios from "axios";

const statusSteps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

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

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => router.push("/dashboard/orders"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 shimmer-line rounded-2xl" />)}
    </div>
  );

  if (!order) return null;

  const status = statusConfig[order.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          {status.label}
        </div>
      </div>

      {/* Progress Tracker */}
      {!["CANCELLED", "REFUNDED", "FAILED"].includes(order.status) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Order Progress</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: currentStep >= 0 ? `${(currentStep / (statusSteps.length - 1)) * 100}%` : "0%" }}
              />
            </div>
            {statusSteps.map((step, i) => (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i <= currentStep ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-300 text-gray-400"
                }`}>
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center hidden sm:block">
                  {statusConfig[step]?.label || step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking Info */}
      {order.trackingNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
          <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Tracking Number: {order.trackingNumber}</p>
            {order.carrier && <p className="text-sm text-blue-700">Carrier: {order.carrier}</p>}
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                Track your package
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Order Items ({order.items?.length || 0})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="p-4 flex gap-4">
                  {item.image && (
                    <img src={item.image} alt={item.productName} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {item.attributes && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {Object.entries(item.attributes as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">SKU: {item.sku} · Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{Number(item.total).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">₹{Number(item.price).toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Price Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{Number(order.discount).toFixed(2)}</span></div>
              )}
              {Number(order.couponDiscount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({order.couponCode})</span><span>-₹{Number(order.couponDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{Number(order.shippingCost) === 0 ? "Free" : `₹${Number(order.shippingCost).toFixed(2)}`}</span></div>
              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-gray-600"><span>Tax</span><span>₹{Number(order.tax).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span><span>₹{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Payment</h2>
            </div>
            <p className="text-sm text-gray-600">{order.paymentMethod?.replace("_", " ")}</p>
            <span className={`text-xs font-medium px-2 py-1 rounded-full mt-2 inline-block ${
              order.paymentStatus === "COMPLETED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
            }`}>
              {order.paymentStatus}
            </span>
          </div>

          {/* Shipping Address */}
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
