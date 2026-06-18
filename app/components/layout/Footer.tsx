"use client";

import Link from "next/link";
import { Package, Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Subscribed! You'll receive our latest deals.");
    setEmail("");
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter */}
      <div className="border-b border-gray-800">
        <div className="page-container py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white">Subscribe to our newsletter</h3>
              <p className="text-sm text-gray-400 mt-1">Get the latest deals, new arrivals, and exclusive offers.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
              />
              <button type="submit" className="px-5 py-3 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2">
                Subscribe <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-gray-900" />
              </div>
              <span className="text-xl font-bold text-white">Shop<span className="text-green-400">Ease</span></span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one-stop destination for premium products. Quality guaranteed, delivered with care.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { icon: Facebook, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Youtube, href: "#" },
              ].map(({ icon: Icon, href }) => (
                <a key={href} href={href} className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {[
                { label: "All Products", href: "/shop" },
                { label: "New Arrivals", href: "/shop?new=true" },
                { label: "Best Sellers", href: "/shop?bestSeller=true" },
                { label: "Featured", href: "/shop?featured=true" },
                { label: "Sale", href: "/shop?sale=true" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-white mb-4">Customer Service</h4>
            <ul className="space-y-2.5">
              {[
                { label: "My Account", href: "/dashboard" },
                { label: "Order Tracking", href: "/dashboard/orders" },
                { label: "Returns & Refunds", href: "/faq#returns" },
                { label: "FAQ", href: "/faq" },
                { label: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-white mb-4">Get In Touch</h4>
            <div className="space-y-3">
              <a href="mailto:support@shopease.com" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" />
                support@shopease.com
              </a>
              <a href="tel:+919999999999" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" />
                +91 99999 99999
              </a>
              <div className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>123 Business Park,<br />Mumbai, Maharashtra 400001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-10 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
              {["Visa", "Mastercard", "RuPay", "UPI", "Stripe", "Razorpay"].map((method) => (
                <span key={method} className="px-3 py-1.5 bg-gray-800 text-gray-400 text-xs rounded-lg border border-gray-700">
                  {method}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span>·</span>
              <span>© {new Date().getFullYear()} ShopEase</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
