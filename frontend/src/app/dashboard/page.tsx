// src/app/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Package,
  AlertTriangle,
  Inbox,
  Truck,
  ArrowRightLeft,
  Filter,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const [docFilter, setDocFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const kpis = [
    { label: "Total Products in Stock", value: "1,248 Units", icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Low / Out of Stock Items", value: "14 Items", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Pending Receipts", value: "8 Delivery Orders", icon: Inbox, color: "text-teal-400", bg: "bg-teal-500/10" },
    { label: "Pending Deliveries", value: "12 Orders", icon: Truck, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Internal Transfers Scheduled", value: "5 Moves", icon: ArrowRightLeft, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  ];

  const recentOperations = [
    { ref: "WH/IN/00042", type: "Receipt", from: "Steel Vendor Ltd", to: "Main Store", items: "100 kg Steel", status: "Ready", date: "Today" },
    { ref: "WH/OUT/00018", type: "Delivery Order", from: "Main Store", to: "Customer #401", items: "20 Steel Frames", status: "Waiting", date: "Today" },
    { ref: "WH/INT/00009", type: "Internal Transfer", from: "Main Store", to: "Production Rack", items: "50 kg Steel", status: "Done", date: "Yesterday" },
    { ref: "WH/ADJ/00003", type: "Stock Adjustment", from: "Rack B", to: "Scrap", items: "3 kg Steel (Damaged)", status: "Done", date: "Yesterday" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory Dashboard</h1>
            <p className="text-xs text-slate-400">Snapshot of warehouse stock, pending operations, and transfers.</p>
          </div>
        </div>

        {/* Top KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{kpi.label}</span>
                  <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{kpi.value}</div>
              </div>
            );
          })}
        </div>

        {/* Operations & Dynamic Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" /> Stock Movement Operations
            </h2>

            {/* Dynamic Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Document Types</option>
                <option value="Receipt">Receipts (Incoming)</option>
                <option value="Delivery Order">Delivery Orders</option>
                <option value="Internal Transfer">Internal Transfers</option>
                <option value="Stock Adjustment">Adjustments</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Waiting">Waiting</option>
                <option value="Ready">Ready</option>
                <option value="Done">Done</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>
          </div>

          {/* Operations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Items / Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOperations
                  .filter((op) => docFilter === "ALL" || op.type === docFilter)
                  .filter((op) => statusFilter === "ALL" || op.status === statusFilter)
                  .map((op, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{op.ref}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{op.type}</td>
                      <td className="py-3 px-4 text-slate-400">{op.from}</td>
                      <td className="py-3 px-4 text-slate-400">{op.to}</td>
                      <td className="py-3 px-4 text-slate-300">{op.items}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                            op.status === "Done"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : op.status === "Ready"
                              ? "bg-teal-500/10 border-teal-500/20 text-teal-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          }`}
                        >
                          {op.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-right">{op.date}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}