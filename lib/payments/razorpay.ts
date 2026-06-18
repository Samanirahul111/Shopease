import Razorpay from "razorpay";
import crypto from "crypto";
import { env, requireFeature } from "@/lib/config/env";

let _razorpay: Razorpay | undefined;

function getRazorpay(): Razorpay {
  requireFeature("razorpay", "initialize Razorpay payment gateway");
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID!,
      key_secret: env.RAZORPAY_KEY_SECRET!,
    });
  }
  return _razorpay;
}

export async function createRazorpayOrder(params: {
  amount: number; // in INR
  currency: string;
  orderId: string;
  orderNumber: string;
  notes?: Record<string, string>;
}) {
  const order = await getRazorpay().orders.create({
    amount: Math.round(params.amount * 100), // convert to paise
    currency: params.currency.toUpperCase(),
    receipt: params.orderNumber,
    notes: {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      ...params.notes,
    },
  });

  return order;
}

export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  return expectedSignature === params.razorpaySignature;
}

export async function createRazorpayRefund(params: {
  paymentId: string;
  amount?: number; // in INR, partial refund
  notes?: Record<string, string>;
}) {
  return getRazorpay().payments.refund(params.paymentId, {
    amount: params.amount ? Math.round(params.amount * 100) : undefined,
    notes: params.notes,
    speed: "normal",
  });
}

export async function fetchRazorpayPayment(paymentId: string) {
  return getRazorpay().payments.fetch(paymentId);
}
