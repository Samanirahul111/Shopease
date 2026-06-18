import Link from "next/link";
import { Package, ShieldCheck, Zap, Star } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative bg-gray-50 overflow-hidden">
      {/* Background Mesh (Global) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-teal-500/5" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <div className="flex-shrink-0 p-6 relative z-10 flex justify-center lg:justify-start">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Shop<span className="text-teal-600">Ease</span>
          </span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        {children}
      </div>
    </div>
  );
}
