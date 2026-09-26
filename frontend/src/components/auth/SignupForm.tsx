// src/components/auth/SignupForm.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import { signupUser, setAuthToken } from "@/lib/api";

export default function SignupForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const data = await signupUser({
        loginId,
        email: emailId,
        password,
        confirmPassword,
      });

      if (!data.success) {
        setErrorMessage(data.message || "Signup failed");
        setIsLoading(false);
        return;
      }

      if (data.token) {
        setAuthToken(data.token);
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMessage("Unable to connect to StockSense server (http://localhost:5000)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Role Badge Indicator */}
      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Registering as: <strong>Inventory Manager</strong></span>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

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
            placeholder="Enter Login ID (6-12 chars)"
            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Field 2: Email ID */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Email ID</label>
        <div className="relative">
          <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="email"
            required
            value={emailId}
            onChange={(e) => setEmailId(e.target.value)}
            placeholder="manager@stocksense.io"
            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Field 3: Password */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Password</label>
        <div className="relative">
          <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Field 4: Confirm Password */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
        <div className="relative">
          <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all"
      >
        {isLoading ? "Signing up..." : "Signup as Inventory Manager"}
      </button>

      <p className="text-center text-xs text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-400 font-semibold hover:text-emerald-300">
          Login
        </Link>
      </p>
    </form>
  );
}