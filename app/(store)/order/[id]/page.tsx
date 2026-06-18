"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Home, FileText } from "lucide-react";
import axios from "axios";
import { useCartStore } from "@/store";

export default function OrderSuccessPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearCart();
    axios.get(`/api/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading order details...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-8">
          Thank you for your purchase. We'll send you a confirmation email shortly.
        </p>

        {order && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 text-left shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <Package className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                <p className="text-sm text-gray-500">{order.items?.length || 0} item(s)</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-bold text-gray-900">₹{Number(order.total).toFixed(2)}</p>
                <span className="text-xs font-medium bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                  {order.status}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {order.items?.slice(0, 3).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.image && <img src={item.image} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">₹{Number(item.total).toFixed(2)}</p>
                </div>
              ))}
              {(order.items?.length || 0) > 3 && (
                <p className="text-xs text-gray-400 text-center">+{order.items.length - 3} more items</p>
              )}
            </div>

            {order.address && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Delivering to:</p>
                <p className="text-sm text-gray-900 font-medium">{order.address.fullName}</p>
                <p className="text-sm text-gray-500">{order.address.addressLine1}, {order.address.city}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {order && (
            <Link href={`/dashboard/orders/${id}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              <FileText className="w-4 h-4" /> Track Order
            </Link>
          )}
          <Link href="/" className="flex-1 btn-primary flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
