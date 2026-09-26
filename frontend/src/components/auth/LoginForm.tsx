// src/components/auth/LoginForm.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Lock, LogIn } from "lucide-react";
import OtpResetModal from "./OtpResetModal";

export default function LoginForm() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Logging in with:", { loginId, password, rememberMe });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Field 1: Login ID */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Login ID</label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Enter your Login ID or Email"
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Field 2: Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <button
              type="button"
              onClick={() => setIsOtpModalOpen(true)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <span className="text-xs text-slate-400">Remember session</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" /> Login
        </button>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-emerald-400 font-semibold hover:text-emerald-300">
            Signup
          </Link>
        </p>
      </form>

      {/* OTP Reset Modal */}
      <OtpResetModal isOpen={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)} />
    </>
  );
}