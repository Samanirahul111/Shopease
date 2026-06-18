"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import axios from "axios";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the URL.");
      return;
    }

    let isMounted = true;
    
    axios.get(`/api/auth/verify-email?token=${token}`)
      .then((res) => {
        if (isMounted) {
          setStatus("success");
          setMessage(res.data.message || "Email verified successfully!");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStatus("error");
          setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
        }
      });
      
    return () => { isMounted = false; };
  }, [token]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
            <p className="text-gray-500 text-sm">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Success!</h1>
            <p className="text-gray-500 text-sm mb-8">{message}</p>
            <Link 
              href="/login?verified=1" 
              className="w-full btn-primary py-3 flex justify-center items-center gap-2"
            >
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 text-sm mb-8">{message}</p>
            <Link 
              href="/register" 
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              Try creating an account again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
