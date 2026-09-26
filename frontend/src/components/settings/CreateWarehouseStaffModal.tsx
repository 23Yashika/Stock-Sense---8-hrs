// src/components/settings/CreateWarehouseStaffModal.tsx
"use client";

import React, { useState } from "react";
import { X, UserPlus, User, UserCheck, Lock, Warehouse, CheckCircle2 } from "lucide-react";

interface CreateWarehouseStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (staffData: { loginId: string; userName: string }) => void;
}

export default function CreateWarehouseStaffModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWarehouseStaffModalProps) {
  const [loginId, setLoginId] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    console.log("Creating Warehouse Staff member:", {
      loginId,
      userName,
      role: "Warehouse Staff",
      password,
    });

    setIsSuccess(true);

    if (onSuccess) {
      onSuccess({ loginId, userName });
    }

    setTimeout(() => {
      setIsSuccess(false);
      setLoginId("");
      setUserName("");
      setPassword("");
      setConfirmPassword("");
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
            <h3 className="text-2xl font-bold text-white">Staff Member Created!</h3>
            <p className="text-xs text-slate-400">
              Warehouse Staff account for <span className="text-slate-200 font-semibold">{userName}</span> ({loginId}) has been initialized.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Create Warehouse Staff</h3>
                <p className="text-xs text-slate-400">
                  Add staff members for picking, shelving, counting, and stock transfers.
                </p>
              </div>
            </div>

            {/* Locked Role Banner */}
            <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
              <Warehouse className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Assigned Role: <strong className="text-teal-400">Warehouse Staff</strong></span>
            </div>

            {/* Field 1: Login ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Login ID</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. STF-201"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Field 2: User Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">User Name</label>
              <div className="relative">
                <UserCheck className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Full Name of Warehouse Staff"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Field 3 & 4: Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/40 transition-all"
              >
                Create Staff Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
