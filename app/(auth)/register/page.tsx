"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check } from "lucide-react";
import { useAuthStore } from "@/store";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import { ShieldCheck, Zap } from "lucide-react"; // Import some extra icons for the left side

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ verifyUrl?: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const passwordStrength = form.password.length >= 8
    ? [/[A-Z]/.test(form.password), /[a-z]/.test(form.password), /\d/.test(form.password)].filter(Boolean).length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", form);
      const { user, accessToken, verifyUrl } = res.data.data;
      setUser(user, accessToken);
      toast.success("Account created! Please verify your email.");
      setSuccessData({ verifyUrl });
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        const errorMessages = Object.values(errorData.errors).flat();
        if (errorMessages.length > 0) {
          toast.error(errorMessages[0] as string);
        } else {
          toast.error(errorData.message || "Registration failed");
        }
      } else {
        toast.error(errorData?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-4xl"
    >
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-black">
        {/* Left Side Branding */}
        <div className="hidden md:flex flex-col justify-between p-10 md:w-1/2 bg-green-900 border-r border-black relative">
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
              Start your journey with us.
            </h2>
            <p className="text-green-100 mb-8 leading-relaxed">
              Create an account to discover premium products, access exclusive deals, and elevate your everyday life.
            </p>
            
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center border border-green-700">
                  <ShieldCheck className="w-4 h-4 text-green-300" />
                </div>
                <span className="text-sm text-green-50 font-medium">100% Secure Shopping</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center border border-green-700">
                  <Zap className="w-4 h-4 text-green-300" />
                </div>
                <span className="text-sm text-green-50 font-medium">Instant Access & Checkout</span>
              </div>
            </div>
          </div>
          
          {/* Decorative blur inside left panel */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-green-600/30 rounded-full blur-[80px] pointer-events-none" />
        </div>

        {/* Right Side Form */}
        <div className="p-8 md:p-10 md:w-1/2 flex flex-col justify-center bg-gray-50/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-950">Create an account</h1>
            <p className="text-gray-600 text-sm mt-2">Join ShopEase and start shopping today</p>
          </div>

        {successData ? (
          <div className="text-center py-4">
            <h2 className="text-xl font-bold text-gray-950 mb-3">Check Your Email</h2>
            <p className="text-gray-600 text-sm mb-6">
              We've sent a verification link to <span className="font-semibold text-green-700">{form.email}</span>
            </p>
            {successData.verifyUrl && (
              <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 mb-6 text-left shadow-sm">
                <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-2">Development Fallback Link</p>
                <div className="bg-teal-100/50 p-2 rounded border border-teal-200 break-all text-xs text-teal-950 mb-3 font-mono">
                  {window.location.origin}{successData.verifyUrl}
                </div>
                <Link 
                  href={successData.verifyUrl} 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2.5 text-sm text-center inline-block transition-colors font-medium"
                >
                  Verify Email Now
                </Link>
              </div>
            )}
            <p className="text-xs text-gray-500">
              You can safely close this window.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                required
                minLength={2}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Phone Number <span className="text-gray-450 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 characters"
                required
                minLength={8}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength */}
            {form.password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength >= level
                          ? level === 1 ? "bg-red-400" : level === 2 ? "bg-yellow-400" : "bg-green-400"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { check: /[A-Z]/.test(form.password), label: "Uppercase" },
                    { check: /[a-z]/.test(form.password), label: "Lowercase" },
                    { check: /\d/.test(form.password), label: "Number" },
                  ].map(({ check, label }) => (
                    <div key={label} className={`flex items-center gap-1 text-xs ${check ? "text-green-600" : "text-gray-400"}`}>
                      <Check className="w-3 h-3" /> {label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-600">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-900">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-gray-900">Privacy Policy</Link>.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-medium rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 mt-4 transition-colors shadow-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-black font-bold hover:text-gray-900 hover:underline transition-colors">
            Sign In
          </Link>
        </p>
        </>
        )}
        </div>
      </div>
    </motion.div>
  );
}
