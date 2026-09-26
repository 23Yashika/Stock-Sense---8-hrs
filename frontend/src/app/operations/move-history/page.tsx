// src/app/operations/move-history/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  History,
  Search,
  List,
  Kanban,
  AlertCircle,
  LogIn,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  CheckCircle2,
  Package,
} from "lucide-react";
import {
  getStockLedgerApi,
  getReceiptsApi,
  getDeliveriesApi,
  StockLedgerItem,
  ReceiptItem,
  DeliveryOrder,
} from "@/lib/api";

interface MoveRow {
  id: string;
  reference: string;
  date: string;
  contact: string;
  from: string;
  to: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitOfMeasure: string;
  type: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";
  status: "Done" | "Ready" | "Draft" | "Cancelled";
}

export default function MoveHistoryPage() {
  const [moveRows, setMoveRows] = useState<MoveRow[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const fetchMoveHistory = async () => {
    setIsLoading(true);
    setAuthError("");
    try {
      const [ledgerRes, rcRes, delRes] = await Promise.all([
        getStockLedgerApi({ search: searchQuery }).catch(() => null),
        getReceiptsApi().catch(() => null),
        getDeliveriesApi().catch(() => null),
      ]);

      const rows: MoveRow[] = [];

      const ledgerList = ledgerRes?.ledger || (ledgerRes as any)?.data || [];
      const rcList = rcRes?.receipts || (rcRes as any)?.data || [];
      const delList = delRes?.deliveries || (delRes as any)?.data || [];

      if (!ledgerRes?.success && ledgerRes?.message) {
        setAuthError(ledgerRes.message);
      }

      // 1. Process Validated Stock Ledger Audit Entries (Done Moves)
      ledgerList.forEach((item: any) => {
        let fromLoc = "vendor";
        let toLoc = "vendor";
        let contactName = "System";

        if (item.moveType === "RECEIPT") {
          fromLoc = "vendor";
          toLoc = `${item.warehouse?.code || "WH"}/${item.location?.code || "Stock1"}`;
          contactName = item.receipt?.supplier?.name || "Azure Interior";
        } else if (item.moveType === "DELIVERY") {
          fromLoc = `${item.warehouse?.code || "WH"}/${item.location?.code || "Stock1"}`;
          toLoc = "vendor";
          contactName = item.delivery?.customer?.name || "Decathlon Retail";
        } else if (item.moveType === "TRANSFER") {
          fromLoc = `${item.transfer?.sourceWarehouse?.code || "WH"}/${item.transfer?.sourceLocation?.code || "Loc1"}`;
          toLoc = `${item.transfer?.destinationWarehouse?.code || "WH"}/${item.transfer?.destinationLocation?.code || "Loc2"}`;
          contactName = "Internal Transfer";
        } else {
          fromLoc = `${item.warehouse?.code || "WH"}/${item.location?.code || "Stock1"}`;
          toLoc = "Inventory Adjustment";
          contactName = "Physical Count";
        }

        rows.push({
          id: item.id,
          reference: item.referenceId,
          date: item.createdAt,
          contact: contactName,
          from: fromLoc,
          to: toLoc,
          productName: item.product?.name || "Unknown Item",
          productSku: item.product?.sku || "SKU",
          quantity: item.quantityDelta,
          unitOfMeasure: item.product?.unitOfMeasure || "Units",
          type: item.quantityDelta >= 0 ? "IN" : "OUT",
          status: "Done",
        });
      });

      // 2. Process Pending Receipts (Ready / Draft)
      rcList
        .filter((r: any) => r.status === "DRAFT")
        .forEach((r: any) => {
          r.items?.forEach((i: any) => {
            rows.push({
              id: `rc-${r.id}-${i.productId}`,
              reference: r.reference,
              date: r.scheduleDate || r.createdAt,
              contact: r.supplier?.name || "Azure Interior",
              from: "vendor",
              to: `${r.warehouse?.code || "WH"}/${r.location?.code || "Stock1"}`,
              productName: i.product?.name || "Steel Rods 10mm",
              productSku: i.product?.sku || "STL-1001",
              quantity: i.quantity,
              unitOfMeasure: i.product?.unitOfMeasure || "kg",
              type: "IN",
              status: "Ready",
            });
          });
        });

      // 3. Process Pending Deliveries (Ready / Picked / Packed)
      delList
        .filter((d: any) => d.status !== "DELIVERED" && d.status !== "CANCELLED")
        .forEach((d: any) => {
          d.items?.forEach((i: any) => {
            rows.push({
              id: `del-${d.id}-${i.productId}`,
              reference: d.reference,
              date: d.scheduleDate || d.createdAt,
              contact: d.customer?.name || "Decathlon Retail",
              from: `${d.warehouse?.code || "WH"}/${d.location?.code || "Stock1"}`,
              to: "vendor",
              productName: i.product?.name || "Steel Rods 10mm",
              productSku: i.product?.sku || "STL-1001",
              quantity: -i.quantity,
              unitOfMeasure: i.product?.unitOfMeasure || "kg",
              type: "OUT",
              status: "Ready",
            });
          });
        });

      setMoveRows(rows);
    } catch (err) {
      console.error("Error fetching move history:", err);
      setAuthError("Failed to connect to backend server (http://localhost:5000)");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoveHistory();
  }, []);

  const filteredMoves = moveRows.filter((m) => {
    const matchesSearch =
      m.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.productSku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === "ALL"
        ? true
        : typeFilter === "IN"
        ? m.type === "IN"
        : typeFilter === "OUT"
        ? m.type === "OUT"
        : true;

    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-400" /> Move History
            </h1>
            <span className="text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 font-mono">
              Live Stock Movement Audit
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, contact, product..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900">All Moves</option>
                <option value="IN" className="bg-slate-900">🟢 IN Moves (Receipts)</option>
                <option value="OUT" className="bg-slate-900">🔴 OUT Moves (Deliveries)</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode("list")}
                title="List View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                title="Kanban View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "kanban"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Auth Error Banner if user is not logged in */}
        {authError && (
          <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{authError} Log in to load live data from PostgreSQL.</span>
            </div>
            <Link
              href="/login"
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-xl flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Go to Login
            </Link>
          </div>
        )}

        {/* LIST VIEW (Matching Excalidraw Wireframe Table) */}
        {viewMode === "list" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">From</th>
                    <th className="py-3.5 px-4">To</th>
                    <th className="py-3.5 px-4">Product Line</th>
                    <th className="py-3.5 px-4">Quantity</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Loading inventory move history from PostgreSQL database...
                      </td>
                    </tr>
                  ) : filteredMoves.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No inventory moves recorded yet. Complete a Receipt or Delivery Order to generate stock moves!
                      </td>
                    </tr>
                  ) : (
                    filteredMoves.map((m) => {
                      const isIncoming = m.type === "IN" || m.quantity > 0;

                      return (
                        <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                            {m.reference}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono">
                            {new Date(m.date).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-slate-200 font-medium">
                            {m.contact}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-mono">{m.from}</td>
                          <td className="py-3.5 px-4 text-slate-300 font-mono">{m.to}</td>
                          <td className="py-3.5 px-4 text-slate-200">
                            <span className="font-semibold">{m.productName}</span>{" "}
                            <span className="text-[10px] text-slate-500 font-mono">({m.productSku})</span>
                          </td>

                          {/* Excalidraw Rule: IN event = GREEN, OUT move = RED */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-md text-xs border ${
                                isIncoming
                                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                  : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                              }`}
                            >
                              {isIncoming ? (
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                              )}
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unitOfMeasure}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${
                                m.status === "Done"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KANBAN VIEW */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Incoming Moves (Green) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Incoming Stock Moves (IN)
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 rounded-md">
                  {filteredMoves.filter((m) => m.type === "IN" || m.quantity > 0).length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredMoves
                  .filter((m) => m.type === "IN" || m.quantity > 0)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-4 bg-slate-900 border border-emerald-500/20 rounded-xl space-y-3 shadow-lg"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-emerald-400 text-xs">{m.reference}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(m.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Contact: <span className="font-semibold text-white">{m.contact}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        From: <span className="text-slate-200">{m.from}</span> → To: <span className="text-emerald-400">{m.to}</span>
                      </div>
                      <div className="pt-2 flex justify-between items-center border-t border-slate-800 text-xs">
                        <span className="text-slate-200 font-medium">{m.productName}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{m.quantity} {m.unitOfMeasure}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: Outgoing Moves (Red) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-rose-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-400" /> Outgoing Stock Moves (OUT)
                </span>
                <span className="px-2 py-0.5 bg-rose-500/20 rounded-md">
                  {filteredMoves.filter((m) => m.type === "OUT" || m.quantity < 0).length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredMoves
                  .filter((m) => m.type === "OUT" || m.quantity < 0)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-4 bg-slate-900 border border-rose-500/20 rounded-xl space-y-3 shadow-lg"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-rose-400 text-xs">{m.reference}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(m.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Contact: <span className="font-semibold text-white">{m.contact}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        From: <span className="text-rose-400">{m.from}</span> → To: <span className="text-slate-200">{m.to}</span>
                      </div>
                      <div className="pt-2 flex justify-between items-center border-t border-slate-800 text-xs">
                        <span className="text-slate-200 font-medium">{m.productName}</span>
                        <span className="font-mono font-bold text-rose-400">
                          {m.quantity} {m.unitOfMeasure}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
