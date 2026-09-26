// src/components/auth/AuthLayout.tsx
import React from "react";
import { Boxes, ShieldCheck, ArrowRightLeft, TrendingUp } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-900 text-slate-100 font-sans">
      {/* Left Banner: Brand & Feature Highlights */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-950 border-r border-slate-800 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Boxes className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">StockSense</span>
          </div>
          
          <div className="mt-16 space-y-6">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Real-time Inventory & Stock Streamlining
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Digitize receipts, delivery orders, internal transfers, and physical counts in one centralized ledger.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Role-Based Access</h4>
                <p className="text-xs text-slate-400 mt-1">Dedicated flows for Inventory Managers & Warehouse Staff.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm">
              <ArrowRightLeft className="w-6 h-6 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Multi-Location Movements</h4>
                <p className="text-xs text-slate-400 mt-1">Seamless rack-to-rack and warehouse transfers with live ledger logging.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm">
              <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Smart Stock Alerts</h4>
                <p className="text-xs text-slate-400 mt-1">Automatic low-stock threshold triggers and reordering rules.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} StockSense IMS. All rights reserved.
        </div>
      </div>

      {/* Right Content: Dynamic Auth Card */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}