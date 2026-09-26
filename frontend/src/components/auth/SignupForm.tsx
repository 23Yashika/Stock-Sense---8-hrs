// src/components/auth/SignupForm.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Lock, UserCheck, ShieldCheck } from "lucide-react";

export default function SignupForm() {
  const [loginId, setLoginId] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // Public signup automatically registers as Inventory Manager
    console.log("Signing up Inventory Manager:", {
      loginId,
      userName,
      role: "Inventory Manager",
      password,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Role Badge Indicator */}
      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Registering as: <strong>Inventory Manager</strong></span>
      </div>

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
            placeholder="Enter Login ID (e.g. MGR-101)"
            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Field 2: User Name */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">User Name</label>
        <div className="relative">
          <UserCheck className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your Full Name"
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
        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all"
      >
        Signup as Inventory Manager
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