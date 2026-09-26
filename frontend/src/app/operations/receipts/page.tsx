// src/app/operations/receipts/page.tsx
"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Inbox, Plus, CheckCircle2, ArrowRight } from "lucide-react";

export default function ReceiptsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Goods Receipts (Incoming Stock)</h1>
            <p className="text-xs text-slate-400">Receive items from vendors and auto-increase stock balance on Validation.</p>
          </div>
          <button className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Receipt
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="text-sm font-semibold text-white">Receipt Reference: WH/IN/00042</div>
            <span className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs rounded-md">
              Ready to Validate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div><span className="text-slate-500">Supplier:</span> Steel Rods Co.</div>
            <div><span className="text-slate-500">Destination:</span> Main Store / Rack A</div>
            <div><span className="text-slate-500">Scheduled Date:</span> 2026-09-26</div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Validate (Increase Stock +50)
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}