"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Chrome, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import { ShieldCheck, Zap } from "lucide-react"; // Import some extra icons for the left side

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const verified = searchParams.get("verified");
  const { setUser, isAuthenticated } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirect);
    }
  }, [isAuthenticated, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", form);
      const { user, accessToken } = res.data.data;
      setUser(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);
      setIsSuccess(true);
      setTimeout(() => {
        router.push(user.role === "ADMIN" ? "/admin" : redirect);
      }, 2000);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        const errorMessages = Object.values(errorData.errors).flat();
        if (errorMessages.length > 0) {
          toast.error(errorMessages[0] as string);
        } else {
          toast.error(errorData.message || "Login failed");
        }
      } else {
        toast.error(errorData?.message || "Login failed");
      }
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-4xl relative"
    >
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-black relative">
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.1 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/40"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-extrabold text-green-950"
              >
                Login Successful!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-green-700 mt-2 font-medium"
              >
                Redirecting to your account...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Left Side Branding */}
        <div className="hidden md:flex flex-col justify-between p-10 md:w-1/2 bg-green-900 border-r border-black relative">
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
              Elevate your shopping experience.
            </h2>
            <p className="text-green-100 mb-8 leading-relaxed">
              Sign in to access your personalized recommendations, track your orders, and enjoy faster checkout.
            </p>
            
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center border border-green-700">
                  <ShieldCheck className="w-4 h-4 text-green-300" />
                </div>
                <span className="text-sm text-green-50 font-medium">Secure & encrypted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center border border-green-700">
                  <Zap className="w-4 h-4 text-green-300" />
                </div>
                <span className="text-sm text-green-50 font-medium">Lightning fast checkout</span>
              </div>
            </div>
          </div>
          
          {/* Decorative blur inside left panel */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-green-600/30 rounded-full blur-[80px] pointer-events-none" />
        </div>

        {/* Right Side Form */}
        <div className="p-8 md:p-10 md:w-1/2 flex flex-col justify-center bg-gray-50/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-950">Welcome back</h1>
            <p className="text-gray-600 text-sm mt-2">Sign in to your account to continue</p>
          </div>

        {verified === "1" && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-4 mb-6 flex items-start gap-3">
            <div className="bg-green-100 p-1 rounded-full text-green-600 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">Email verified!</p>
              <p className="text-green-700 mt-0.5">You can now sign in to your account.</p>
            </div>
          </div>
        )}

        {/* Google Login */}
        <a
          href="/api/auth/google"
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-750 hover:bg-gray-50 transition-colors mb-6 shadow-sm"
        >
          <Chrome className="w-5 h-5 text-gray-600" />
          Continue with Google
        </a>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative bg-gray-50 px-4 text-sm text-gray-500 flex justify-center w-max mx-auto">or continue with email</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-900">Password</label>
              <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                required
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-medium rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 mt-4 transition-colors shadow-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-black font-bold hover:text-gray-900 hover:underline transition-colors">
            Create Account
          </Link>
        </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
