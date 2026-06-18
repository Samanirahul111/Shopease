"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { category: "Orders", items: [
    { q: "How do I track my order?", a: "Once your order is shipped, you'll receive a tracking number via email. You can also track it from your dashboard under 'My Orders'." },
    { q: "Can I cancel or modify my order?", a: "Orders can be cancelled within 1 hour of placement if they haven't been processed yet. Contact our support team immediately." },
    { q: "What if I receive a damaged item?", a: "Please take photos and contact us within 48 hours of delivery. We'll arrange a replacement or full refund." },
  ]},
  { category: "Payments", items: [
    { q: "What payment methods do you accept?", a: "We accept Credit/Debit cards, UPI, Net Banking, Wallets, and Cash on Delivery (COD) for eligible orders." },
    { q: "Is my payment information secure?", a: "Yes. We use industry-standard encryption and never store your card details. All payments are processed through certified payment gateways." },
    { q: "When will I be charged?", a: "For online payments, you're charged immediately. For COD, payment is collected upon delivery." },
  ]},
  { category: "Shipping", items: [
    { q: "What are the delivery charges?", a: "Delivery is free for orders above ₹999. Orders below this threshold incur a flat ₹49 shipping fee." },
    { q: "How long does delivery take?", a: "Standard delivery takes 3-5 business days. Express delivery (1-2 days) is available in select cities." },
    { q: "Do you ship pan-India?", a: "Yes, we ship to over 500 cities across India. Remote locations may take additional days." },
  ]},
  { category: "Returns & Refunds", items: [
    { q: "What is your return policy?", a: "We offer a 7-day hassle-free return policy. Items must be unused, in original packaging with all tags intact." },
    { q: "How do I initiate a return?", a: "Go to My Orders, select the item, and click 'Return'. Our team will schedule a pickup within 24-48 hours." },
    { q: "When will I receive my refund?", a: "Refunds are processed within 5-7 business days after we receive the returned item. Amount is credited to original payment method or wallet." },
  ]},
  { category: "Account & Wallet", items: [
    { q: "What is the wallet feature?", a: "ShopEase Wallet lets you store refunds and use them for future purchases. It also earns you referral bonuses." },
    { q: "Can I withdraw wallet balance?", a: "Yes! You can request a withdrawal to your bank account or UPI ID. Minimum withdrawal amount is ₹100." },
    { q: "How does the referral program work?", a: "Share your unique referral code with friends. When they make their first purchase, both of you earn bonus wallet credits." },
  ]},
];

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Orders");

  const categoryFaqs = faqs.find((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-300">Find answers to common questions about our products and services.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {faqs.map(({ category }) => (
            <button key={category} onClick={() => { setActiveCategory(category); setOpenItem(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeCategory === category ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {categoryFaqs?.items.map(({ q, a }) => (
            <div key={q} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenItem(openItem === q ? null : q)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-900 pr-4">{q}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openItem === q ? "rotate-180" : ""}`} />
              </button>
              {openItem === q && (
                <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-500 mb-6">Our support team is ready to help you.</p>
          <a href="/contact" className="btn-primary">Contact Support</a>
        </div>
      </div>
    </div>
  );
}
