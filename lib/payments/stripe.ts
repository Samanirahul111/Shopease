import Stripe from "stripe";
import { env, requireFeature } from "@/lib/config/env";

// Validate Stripe configuration
requireFeature("stripe", "initialize Stripe payment gateway");

export const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

export async function createStripePaymentIntent(params: {
  amount: number; // in smallest currency unit (paise for INR)
  currency: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100), // convert to paise
    currency: params.currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      ...params.metadata,
    },
    receipt_email: params.customerEmail,
    description: `Order #${params.orderNumber}`,
  });

  return paymentIntent;
}

export async function confirmStripePayment(paymentIntentId: string) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function createStripeRefund(params: {
  paymentIntentId: string;
  amount?: number; // partial refund amount in INR
  reason?: Stripe.RefundCreateParams.Reason;
}) {
  return stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amount ? Math.round(params.amount * 100) : undefined,
    reason: params.reason || "requested_by_customer",
  });
}

export async function constructStripeEvent(payload: string | Buffer, signature: string) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET!
  );
}
