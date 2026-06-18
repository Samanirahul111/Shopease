"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Tag, ShoppingBag } from "lucide-react";
import { useAuthStore, useCartStore } from "@/store";
import axios from "axios";
import toast from "react-hot-toast";

interface ServerCartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  product: {
    name: string;
    slug: string;
    thumbnail?: string | null;
    images?: string[];
    stock: number;
  };
  variant?: {
    stock: number;
    attributes?: Record<string, string>;
  } | null;
  price: number;
}

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const { items, updateQuantity, removeItem, clearCart, syncWithServer } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const [coupon, setCoupon] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [discount, setDiscount] = useState<{ code: string; type: string; value: number; discountAmount: number } | null>(null);

  const fetchCart = async () => {
    if (!isAuthenticated) return;

    try {
      setSyncing(true);
      const res = await axios.get("/api/cart");
      const serverItems: ServerCartItem[] = res.data?.data?.items || [];

      const mappedItems = serverItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId || undefined,
        name: item.product.name,
        slug: item.product.slug,
        image: item.product.thumbnail || item.product.images?.[0],
        price: Number(item.price),
        quantity: item.quantity,
        stock: item.variant?.stock ?? item.product.stock,
        attributes: item.variant?.attributes,
      }));

      syncWithServer(mappedItems);
    } catch {
      toast.error("Failed to sync cart");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const res = await axios.post("/api/coupons/validate", { code: coupon, orderAmount: subtotal });
      setDiscount(res.data.data);
      toast.success(`Coupon applied! You save ₹${res.data.data.discountAmount.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid coupon");
    } finally { setCouponLoading(false); }
  };

  const removeCoupon = () => { setDiscount(null); setCoupon(""); };

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    const safeQuantity = Math.max(1, quantity);
    updateQuantity(id, safeQuantity);

    try {
      await axios.put(`/api/cart/${id}`, { quantity: safeQuantity });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update cart item");
      fetchCart();
    }
  };

  const handleRemoveItem = async (id: string) => {
    removeItem(id);
    try {
      await axios.delete(`/api/cart/${id}`);
      toast.success("Item removed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove item");
      fetchCart();
    }
  };

  const handleClearCart = async () => {
    clearCart();
    try {
      await axios.delete("/api/cart");
      toast.success("Cart cleared");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to clear cart");
      fetchCart();
    }
  };

  const finalTotal = subtotal - (discount?.discountAmount || 0);
  const shipping = finalTotal >= 999 ? 0 : 49;
  const grandTotal = finalTotal + shipping;

  if (!syncing && itemCount === 0) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add items to your cart to get started</p>
        <Link href="/shop" className="btn-primary flex items-center gap-2 justify-center">
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <button onClick={handleClearCart}
          className="text-sm text-gray-500 hover:text-red-500 transition">Clear cart</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 shadow-sm">
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                {item.attributes && Object.keys(item.attributes).length > 0 && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
                  </p>
                )}
                <p className="font-bold text-gray-900 mt-2">₹{Number(item.price).toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => handleRemoveItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1">
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="font-bold text-sm">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Apply Coupon
            </h3>
            {discount ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                <div>
                  <span className="font-mono font-bold text-green-800">{discount.code}</span>
                  <p className="text-xs text-green-600 mt-0.5">-₹{discount.discountAmount.toFixed(2)} saved</p>
                </div>
                <button onClick={removeCoupon} className="text-red-500 text-sm hover:underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Enter code" className="input-field flex-1" />
                <button onClick={applyCoupon} disabled={couponLoading || !coupon.trim()}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition">
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal ({itemCount} items)</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discount && (
                <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-₹{discount.discountAmount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `₹${shipping}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Add ₹{(999 - finalTotal).toFixed(0)} more for free shipping</p>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span><span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <Link href="/checkout" className="w-full btn-primary flex items-center justify-center gap-2 mt-2">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/shop" className="w-full text-center text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1 mt-1">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
