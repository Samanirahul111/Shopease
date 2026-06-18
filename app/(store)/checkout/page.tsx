"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard, MapPin, Tag, ChevronRight, ShieldCheck, Plus,
  Wallet, CheckCircle, AlertCircle, Truck, Package, ChevronDown,
} from "lucide-react";
import { useAuthStore, useCartStore } from "@/store";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Address {
  id: string; fullName: string; phone: string; addressLine1: string;
  addressLine2?: string; city: string; state: string; postalCode: string;
  country: string; label: string; isDefault: boolean;
}

type PaymentMethod = "RAZORPAY" | "STRIPE" | "COD" | "WALLET";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("RAZORPAY");
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<{ discount: number; code: string; type: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentAvailability, setPaymentAvailability] = useState({
    onlinePaymentsEnabled: true,
    razorpayEnabled: true,
    stripeEnabled: true,
    codEnabled: true,
    walletEnabled: true,
  });
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState<"address" | "payment" | "review">("address");

  const shippingCost = subtotal > 499 ? 0 : items.some((i) => !i.stock) ? 0 : 49;
  const couponDiscount = couponData?.discount || 0;
  const total = subtotal - couponDiscount + shippingCost;

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login?redirect=/checkout"); return; }
    if (items.length === 0) { router.push("/cart"); return; }

    Promise.all([
      axios.get("/api/user/addresses"),
      axios.get("/api/wallet"),
      axios.get("/api/cart"),
      axios.get("/api/settings"),
    ]).then(([addrRes, walletRes, cartRes, settingsRes]) => {
      const addrs = addrRes.data.data || [];
      setAddresses(addrs);
      const defaultAddr = addrs.find((a: Address) => a.isDefault) || addrs[0];
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
      setWalletBalance(Number(walletRes.data.data?.balance || 0));

      const isOnlinePaymentsAvailable = settingsRes.data.data?.online_payments_available !== "false";
      const razorpayEnabled = isOnlinePaymentsAvailable && settingsRes.data.data?.razorpay_enabled !== "false";
      const stripeEnabled = isOnlinePaymentsAvailable && settingsRes.data.data?.stripe_enabled !== "false";
      const codEnabled = settingsRes.data.data?.cod_available !== "false";
      const walletEnabled = settingsRes.data.data?.wallet_enabled !== "false";

      setPaymentAvailability({
        onlinePaymentsEnabled: isOnlinePaymentsAvailable,
        razorpayEnabled,
        stripeEnabled,
        codEnabled,
        walletEnabled,
      });

      const availableMethods: PaymentMethod[] = [
        ...(razorpayEnabled ? ["RAZORPAY" as const] : []),
        ...(stripeEnabled ? ["STRIPE" as const] : []),
        ...(codEnabled ? ["COD" as const] : []),
        ...(walletEnabled ? ["WALLET" as const] : []),
      ];

      if (!availableMethods.includes(paymentMethod) && availableMethods.length > 0) {
        setPaymentMethod(availableMethods[0]);
      }

      const serverItems = cartRes.data?.data?.items || [];
      if (serverItems.length === 0 && items.length > 0) {
        clearCart();
        toast.error("Cart synchronization failed. Please add items again.");
        router.push("/cart");
      }
    }).catch(() => {});
  }, [isAuthenticated, items.length]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await axios.post("/api/coupons/validate", { code: couponCode, subtotal });
      setCouponData({ discount: res.data.data.coupon.discount, code: couponCode, type: res.data.data.coupon.type });
      toast.success(`Coupon applied! Saved ₹${res.data.data.coupon.discount.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error("Please select a delivery address"); return; }
    setPlacing(true);

    try {
      const orderRes = await axios.post("/api/orders", {
        addressId: selectedAddress,
        paymentMethod,
        couponCode: couponData?.code,
        notes,
      });

      const { orderId, orderNumber } = orderRes.data.data;

      if (paymentMethod === "COD" || paymentMethod === "WALLET") {
        clearCart();
        router.push(`/order/${orderId}?success=true`);
        return;
      }

      if (paymentMethod === "RAZORPAY") {
        const rzpRes = await axios.post("/api/payments/razorpay", { orderId });
        const { razorpayOrderId, amount, currency, keyId } = rzpRes.data.data;

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        script.onload = () => {
          const options = {
            key: keyId,
            amount: amount,
            currency: currency,
            order_id: razorpayOrderId,
            name: "ShopEase",
            description: `Order #${orderNumber}`,
            handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              try {
                await axios.post("/api/payments/verify", {
                  orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                clearCart();
                router.push(`/order/${orderId}?success=true`);
              } catch {
                toast.error("Payment verification failed. Contact support.");
              }
            },
            prefill: { name: user?.name, email: user?.email },
            theme: { color: "#111827" },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          rzp.on("payment.failed", () => {
            toast.error("Payment failed. Please try again.");
          });
        };
      }

      if (paymentMethod === "STRIPE") {
        clearCart();
        router.push(`/checkout/stripe?orderId=${orderId}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const selectedAddr = addresses.find((a) => a.id === selectedAddress);

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <div className="flex items-center gap-2 mt-2">
          {["address", "payment", "review"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => step !== "address" && setStep(s as typeof step)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  step === s ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  step === s ? "bg-white text-gray-900" : "bg-gray-200 text-gray-600"
                }`}>{i + 1}</span>
                {s === "address" ? "Address" : s === "payment" ? "Payment" : "Review"}
              </button>
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Address Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-700" />
                <h2 className="font-bold text-gray-900">Delivery Address</h2>
              </div>
              <Link href="/dashboard/addresses" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add New
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No delivery addresses found</p>
                <Link href="/dashboard/addresses" className="btn-primary">Add Address</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddress === addr.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="mt-1 accent-gray-900"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900">{addr.fullName}</p>
                        <span className="badge bg-gray-100 text-gray-600 text-xs">{addr.label}</span>
                        {addr.isDefault && <span className="badge bg-green-100 text-green-700 text-xs">Default</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">📞 {addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-700" />
              <h2 className="font-bold text-gray-900">Payment Method</h2>
            </div>

            <div className="space-y-3">
              {[
                { value: "RAZORPAY" as const, label: "Razorpay", sub: "Cards, UPI, NetBanking, Wallets", icon: "💳", hidden: !paymentAvailability.razorpayEnabled },
                { value: "STRIPE" as const, label: "Stripe", sub: "International cards, Apple Pay", icon: "💸", hidden: !paymentAvailability.stripeEnabled },
                { value: "COD" as const, label: "Cash on Delivery", sub: total > 50000 ? "Not available for orders above ₹50,000" : "Pay when you receive", icon: "💵", disabled: total > 50000, hidden: !paymentAvailability.codEnabled },
                { value: "WALLET" as const, label: "Wallet", sub: `Balance: ₹${walletBalance.toFixed(2)}`, icon: "👛", disabled: walletBalance < total, hidden: !paymentAvailability.walletEnabled },
              ]
                .filter((method) => !method.hidden)
                .map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    method.disabled ? "opacity-50 cursor-not-allowed" : ""
                  } ${paymentMethod === method.value ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => !method.disabled && setPaymentMethod(method.value)}
                    disabled={method.disabled}
                    className="accent-gray-900"
                  />
                  <span className="text-xl">{method.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{method.label}</p>
                    <p className="text-xs text-gray-500">{method.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-gray-700" />
              <h2 className="font-bold text-gray-900">Coupon Code</h2>
            </div>
            {couponData ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">{couponData.code}</span>
                  <span className="text-sm text-green-600">— Saved ₹{couponData.discount.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { setCouponData(null); setCouponCode(""); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  className="input-field flex-1"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode}
                  className="btn-primary px-5 py-2.5 disabled:opacity-50"
                >
                  {couponLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Apply"}
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-3">Order Notes (Optional)</h2>
            <textarea
              placeholder="Any special instructions for your order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-sm text-gray-900 font-semibold mt-0.5">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className={shippingCost === 0 ? "text-green-600 font-medium" : "font-medium"}>
                  {shippingCost === 0 ? "Free" : `₹${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddress}
              className="w-full btn-primary py-4 text-base disabled:opacity-50"
            >
              {placing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Place Order — ₹{total.toFixed(2)}
                </span>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure checkout powered by 256-bit SSL encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
