// src/components/auth/OtpResetModal.tsx
"use client";

import React, { useState } from "react";
import { X, Mail, KeyRound, Lock, CheckCircle2, ArrowRight } from "lucide-react";

interface OtpResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OtpResetModal({ isOpen, onClose }: OtpResetModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isOpen) return null;

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    // Auto-focus next input field
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleResetComplete = () => {
    setStep(4);
    setTimeout(() => {
      onClose();
      setStep(1);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Reset Password</h3>
                <p className="text-xs text-slate-400">Enter your email to receive a 6-digit verification code.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Work Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@stocksense.io"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!email}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Send OTP Code <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Enter Verification Code</h3>
                <p className="text-xs text-slate-400">We sent a 6-digit code to <span className="text-slate-200 font-medium">{email}</span></p>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-12 h-12 text-center text-lg font-bold bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={otp.some((d) => !d)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Verify Code <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Create New Password</h3>
                <p className="text-xs text-slate-400">Choose a secure password for your account.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleResetComplete}
              disabled={!newPassword || newPassword !== confirmPassword}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Update Password
            </button>
          </div>
        )}

        {/* Step 4: Success Message */}
        {step === 4 && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
            <h3 className="text-2xl font-bold text-white">Password Updated!</h3>
            <p className="text-xs text-slate-400">You can now sign in with your new credentials.</p>
          </div>
        )}
      </div>
    </div>
  );
}